# backend/test_pipeline.py
"""
뉴스 파이프라인 테스트 스크립트.

실행 위치: backend/ 폴더 (run_pipeline.py 와 같은 위치)
    (.venv) PS ...\backend> python test_pipeline.py

[1] 오프라인 테스트: 네이버 API / Ollama / 네트워크 없이 즉시 검증
    - clean_title 의 <b> 태그 제거
    - is_duplicate_news 의 턴 내 중복 탐지
    - remove_batch_duplicates 의 배치 중복 제거
    - is_published_today 의 오늘/어제 판별
[2] 전체 실행 테스트: RUN_FULL_PIPELINE = True 로 바꾸면
    실제 total_news_pipeline_job() 을 1회 강제 실행 (API 키 + Ollama 필요)
"""

from datetime import datetime, timedelta

from utils.filter import clean_title, is_duplicate_news, remove_batch_duplicates
from utils.classifier import is_published_today

# 전체 파이프라인까지 실제로 돌려볼지 여부 (기본 False = 오프라인 테스트만)
RUN_FULL_PIPELINE = True


def _naver_date(dt):
    """네이버 pubDate 포맷 문자열 생성 (예: Tue, 14 Jul 2026 09:00:00 +0900)"""
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return (f"{days[dt.weekday()]}, {dt.day:02d} {months[dt.month-1]} "
            f"{dt.year} {dt.hour:02d}:{dt.minute:02d}:00 +0900")


# 간단한 검증 헬퍼 (assert 대신, 실패해도 다음 테스트 계속 진행)
_passed = 0
_failed = 0


def check(name, got, expected):
    global _passed, _failed
    ok = got == expected
    mark = "✅" if ok else "❌"
    print(f"{mark} {name}\n     기대={expected!r}  실제={got!r}")
    if ok:
        _passed += 1
    else:
        _failed += 1


def test_clean_title_strips_b_tags():
    print("\n[TEST] clean_title 의 <b> 태그 제거")
    # 같은 기사인데 검색 키워드에 따라 <b> 위치만 다른 두 케이스
    a = clean_title("<b>삼성</b>전자 반도체 신기록")
    b = clean_title("삼성전자 <b>반도체</b> 신기록")
    # 태그 제거가 잘 됐다면 'b' 글자가 남지 않고, 둘이 완전히 동일해야 함
    check("태그 안 b 글자가 안 남음", "b" in a, False)
    check("<b> 위치만 다른 같은 제목이 동일하게 정제됨", a, b)


def test_is_duplicate_news_turn_dedup():
    print("\n[TEST] is_duplicate_news 턴 내 중복 탐지")
    seen = ["<b>삼성</b>전자 반도체 신기록"]
    # <b> 위치만 다른 같은 기사 → 중복으로 잡혀야 True
    check("같은 기사(태그 위치만 다름) 중복 탐지",
          is_duplicate_news("삼성전자 <b>반도체</b> 신기록", seen), True)
    # 전혀 다른 기사 → False
    check("다른 기사는 중복 아님",
          is_duplicate_news("오늘 서울 날씨 맑음", seen), False)


def test_remove_batch_duplicates():
    print("\n[TEST] remove_batch_duplicates 배치 중복 제거")
    items = [
        {"title": "<b>삼성</b>전자 반도체 신기록", "link": "1"},
        {"title": "삼성전자 <b>반도체</b> 신기록", "link": "2"},  # 위와 중복
        {"title": "코스피 3000 돌파", "link": "3"},
    ]
    result = remove_batch_duplicates(items)
    check("3건 중 중복 1건 제거되어 2건 남음", len(result), 2)


def test_is_published_today():
    print("\n[TEST] is_published_today 오늘/어제 판별")
    today = _naver_date(datetime.now())
    yesterday = _naver_date(datetime.now() - timedelta(days=1))
    check("오늘 날짜 기사 → True", is_published_today(today), True)
    check("어제 날짜 기사 → False", is_published_today(yesterday), False)
    check("빈 문자열 → False", is_published_today(""), False)


def run_offline_tests():
    print("=" * 60)
    print("🧪 오프라인 단위 테스트 시작 (네트워크/Ollama 불필요)")
    print("=" * 60)
    test_clean_title_strips_b_tags()
    test_is_duplicate_news_turn_dedup()
    test_remove_batch_duplicates()
    test_is_published_today()
    print("\n" + "=" * 60)
    print(f"결과: ✅ {_passed}건 통과 / ❌ {_failed}건 실패")
    print("=" * 60)


if __name__ == "__main__":
    run_offline_tests()

    if RUN_FULL_PIPELINE:
        print("\n\n" + "=" * 60)
        print("🚀 전체 파이프라인 1회 강제 실행 (실제 수집)")
        print("   ⚠️ .env 네이버 API 키 + 로컬 Ollama 실행이 필요합니다.")
        print("=" * 60)
        from run_pipeline import total_news_pipeline_job
        total_news_pipeline_job()