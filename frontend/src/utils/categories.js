// src/utils/categories.js
// 카테고리 문자열/배열 정규화 헬퍼. CategoryBadges.jsx에서 분리되어
// 컴포넌트 파일이 컴포넌트만 export하도록(Fast Refresh 경고 해결) 유지합니다.

const SEP = "|";

/** categories(배열) 또는 category(문자열) 어느 쪽이 있든 라벨 배열로 정규화 */
export function normalizeCategories(news) {
  if (!news) return [];
  if (Array.isArray(news.categories)) return news.categories.filter(Boolean);
  if (typeof news.category === "string") {
    return news.category.split(SEP).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
