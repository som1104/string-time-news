# backend/utils/filter.py
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def clean_title(title):
    """
    뉴스 제목의 모든 노이즈를 완벽하게 걷어냅니다.
    - [수정] <b>, </b> 등 HTML 태그를 '가장 먼저' 제거 (안 그러면 태그 안의 b가 글자로 남아 중복 비교가 오염됨)
    - [포토], [단독], &quot; 등 말머리와 HTML 특수문자 전면 제거
    - 주요 한자(金, 尹, 韓 등)를 한글 키워드로 강제 변환
    - 모든 공백과 문장 부호를 날려 순수 '글자 덩어리'로 압축
    """
    if not title:
        return ""

    # 0. 🔥 [핵심 수정] HTML 태그(<b>, </b> 등)를 압축 전에 먼저 제거
    #    이게 없으면 re.sub(r'[^\w]', ...) 단계에서 <, >, /는 지워져도
    #    태그 안의 'b'는 \w(단어 문자)라 살아남아 'b삼성b전자'처럼 오염됨.
    title = re.sub(r'<[^>]+>', '', title)

    # 1. HTML 엔티티 및 기호 정제
    title = title.replace("&quot;", "").replace("&amp;", "").replace("…", "").replace("'", "").replace('"', "")
    title = title.replace("“", "").replace("”", "").replace("‘", "").replace("’", "")

    # 2. 대괄호, 소괄호 말머리 및 내부 내용 날리기
    title = re.sub(r'\[.*?\]', '', title)
    title = re.sub(r'\(.*?\)', '', title)

    # 3. 🔥 핵심: 언론사가 즐겨 쓰는 주요 한자 매핑 방어
    hanja_map = {
        "金": "김", "尹": "윤", "韓": "한", "美": "미", "中": "중",
        "日": "일", "北": "북", "獨": "독", "英": "영", "檢": "검", "李": "이"
    }
    for hanja, hangul in hanja_map.items():
        title = title.replace(hanja, hangul)

    # 4. 특수문자 제거 후 공백 없이 문자만 압축
    title = re.sub(r'[^\w]', '', title)
    return title.strip()

def is_duplicate_news(new_title, existing_titles, threshold=0.55):
    """
    수정된 중복 체크:
    이미 정제된 리스트(existing_titles)를 입력받는 게 아니라,
    함수 내부에서 모든 비교 대상을 clean_title로 통일하여 정제합니다.
    """
    if not existing_titles:
        return False

    # [수정 핵심] 입력받은 모든 existing_titles를 즉석에서 clean_title 적용
    # 이 과정이 없으면 원문 vs 정제본이 비교되어 중복을 못 잡습니다.
    cleaned_new = clean_title(new_title)
    cleaned_existing = [clean_title(t) for t in existing_titles if t]

    if not cleaned_new or not cleaned_existing:
        return False

    # 1차: 100% 일치 차단
    if cleaned_new in cleaned_existing:
        print(f"🛑 [정제 후 100% 매칭] 중복 차단: {new_title[:20]}...")
        return True

    # 3차: 유사도 차단
    vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(2, 4))
    try:
        all_titles = cleaned_existing + [cleaned_new]
        tfidf_matrix = vectorizer.fit_transform(all_titles)

        target_vector = tfidf_matrix[-1]
        existing_vectors = tfidf_matrix[:-1]

        similarity_scores = cosine_similarity(target_vector, existing_vectors).flatten()
        max_similarity = np.max(similarity_scores)

        if max_similarity >= threshold:
            print(f"🛑 [유사도 {max_similarity:.2f} 감지] 중복 차단: {new_title[:20]}...")
            return True

        return False
    except Exception as e:
        return False

def is_duplicate_summary(new_summary, existing_summaries, threshold=0.75):
    """
    [2차 방어벽: 요약문 기반 코사인 유사도 검사]
    제목 필터를 교묘하게 뚫고 들어온 동일 사건 받아쓰기 기사를
    LLM 요약 1순위 문장(누가, 무엇을 했다) 기준으로 최종 필터링합니다.
    """
    if not existing_summaries:
        return False

    try:
        # 글자 자소/공백 노이즈 방지를 위해 글자 단위(char) 2~3글자 묶음(ngram) 분석기 활용
        vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(2, 3))

        # 신규 요약문과 기존 DB에서 가져온 최신 요약문들을 하나의 매트릭스로 묶어 벡터화
        all_summaries = [new_summary] + existing_summaries
        tfidf_matrix = vectorizer.fit_transform(all_summaries)

        # 0번째 인덱스(신규 기사)와 1번째 이후(기존 기사들) 간의 코사인 유사도 계산
        similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
        max_sim = np.max(similarity_matrix)

        # 설정한 기준치(75%)를 넘으면 완전한 내용 중복 기사로 간주
        if max_sim >= threshold:
            print(f"🛑 [2차 요약문 중복 검사 걸림] 유사도: {max_sim:.2f} ➔ 동일 사건 복사 기사로 판정되어 차단합니다.")
            return True
    except Exception as e:
        print(f"⚠️ 요약문 유사도 계산 중 예외 발생 (안전을 위해 스킵 후 저장 진행): {e}")

    return False

def remove_batch_duplicates(news_items, threshold=0.6):
    """
    이번 턴에 수집된 뉴스 리스트(news_items) 내에서 중복 제거
    - [수정] threshold 인자를 is_duplicate_news에 실제로 전달 (기존엔 선언만 하고 안 씀)
    """
    unique_items = []
    seen_titles = []

    for item in news_items:
        title = clean_title(item['title'])

        # 이미 턴 내에서 확정된 unique_items의 제목들과 비교
        # is_duplicate_news 함수를 재활용하여 유사도 판단
        # [수정] threshold를 그대로 넘겨줘야 의도한 기준치(0.6)가 적용됨
        if not any(is_duplicate_news(title, [seen], threshold=threshold) for seen in seen_titles):
            unique_items.append(item)
            seen_titles.append(title)

    return unique_items