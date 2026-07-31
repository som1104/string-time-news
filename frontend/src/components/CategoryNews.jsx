import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import CategoryBadges from "./CategoryBadges";
import { normalizeCategories } from "../utils/categories";
import defaultImg from "../assets/no_image.png";

// 달력 형식(YYYY-MM-DD)을 네이버 뉴스 DB 날짜 형식(DD Mon YYYY)으로 바꿔주는 헬퍼 함수
const convertToNaverDate = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`; 
};

// 백엔드 classifier.py의 KEYWORDS_MAP과 동일한 고정 카테고리 목록 (백엔드에 별도 목록 API가 없어 프론트에 고정)
const CATEGORY_LIST = ["전체", "정치", "경제", "IT/과학", "문화/트렌드", "라이프", "사회/세계"];

// 💡 오늘 기준 최근 5개 날짜 배열을 동적으로 생성하는 함수
const getRecentDatesList = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD
    
    let label = `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일`;
    if (i === 0) label = "오늘";
    if (i === 1) label = "어제";
    
    dates.push({ dateStr, label });
  }
  return dates;
};

export default function CategoryNews({ pointColor, bookmarks, onToggleBookmark }) {
  const [newsList, setNewsList] = useState([]);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  // 최근 5개 날짜 생성 목록 가져오기
  const recentDates = getRecentDatesList();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();
        if (activeCategory !== "전체") params.set("category", activeCategory);
        if (selectedDate) params.set("date", convertToNaverDate(selectedDate));
        const query = params.toString();

        const newsRes = await fetch(`${API_BASE_URL}/api/news${query ? `?${query}` : ""}`, {
          headers: { "ngrok-skip-browser-warning": "69420" }
        });
        const newsJson = await newsRes.json();

        if (newsJson.status === "success") {
          setNewsList(newsJson.data);
        } else {
          setNewsList([]);
        }
      } catch (error) {
        console.error("뉴스 데이터 연동 오류:", error);
        setNewsList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [selectedDate, activeCategory]);

  // 💡 날짜 버튼 클릭 토글 핸들러
  const handleDateClick = (dateStr) => {
    if (selectedDate === dateStr) {
      setSelectedDate(""); // 이미 선택된 날짜면 필터 해제(전체 조회)
    } else {
      setSelectedDate(dateStr);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      
      <div className="mb-6 pb-5 border-b border-slate-100 space-y-4">
        
        {/* 첫 번째 줄: 제목 및 카테고리 탭 목록 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-[#1A1F27]">카테고리 트렌드</h2>
          
          <div className="flex flex-wrap gap-1.5 p-1 bg-[#F2F4F6] rounded-xl w-full lg:w-auto">
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 lg:flex-none text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeCategory === cat 
                    ? "bg-white text-[#3182F6] shadow-sm font-bold" 
                    : "text-[#4E5968] hover:text-[#1A1F27]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 💡 두 번째 줄: 최근 5개 날짜 단추 배열형 UI 배치 */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1 select-none"></span>
          
          {/* 전체 기간 선택 버튼 */}
          <button
            onClick={() => setSelectedDate("")}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
              selectedDate === ""
                ? "bg-slate-800 text-white border-transparent shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            전체 기간
          </button>

          {/* 최근 5일 동적 날짜 버튼 루프 */}
          {recentDates.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            return (
              <button
                key={item.dateStr}
                onClick={() => handleDateClick(item.dateStr)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? "text-white border-transparent shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-[#1A1F27]"
                }`}
                style={isSelected ? { backgroundColor: pointColor } : {}}
              >
                {item.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* 뉴스 피드 목록 뷰포트 */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-[#8B95A1] animate-pulse font-medium">데이터를 조회하는 중입니다...</div>
        ) : newsList.length > 0 ? (
          newsList.map((news, idx) => {
            const isBookmarked = bookmarks && bookmarks.some((b) => b.id === news.id);

            return (
              <div key={news.id || idx} className="p-4 bg-white border border-[#F2F4F6] rounded-xl hover:bg-[#F9FAFB] transition-colors group relative flex gap-4">
                <img
                  src={news.image_url || defaultImg}
                  alt={news.title || "뉴스 이미지"}
                  className="w-28 md:w-36 self-stretch shrink-0 object-cover rounded-lg border border-slate-100"
                  onError={(e) => { e.target.src = defaultImg; }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <CategoryBadges categories={normalizeCategories(news).length > 0 ? normalizeCategories(news) : ["일반"]} size="sm" />

                    <button
                      onClick={() => onToggleBookmark(news)}
                      className="text-lg cursor-pointer transition-transform hover:scale-110"
                      style={{ color: isBookmarked ? pointColor : "#C4C4C4" }}
                    >
                      {isBookmarked ? "★" : "☆"}
                    </button>
                  </div>

                  <a href={news.original_url} target="_blank" rel="noreferrer" className="block text-lg font-bold text-[#1A1F27] mt-2 mb-3 hover:text-blue-500 transition-colors">
                    {news.title}
                  </a>
                  <div className="p-3 bg-[#F9FAFB] rounded-xl space-y-1">
                    {[news.summary_1, news.summary_2, news.summary_3].filter(Boolean).map((s, i) => (
                      <p key={i} className="text-xs text-[#4E5968] flex gap-1"><span>·</span>{s}</p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="text-3xl mb-3 block">📭</span>
            <p className="text-sm font-bold text-slate-600">선택하신 조건에 해당하는 뉴스가 존재하지 않습니다.</p>
            <p className="text-xs text-slate-400 mt-1">다른 날짜 버튼이나 카테고리를 선택해 보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}