import React, { useState, useEffect } from 'react';
import Header from "../components/Header";
import TrendWordCloud from "../components/TrendWordCloud";
import HotIssues from "../components/HotIssues";
import CategoryNews from "../components/CategoryNews";
import { API_BASE_URL } from "../../config";
import TodayWeather from '../components/TodayWeather'; // ⭕ TodayWeather import 확인

const Detail = () => {
  const [pointColor] = useState(() => {
    const savedPoint = localStorage.getItem("studio_point_color");
    return savedPoint ? savedPoint : "#3182F6";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const storedUserId = localStorage.getItem("user_id") || "guest";
  const BOOKMARK_KEY = `news_bookmarks_${storedUserId}`;

  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem(BOOKMARK_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  }, [bookmarks, BOOKMARK_KEY]);

  const toggleBookmark = (item) => {
    if (!item || !item.id) return;
    setBookmarks((prev) => {
      const isExist = prev.some((b) => b.id === item.id);
      return isExist ? prev.filter((b) => b.id !== item.id) : [...prev, item];
    });

    // 로그인 상태(실제 user_id 보유)일 때만 서버 즐겨찾기와 동기화
    // (HotIssues/CategoryNews의 카드는 실제 DB news.id를 그대로 갖고 있어 안전하게 연동 가능)
    if (storedUserId !== "guest") {
      fetch(`${API_BASE_URL}/api/favorites/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({ user_id: Number(storedUserId), news_id: item.id }),
      }).catch((error) => {
        console.error("즐겨찾기 서버 동기화 실패:", error);
      });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      setIsSearching(true);
      const response = await fetch(`${API_BASE_URL}/api/news/keyword/${encodeURIComponent(searchQuery)}`, {
        headers: { "ngrok-skip-browser-warning": "69420" }
      });
      const resJson = await response.json();
      setSearchResults(resJson.data || []);
    } catch (error) {
      console.error("실제 뉴스 검색 실패:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1F27] font-sans antialiased pb-24">
      
      <Header 
        pointColor={pointColor} 
        bookmarkCount={bookmarks.length} 
        bookmarks={bookmarks} 
        onToggleBookmark={toggleBookmark}
      />
      
      {/* 본문 레이아웃 컨테이너 */}
      <div className="max-w-4xl mx-auto px-5 py-12 space-y-8">
        
        {/* ⭕ 검색창 및 날씨 위젯 영역 (Flex 정렬) */}
        <div className="flex items-center gap-3">
          
          {/* 왼쪽: 검색 바 (flex-1로 남은 공간 꽉 채우기) */}
          <div className="flex-1 bg-white p-2 md:p-3 rounded-full border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input 
                type="text" 
                placeholder="궁금한 뉴스 트렌드를 검색해보세요."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 text-sm bg-[#F2F4F6] rounded-full focus:bg-white border border-transparent focus:border-slate-200 outline-none transition-all"
              />
              <button 
                type="submit" 
                className="px-5 py-2 text-white rounded-full font-bold transition-opacity hover:opacity-90 cursor-pointer text-sm whitespace-nowrap"
                style={{ backgroundColor: pointColor }}
              >
                {isSearching ? "검색 중..." : "검색"}
              </button>
            </form>
          </div>

          {/* 오른쪽: 미니 오늘 날씨 위젯 고정 */}
          <div className="h-[52px] md:h-[60px]">
             <TodayWeather />
          </div>

        </div>

        {/* 🔍 검색 결과 뷰포트 */}
        {searchResults && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="font-bold text-gray-800">🔍 트렌드 검색 결과 ({searchResults.length}건)</h3>
              <button 
                onClick={() => { setSearchResults(null); setSearchQuery(""); }}
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold cursor-pointer"
              >
                닫기 ✕
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {searchResults.map((news, idx) => {
                  const isBookmarked = bookmarks && bookmarks.some((b) => b.id === news.id);
                  return (
                    <div key={news.id || idx} className="p-4 bg-[#F9FAFB] rounded-xl border border-slate-50 hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <a
                          href={news.original_url || news.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-base block text-[#1A1F27] hover:text-blue-500 transition-colors leading-snug"
                        >
                          {news.title}
                        </a>
                        <button
                          onClick={() => toggleBookmark(news)}
                          className="text-lg cursor-pointer transition-transform hover:scale-110 shrink-0"
                          style={{ color: isBookmarked ? pointColor : "#C4C4C4" }}
                        >
                          {isBookmarked ? "★" : "☆"}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2 break-keep leading-relaxed">
                      {news.summary_1 || '요약 내용이 제공되지 않습니다.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-8 text-center font-medium">검색 조건과 일치하는 뉴스가 뉴스룸 DB에 존재하지 않습니다.</p>
            )}
          </div>
        )}

        {/* 트렌드 및 핫이슈 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrendWordCloud pointColor={pointColor} bookmarks={bookmarks} onToggleBookmark={toggleBookmark} />
          <HotIssues 
            pointColor={pointColor} 
            bookmarks={bookmarks} 
            onToggleBookmark={toggleBookmark} 
          />
        </div>

        {/* 카테고리 탭 및 뉴스 피드 리스트 */}
        <CategoryNews 
          pointColor={pointColor} 
          bookmarks={bookmarks} 
          onToggleBookmark={toggleBookmark} 
        />
      </div>

    </div>
  );
};

export default Detail;