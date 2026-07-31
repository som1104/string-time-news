import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
// 💡 로컬 이미지는 이렇게 import 해야 Vite가 경로를 정확히 인식합니다.
import defaultImg from "../assets/no_image.png";
import CategoryBadges from "./CategoryBadges";
import { normalizeCategories } from "../utils/categories";

export default function HotIssues({ pointColor, bookmarks, onToggleBookmark }) {
  const [hotIssues, setHotIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHotIssues = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/news/top5`, {
          headers: { "ngrok-skip-browser-warning": "69420" }
        });

        if (!response.ok) throw new Error("핫이슈 API 응답 오류");

        const resJson = await response.json();
        if (resJson.status === "success") {
          setHotIssues(resJson.data || []);
        }
      } catch (error) {
        console.error("핫이슈 데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotIssues();
  }, []);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      <h2 className="text-2xl font-bold text-[#1A1F27]">⭐실시간 핫이슈 (TOP 5)</h2>

      {isLoading ? (
        <div className="text-center py-12 text-[#8B95A1] animate-pulse text-sm">핫이슈를 분석하는 중입니다...</div>
      ) : hotIssues.length > 0 ? (
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
          {hotIssues.map((issue, idx) => {
            const isBookmarked = bookmarks && bookmarks.some((b) => b.id === issue.id);

            return (
              <div key={issue.id || idx} className="space-y-3 border-b border-slate-50 pb-5 last:border-b-0 last:pb-0">
                <div className="w-full h-44 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 relative">
                  <img
                    src={issue.image_url || defaultImg}
                    alt={issue.title || "뉴스 이미지"}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = defaultImg; }}
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 text-white font-bold text-[10px] rounded-lg tracking-wider uppercase">
                    Issue {idx + 1}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <CategoryBadges categories={normalizeCategories(issue).length > 0 ? normalizeCategories(issue) : ["일반"]} size="sm" />
                  <button
                    onClick={() => onToggleBookmark && onToggleBookmark(issue)}
                    className="text-lg cursor-pointer transition-transform hover:scale-110"
                    style={{ color: isBookmarked ? pointColor : "#C4C4C4" }}
                  >
                    {isBookmarked ? "★" : "☆"}
                  </button>
                </div>

                <a
                  href={issue.original_url || issue.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block font-bold text-base text-[#1A1F27] hover:text-blue-500 transition-colors leading-snug"
                >
                  {issue.title}
                </a>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                  {issue.summary_1 || "요약 내용이 없습니다."}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-[#8B95A1] text-sm">현재 집계된 실시간 핫이슈가 없습니다.</div>
      )}
    </div>
  );
}