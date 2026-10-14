#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite(news_database.db) -> 정적 JSON 변환 스크립트

공개 포트폴리오 데모(Vercel 단독 배포)용으로, FastAPI 서버가 내려주던 응답과
동일한 내용을 frontend/public/data/*.json 으로 추출한다.

- 뉴스 본문/제목/요약/날짜/카테고리/이미지 URL 은 DB 값을 그대로 보존한다.
- 트렌드 키워드와 핫이슈(TOP 5)는 백엔드와 같은 로직으로 재계산한다.
  (trend: database/db_handler.get_realtime_trend_keywords,
   top5 : utils/cluster.cluster_and_get_top_news)
- users / favorites 테이블은 개인정보이므로 추출하지 않는다.

사용법:
    python scripts/export_static_data.py
    python scripts/export_static_data.py --db backend/database/news_database.db \
                                         --out frontend/public/data
    python scripts/export_static_data.py --no-cluster   # scikit-learn 없이 실행
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import sys
from collections import Counter
from datetime import datetime, timezone

SEP = "|"
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB = os.path.join(REPO_ROOT, "backend", "database", "news_database.db")
DEFAULT_OUT = os.path.join(REPO_ROOT, "frontend", "public", "data")

# backend/database/db_handler.py 의 get_realtime_trend_keywords 와 동일
TREND_STOP_WORDS = {
    "뉴스", "기사", "오늘", "내일", "오전", "오후",
    "단독", "포토", "종합", "출시", "개최", "선정", "진행",
}


def expand_categories(row: dict) -> dict:
    """backend/main.py 의 _expand_categories 와 동일한 규칙."""
    cat = row.get("category") or ""
    row["categories"] = [c for c in str(cat).split(SEP) if c]
    return row


def fetch_news(conn: sqlite3.Connection) -> list[dict]:
    """news 테이블 전체를 id 내림차순(=API 기본 정렬)으로 반환."""
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM news ORDER BY id DESC").fetchall()
    return [expand_categories(dict(r)) for r in rows]


def fetch_daily_summary(conn: sqlite3.Connection) -> dict | None:
    """최신 데일리 요약 1건 (GET /api/news/daily-summary 와 동일)."""
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT * FROM daily_summary ORDER BY id DESC LIMIT 1"
    ).fetchone()
    if not row:
        return None
    row = dict(row)
    return {
        "status": "success",
        "date": row.get("created_at"),
        "title": row.get("title"),
        "data": json.loads(row["summary_json"]),
    }


def build_trends(conn: sqlite3.Connection, limit_news: int = 300, top_n: int = 10) -> list[dict]:
    """GET /api/news/trend 과 동일한 키워드 집계."""
    titles = [
        r[0]
        for r in conn.execute(
            "SELECT title FROM news ORDER BY id DESC LIMIT ?", (limit_news,)
        ).fetchall()
    ]
    words: list[str] = []
    for title in titles:
        clean = re.sub(r"[^가-힣a-zA-Z0-9\s]", " ", title or "")
        for word in clean.split():
            if 1 < len(word) <= 5 and word not in TREND_STOP_WORDS:
                words.append(word)
    counts = Counter(words)
    return [
        {"rank": i + 1, "keyword": word, "count": count}
        for i, (word, count) in enumerate(counts.most_common(top_n))
    ]


def build_hot_issues(news: list[dict], n_clusters: int = 5) -> list[dict]:
    """GET /api/news/top5 과 동일하게 최근 50건을 K-Means 군집화해 대표 기사 추출."""
    sys.path.insert(0, os.path.join(REPO_ROOT, "backend"))
    from utils.cluster import cluster_and_get_top_news  # noqa: E402

    latest = [dict(n) for n in news[:50]]  # get_latest_news(limit=50) 과 동일
    top = cluster_and_get_top_news(latest, n_clusters=n_clusters)
    return [expand_categories(dict(n)) for n in top]


def write_json(path: str, payload) -> int:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    return os.path.getsize(path)


def main() -> int:
    parser = argparse.ArgumentParser(description="SQLite 뉴스 DB를 정적 JSON으로 변환")
    parser.add_argument("--db", default=DEFAULT_DB, help="SQLite 파일 경로")
    parser.add_argument("--out", default=DEFAULT_OUT, help="JSON 출력 디렉터리")
    parser.add_argument(
        "--no-cluster",
        action="store_true",
        help="scikit-learn 없이 실행 (hot-issues.json 은 기존 파일 유지)",
    )
    args = parser.parse_args()

    if not os.path.exists(args.db):
        print(f"❌ DB 파일을 찾을 수 없습니다: {args.db}")
        return 1

    os.makedirs(args.out, exist_ok=True)
    conn = sqlite3.connect(args.db)

    news = fetch_news(conn)
    daily = fetch_daily_summary(conn)
    trends = build_trends(conn)

    hot_issues = None
    if args.no_cluster:
        print("⚠️  --no-cluster: hot-issues.json 은 다시 만들지 않습니다.")
    else:
        try:
            hot_issues = build_hot_issues(news)
        except ImportError as exc:
            print(f"❌ 핫이슈 군집화에 scikit-learn 이 필요합니다 ({exc}).")
            print("   pip install scikit-learn numpy  또는  --no-cluster 로 실행하세요.")
            conn.close()
            return 1

    conn.close()

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    data_as_of = (daily or {}).get("date") or ""
    sizes = {}

    sizes["news.json"] = write_json(
        os.path.join(args.out, "news.json"),
        {"status": "success", "count": len(news), "data": news},
    )
    if daily:
        sizes["daily-news.json"] = write_json(
            os.path.join(args.out, "daily-news.json"), daily
        )
    sizes["trends.json"] = write_json(
        os.path.join(args.out, "trends.json"),
        {"status": "success", "count": len(trends), "data": trends},
    )
    if hot_issues is not None:
        sizes["hot-issues.json"] = write_json(
            os.path.join(args.out, "hot-issues.json"),
            {"status": "success", "count": len(hot_issues), "data": hot_issues},
        )
    sizes["metadata.json"] = write_json(
        os.path.join(args.out, "metadata.json"),
        {
            "generated_at": generated_at,
            "data_as_of": data_as_of,
            "source": "backend/database/news_database.db",
            "counts": {
                "news": len(news),
                "daily_news": len((daily or {}).get("data", [])),
                "trends": len(trends),
                "hot_issues": len(hot_issues) if hot_issues is not None else None,
            },
            "news_id_range": [news[-1]["id"], news[0]["id"]] if news else [],
            "published_at_range": [news[-1]["published_at"], news[0]["published_at"]] if news else [],
        },
    )

    print(f"✅ 변환 완료 ({args.out})")
    for name, size in sizes.items():
        print(f"   - {name}: {size / 1024:.1f} KB")
    print(f"   뉴스 {len(news)}건 / 데일리 {len((daily or {}).get('data', []))}건 / "
          f"트렌드 {len(trends)}건 / 핫이슈 {len(hot_issues) if hot_issues else 0}건")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
