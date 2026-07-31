import React, { useEffect, useState } from 'react';
import NewsCard from '../components/NewsCard';
import Header from '../components/Header';
import { API_BASE_URL } from '../../config';
import { Orbit } from 'lucide-react';
import WeatherIcon from '../components/WeatherIcon';

const Home = () => {
  const [newsList, setNewsList] = useState([]);

  const [pointColor] = useState(() => {
    return localStorage.getItem("studio_point_color") || "#3182F6";
  });

  const storedUserId = localStorage.getItem("user_id") || "guest";
  const BOOKMARK_KEY = `news_bookmarks_${storedUserId}`;

  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem(BOOKMARK_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // 1. 데일리 요약 데이터 로드 (어제 기준)
    fetch(`${API_BASE_URL}/api/news/daily-summary`, {
      headers: { "ngrok-skip-browser-warning": "69420" }
    })
      .then(res => res.json())
      .then(data => {
        console.log("새로운 백엔드 응답 전체:", data);

        if (data && data.status === 'success' && Array.isArray(data.data)) {

          const formattedNews = data.data.map(item => {
            let processedSummary = "";

            // 💡 백엔드가 준 summary가 객체일 때
            if (item.summary && typeof item.summary === 'object') {
              const s = item.summary;

              if (typeof s.summary === 'string' && s.summary.trim()) {
                // 새 백엔드 포맷: { summary, keyword } 형태의 130자 축약 요약
                processedSummary = s.summary.trim();
              } else {
                // 예전 포맷 하위호환: who/when/where/why/how/what 육하원칙 객체
                // (존재하는 키값만 뽑아서 이어 붙이고, "관련 정보 없음" 고정 문구는 제외)
                processedSummary = [
                  s.when,
                  s.where,
                  s.who,
                  s.why,
                  s.how,
                  s.what
                ]
                  .filter((val) => val && !val.trim().replace(/\.$/, '').endsWith('관련 정보 없음'))
                  .join(' ');
              }
            }
            // 💡 백엔드가 준 summary가 이미 일반 문자열(String)일 때
            else if (typeof item.summary === 'string') {
              processedSummary = item.summary;
            }

            return {
              id: item.cluster_id || Math.random(),
              title: item.title || "제목 없음",
              summary_1: processedSummary, // 👈 백엔드가 보낸 날것의 요약 정보만 매핑
              image_url: item.image_url || null,
              category: item.category || "일반", // 👈 백엔드가 분류한 카테고리를 그대로 신뢰
              original_url: item.original_url || ""
            };
          });

          setNewsList(formattedNews.slice(0, 10));
        } else {
          setNewsList([]);
        }
      })
      .catch(err => {
        console.error("데일리 요약 로딩 오류:", err);
        setNewsList([]);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  }, [bookmarks, BOOKMARK_KEY]);

  const toggleBookmark = (item) => {
    if (!item || !item.id) return;

    setBookmarks((prev) => {
      const isExist = prev.some((b) => b.id === item.id);
      return isExist ? prev.filter((b) => b.id !== item.id) : [...prev, item];
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1F27] font-sans antialiased pb-28">

      <Header
        pointColor={pointColor}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
      />

      {/* 1. 메인 타이틀 및 날씨 섹션 */}
      <div className="max-w-4xl mx-auto px-5 py-16 md:py-18 text-center select-none">

        <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest uppercase bg-white border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.01)] px-4 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: pointColor }}></span>
          <span className="text-slate-500 font-extrabold">Realtime</span>
          <span style={{ color: pointColor }}>AI Summary Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-[1000] tracking-tight leading-[1.25] mb-2 text-[#1A1F27] keep-all break-keep flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span
            className="inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 text-white rounded-3xl shadow-md transform -rotate-3 transition-transform hover:rotate-0"
            style={{ backgroundColor: pointColor }}
          >
            <Orbit size={40} strokeWidth={2.5} />
          </span>

          <span
            className="bg-clip-text text-transparent bg-gradient-to-r"
            style={{ backgroundImage: `linear-gradient(135deg, #1A1F27 40%, ${pointColor} 100%)` }}
          >
            STRING TIME NEWS<br className="hidden sm:inline" />
          </span>
        </h1>

        <WeatherIcon />

      </div>

      {/* 2. 뉴스 카드 리스트 섹션 */}
      <div className="max-w-4xl mx-auto px-5 space-y-4 relative group">

        <div className="mb-2 flex justify-between items-end border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">어제의 핵심 뉴스 TOP 10</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              양옆의 화살표 버튼을 눌러서 넘겨보세요
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            📅 어제 날짜 기준 (매일 오전 7시 15분 업데이트)
          </span>
        </div>

        <button
          onClick={() => {
            const container = document.getElementById('news-carousel-container');
            if (container) container.scrollBy({ left: -360, behavior: 'smooth' });
          }}
          className="absolute -left-2 md:-left-6 top-[60%] -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
          aria-label="이전 뉴스 보기"
        >
          &lt;
        </button>

        <button
          onClick={() => {
            const container = document.getElementById('news-carousel-container');
            if (container) container.scrollBy({ left: 360, behavior: 'smooth' });
          }}
          className="absolute -right-2 md:-right-6 top-[60%] -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
          aria-label="다음 뉴스 보기"
        >
          &gt;
        </button>

        <section
          id="news-carousel-container"
          className="flex flex-row gap-5 overflow-x-auto pb-6 scroll-smooth snap-x snap-mandatory touch-pan-x select-none"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          <style>{`
            #news-carousel-container::-webkit-scrollbar { display: none; }
          `}</style>

          {newsList.length > 0 ? (
            newsList.map((article, articleIdx) => (
              <div
                key={article.id || articleIdx}
                className="snap-start shrink-0 w-[85vw] md:w-[calc((100%-40px)/3)] bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.05)] hover:scale-[1.01] transition-all duration-300"
              >
                <div className="bg-transparent h-full flex flex-col justify-between">
                  <NewsCard article={article} bookmarks={bookmarks} onToggleBookmark={toggleBookmark} />
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-12 text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-200">
              조회된 어제 뉴스가 없습니다. 백엔드 DB 서버를 확인해주세요.
            </div>
          )}
        </section>
      </div>

    </div>
  );
};

export default Home;