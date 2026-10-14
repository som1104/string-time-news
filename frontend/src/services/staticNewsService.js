// src/services/staticNewsService.js
//
// 공개 포트폴리오 데모용 데이터 계층.
// 기존 FastAPI(Render) 엔드포인트가 내려주던 응답을 Vercel에 함께 배포되는
// 정적 JSON(public/data/*.json)에서 읽어 동일한 형태로 돌려준다.
//
//   GET /api/news?category=&date=   →  getNewsList({ category, date })
//   GET /api/news/top5              →  getHotIssues()
//   GET /api/news/daily-summary     →  getDailySummary()
//   GET /api/news/trend             →  getTrendKeywords()
//   GET /api/news/keyword/{kw}      →  searchNewsByKeyword(kw)
//
// 정적 JSON은 scripts/export_static_data.py 가 backend/database/news_database.db
// 에서 추출한다. 뉴스 본문/요약/날짜/카테고리 값은 DB 원본 그대로다.

const DATA_BASE = `${import.meta.env.BASE_URL || "/"}data`.replace(/\/{2,}/g, "/");

// 같은 파일을 여러 컴포넌트가 동시에 요청해도 네트워크 요청은 한 번만 나가도록
// Promise 자체를 캐싱한다. 실패하면 캐시를 비워 다음 시도에서 재요청한다.
const cache = new Map();

function loadJson(fileName) {
  if (!cache.has(fileName)) {
    const promise = fetch(`${DATA_BASE}/${fileName}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${fileName} 응답 오류 (${res.status})`);
        return res.json();
      })
      .catch((error) => {
        cache.delete(fileName);
        throw error;
      });
    cache.set(fileName, promise);
  }
  return cache.get(fileName);
}

/** 전체 뉴스 목록 (id 내림차순). 백엔드 news 테이블 전체와 동일 */
export async function getAllNews() {
  const json = await loadJson("news.json");
  return json.data || [];
}

/**
 * GET /api/news 재현
 * - category: 'A|B' 멀티라벨 문자열에 대한 부분 매칭(LIKE %cat%)
 * - date: published_at 부분 매칭(LIKE %date%), 예) '15 Jul 2026'
 * - 정렬 id DESC, 최대 50건 (백엔드 쿼리와 동일)
 */
export async function getNewsList({ category, date } = {}) {
  const all = await getAllNews();
  const cat = (category || "").trim();
  const day = (date || "").trim();

  const filtered = all.filter((news) => {
    if (cat && !String(news.category || "").includes(cat)) return false;
    if (day && !String(news.published_at || "").includes(day)) return false;
    return true;
  });

  return filtered.slice(0, 50);
}

/**
 * GET /api/news/keyword/{keyword} 재현
 * - title / summary_1 / summary_2 / summary_3 부분 매칭
 * - SQLite LIKE 가 ASCII 대소문자를 구분하지 않는 점까지 맞춤
 * - 정렬 id DESC, 최대 20건
 */
export async function searchNewsByKeyword(keyword) {
  const all = await getAllNews();
  const needle = String(keyword || "").trim().toLowerCase();
  if (!needle) return [];

  const hit = (value) => String(value || "").toLowerCase().includes(needle);

  return all
    .filter(
      (news) =>
        hit(news.title) || hit(news.summary_1) || hit(news.summary_2) || hit(news.summary_3)
    )
    .slice(0, 20);
}

/** GET /api/news/daily-summary 재현 → { date, data: [...] } */
export async function getDailySummary() {
  const json = await loadJson("daily-news.json");
  return { date: json.date || "", data: json.data || [] };
}

/** GET /api/news/trend 재현 → [{ rank, keyword, count }] */
export async function getTrendKeywords() {
  const json = await loadJson("trends.json");
  return json.data || [];
}

/** GET /api/news/top5 재현 → 군집 대표 기사 5건 */
export async function getHotIssues() {
  const json = await loadJson("hot-issues.json");
  return json.data || [];
}

/** 데이터 기준일 등 메타 정보 */
export async function getMetadata() {
  return loadJson("metadata.json");
}

/**
 * 용량이 큰 news.json 을 미리 받아둔다(홈 → 상세 이동을 빠르게).
 * 실패해도 조용히 넘어가고, 실제 사용 시점에 다시 요청한다.
 */
export function prefetchAllNews() {
  const start = () => {
    loadJson("news.json").catch(() => {});
  };
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(start, { timeout: 3000 });
  } else {
    window.setTimeout(start, 1200);
  }
}
