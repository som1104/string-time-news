# run_pipeline.py
import time
import html
import os
import json
import re
import numpy as np
from datetime import datetime

# 프로젝트 서브 모듈 임포트
from utils.scraper import fetch_naver_news_links, extract_article_text, get_news_image
from utils.summarizer import summarize_news_with_ollama
from utils.filter import is_duplicate_news, is_duplicate_summary, remove_batch_duplicates
from utils.classifier import predict_category
from utils.trend_explorer import get_dynamic_keywords
from database.db_handler import init_db, save_to_database, get_recent_titles, get_connection

# 👇 데일리 요약은 daily_job.py 한 곳에서만 관리합니다
from daily_job import generate_daily_news_summary

SEP = "|"


def _normalize_labels(labels):
    """
    predict_category 결과(리스트)를 정리:
      - 레거시 '사회' -> '사회/세계' 보정
      - 중복 제거, 빈 값 제거, 최소 1개 보장
    """
    if isinstance(labels, str):
        labels = [x for x in labels.split(SEP) if x]
    out = []
    for lab in labels:
        lab = "사회/세계" if lab == "사회" else lab
        if lab and lab not in out:
            out.append(lab)
    return out or ["사회/세계"]


def clean_api_title(raw_title):
    """네이버 검색 API 제목의 <b> 태그, &quot; 등 HTML 노이즈 정제."""
    if not raw_title:
        return ""
    cleaned = re.sub(r'</?b>', '', raw_title)
    cleaned = html.unescape(cleaned)
    return cleaned.strip()


def start_pipeline(keyword, count=3):
    """단일 검색어 기반 뉴스 수집-분류-요약 파이프라인."""
    init_db()

    news_items = fetch_naver_news_links(keyword, display_count=10)
    if not news_items:
        return

    current_batch_titles = []
    saved_count = 0

    for item in news_items:
        if saved_count >= count:
            break

        clean_title_val = clean_api_title(item['title'])

        if is_duplicate_news(clean_title_val, current_batch_titles):
            print(f"Skip ➔ 이번 턴 중복 차단: {clean_title_val[:20]}...")
            continue

        print(f"\n[{keyword} - {saved_count + 1}] 제목: {clean_title_val}")

        text = extract_article_text(item['link'])
        if not text or len(text) < 150:
            print("Skip ➔ 본문 글자 수 부족")
            continue

        image_url = get_news_image(item['link'])

        # 1.5단계: 멀티라벨 카테고리 추론 (리스트 반환)
        categories = _normalize_labels(predict_category(clean_title_val, text))
        print(f"🏷️ AI 모델 판정: [{SEP.join(categories)}]")

        # 2단계: 로컬 AI 3줄 요약
        summaries = summarize_news_with_ollama(text)
        if not summaries or len(summaries) == 0:
            print("❌ 요약 생성 실패로 스킵")
            continue

        # 2.5단계: 요약문 기반 내용 중복 필터
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT summary_1 FROM news ORDER BY id DESC LIMIT 50;")
            existing_summaries = [row[0] for row in cursor.fetchall() if row[0]]
            conn.close()
        except Exception:
            existing_summaries = []

        new_summary_1 = summaries[0]
        if is_duplicate_summary(new_summary_1, existing_summaries, threshold=0.75):
            print("Skip ➔ 요약 내용 중복 필터 걸림 (받아쓰기 기사)")
            continue

        # 3단계: 적재 (category 는 리스트로 넘기면 db_handler가 'A|B'로 저장)
        save_to_database(
            title=clean_title_val,
            published_at=item['pubDate'],
            summaries=summaries,
            original_url=item['link'],
            category=categories,
            image_url=image_url
        )
        print(f"💾 DB 적재 성공! (카테고리: {SEP.join(categories)})")

        current_batch_titles.append(clean_title_val)
        saved_count += 1
        time.sleep(0.3)


def total_news_pipeline_job():
    print("\n🔍 실시간 이슈 수집을 시작합니다...")
    search_keywords = get_dynamic_keywords()

    all_raw_news = []
    for keyword in search_keywords:
        print(f"📡 수집 중: {keyword}")
        items = fetch_naver_news_links(keyword, display_count=5)
        all_raw_news.extend(items)

    unique_news = remove_batch_duplicates(all_raw_news)

    for item in unique_news:
        try:
            text = extract_article_text(item['link'])
            if not text or len(text) < 150:
                continue

            summary = summarize_news_with_ollama(text)
            categories = _normalize_labels(predict_category(clean_api_title(item['title']), text))

            save_to_database(
                title=clean_api_title(item['title']),
                published_at=item['pubDate'],
                summaries=summary,
                original_url=item['link'],
                category=categories,
                image_url=get_news_image(item['link'])
            )
        except Exception as e:
            print(f"❌ 처리 중 오류: {e}")





if __name__ == "__main__":
    print("📢 [시스템 가동] 실시간 뉴스 AI 요약 파이프라인 수집기를 시작합니다.")
    print("🎯 본 프로그램은 매시 '정각(00분)' 및 '30분'에 자동으로 수집을 시작합니다.")
    print("💡 'Ctrl + C'를 누르면 지연 없이 즉시 완전히 꺼집니다!\n")

    DAILY_HOUR = 10
    DAILY_MINUTE = 21

    daily_summary_done = False
    pipeline_job_done = False

    try:
        while True:
            now = datetime.now()

            if now.minute in [0, 30] and now.second == 0:
                if not pipeline_job_done:
                    print(f"\n⏰ [{now.strftime('%H:%M:%S')}] 정기 뉴스 수집 타이밍 달성! 파이프라인을 가동합니다.")
                    total_news_pipeline_job()
                    pipeline_job_done = True
                    print("💤 수집 완료. 다음 정각 혹은 30분 타이밍까지 대기합니다...")

            if now.minute in [1, 31]:
                pipeline_job_done = False

            if now.hour == DAILY_HOUR and now.minute == DAILY_MINUTE and now.second == 0:
                if not daily_summary_done:
                    print(f"\n🌅 [{now.strftime('%H:%M:%S')}] 데일리 요약 실행 시간이 되었습니다!")
                    generate_daily_news_summary()
                    daily_summary_done = True

            if now.hour == 0 and now.minute == 0:
                daily_summary_done = False

            time.sleep(1)

    except KeyboardInterrupt:
        print("\n🛑 [종료 시그널 확인] 사용자가 종료(Ctrl+C)를 지시했습니다. 프로그램을 종료합니다.")
        print("👋 뉴스 백엔드 파이프라인이 정상 종료되었습니다.")
