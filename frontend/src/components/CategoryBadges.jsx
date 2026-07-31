// src/components/CategoryBadges.jsx
//
// 멀티라벨 카테고리를 뱃지로 렌더링하는 뱃지/필터 컴포넌트.
// - API 응답이 categories(배열) 또는 category("경제|IT/과학" 문자열) 어느 쪽이든 지원
// - onSelect 를 주면 클릭 가능한 필터 버튼으로 동작 (키보드 접근성 포함)
// - 외부 CSS/라이브러리 의존성 없음 (인라인 스타일)
//
// 사용 예시는 파일 하단 주석 참고.

import React from "react";
import { normalizeCategories } from "../utils/categories";

// 6개 카테고리별 색상 (배경 / 글자·테두리). 서로 확실히 구분되는 색으로.
const PALETTE = {
  "정치":       { bg: "#EEF0FB", fg: "#3B44A8", bd: "#C3C8F0" },
  "경제":       { bg: "#E7F6EC", fg: "#1E7A43", bd: "#B7E4C6" },
  "IT/과학":    { bg: "#E6F1FB", fg: "#1B5F9E", bd: "#B3D4F0" },
  "라이프":     { bg: "#FDF1E3", fg: "#B4651A", bd: "#F3D5B0" },
  "문화/트렌드": { bg: "#FBEAF3", fg: "#A63A78", bd: "#F0C2DC" },
  "사회/세계":  { bg: "#FDECEC", fg: "#C0392B", bd: "#F5C6C2" },
};

const FALLBACK = { bg: "#EEF0F2", fg: "#556070", bd: "#D3D9DF" };

export default function CategoryBadges({
  news,            // 뉴스 객체 (categories 배열 또는 category 문자열 보유)
  categories,      // 또는 라벨 배열을 직접 전달
  onSelect,        // (label) => void  주면 클릭 가능해짐
  size = "md",     // "sm" | "md"
}) {
  const labels = categories ?? normalizeCategories(news);
  if (!labels.length) return null;

  const pad = size === "sm" ? "1px 8px" : "3px 10px";
  const font = size === "sm" ? 11 : 12.5;

  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
      {labels.map((label) => {
        const c = PALETTE[label] || FALLBACK;
        const base = {
          display: "inline-flex",
          alignItems: "center",
          padding: pad,
          fontSize: font,
          fontWeight: 600,
          lineHeight: 1.5,
          borderRadius: 999,
          color: c.fg,
          background: c.bg,
          border: `1px solid ${c.bd}`,
          whiteSpace: "nowrap",
        };

        if (!onSelect) {
          return (
            <span key={label} style={base}>
              {label}
            </span>
          );
        }

        // 클릭 가능한 필터 버튼 버전
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            style={{ ...base, cursor: "pointer" }}
            aria-label={`${label} 카테고리로 필터`}
            onFocus={(e) => (e.currentTarget.style.outline = `2px solid ${c.fg}`)}
            onBlur={(e) => (e.currentTarget.style.outline = "none")}
          >
            {label}
          </button>
        );
      })}
    </span>
  );
}

/* ---------------------------------------------------------------------------
사용 예시 1 — 뉴스 카드 안에서 그냥 표시

  import CategoryBadges from "./components/CategoryBadges";

  function NewsCard({ news }) {
    return (
      <div className="news-card">
        <img src={news.image_url} alt="" />
        <h3>{news.title}</h3>
        <CategoryBadges news={news} />
        <p>{news.summary_1}</p>
      </div>
    );
  }

사용 예시 2 — 뱃지 클릭 시 해당 카테고리로 필터 조회

  function NewsCard({ news, onFilter }) {
    return (
      <div className="news-card">
        <h3>{news.title}</h3>
        <CategoryBadges news={news} onSelect={onFilter} />
      </div>
    );
  }

  // 상위 컴포넌트
  const onFilter = async (label) => {
    const res = await fetch(
      `http://localhost:8000/api/news?category=${encodeURIComponent(label)}`
    );
    const json = await res.json();
    setNewsList(json.data); // 백엔드가 LIKE 로 멀티라벨 매칭해줌
  };

주의: 백엔드가 이후 각 뉴스에 categories 배열을 함께 내려주면 news.categories 를
바로 쓰면 됩니다. 지금처럼 news.category 문자열만 있어도 자동으로 처리됩니다.
--------------------------------------------------------------------------- */
