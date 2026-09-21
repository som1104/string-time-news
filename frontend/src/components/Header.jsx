import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Orbit } from "lucide-react";

export default function Header({ pointColor, bookmarks = [], onToggleBookmark }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const storedUsername = localStorage.getItem("username");
  const storedUserId = localStorage.getItem("user_id");

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("user_id");
    setIsOpen(false);
    alert("로그아웃 되었습니다.");
    navigate("/");
  };

  const isDetailPage = window.location.pathname.includes("detail");

  return (
    <header className="w-full bg-[#F9FAFB]/80 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-4xl mx-auto h-16 sm:h-20 md:h-24 px-3 sm:px-4 flex items-center justify-between gap-2"> {/* 헤더 자체 높이도 h-20 -> h-24로 키워 쾌적함을 더했습니다. */}
        
        {/* ----------------- 💡 좌측 영역 수정됨 (그라데이션 텍스트 적용) ----------------- */}
        <div className="flex items-center min-w-0">
          {isDetailPage ? (
            <Link to="/" className="flex items-center gap-2 md:gap-3 min-w-0 cursor-pointer">
              <div 
                className="w-9 h-9 md:w-11 md:h-11 shrink-0 rounded-2xl flex items-center justify-center font-black text-white shadow-md transform transition-transform hover:rotate-12" 
                style={{ backgroundColor: pointColor }}
              >
                <Orbit size={24} strokeWidth={2.5} className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              
              {/* ⭕ 홈 화면 타이틀처럼 그라데이션을 입힌 STN 텍스트 */}
              <h1 
                className="min-w-0 truncate whitespace-nowrap text-xl sm:text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-gradient-to-r"
                style={{ 
                  backgroundImage: `linear-gradient(135deg, #1A1F27 40%, ${pointColor} 100%)` 
                }}
              >
                <span className="sm:hidden">STN</span>
                <span className="hidden sm:inline">STRING TIME NEWS</span>
              </h1>
            </Link>
          ) : (
            <Link 
              to="/detail"
              className="shrink-0 whitespace-nowrap flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 border rounded-2xl bg-white text-sm font-extrabold transition-all shadow-[0_4px_14px_rgba(0,0,0,0.03)] cursor-pointer hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] active:scale-[0.99] group"
              style={{ borderColor: pointColor, color: pointColor }}
            >
              <span className="w-2.5 h-2.5 shrink-0 rounded-full animate-pulse" style={{ backgroundColor: pointColor }}></span>
              실시간 뉴스 →
            </Link>
          )}
        </div>

        {/* ----------------- 💡 우측 영역 (이동 버튼 / 로그인 및 프로필) ----------------- */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          
          {isDetailPage && (
            <Link 
              to="/"
              className="shrink-0 whitespace-nowrap flex items-center gap-1 px-3 py-2 sm:px-5 sm:py-3 border border-slate-200 rounded-2xl bg-white text-sm font-bold text-[#4E5968] hover:text-[#1A1F27] hover:bg-[#F2F4F6] transition-all shadow-[0_4px_14px_rgba(0,0,0,0.02)] cursor-pointer hover:scale-[1.02]"
            >
              <span className="sm:hidden">← 홈</span>
              <span className="hidden sm:inline">← 메인화면</span>
            </Link>
          )}

          {storedUsername ? (
            /* [로그인 상태]: 이니셜 프로필 아바타 (버튼 크기 비례 확장 h-10 -> h-11) */
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-full text-white font-black text-base shadow-md flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: pointColor }}
              >
                {storedUsername.charAt(0).toUpperCase()}
              </button>

              {/* 프로필 및 북마크 모달 드롭다운 창 */}
              {isOpen && (
                <div className="absolute right-0 mt-4 w-[calc(100vw-1.5rem)] max-w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 sm:p-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                    <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: `${pointColor}cc` }}>
                      {storedUsername.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#1A1F27] truncate">{storedUsername} 님</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">Member ID: #{storedUserId}</div>
                    </div>
                  </div>

                  <div className="py-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-[#4E5968]">내가 저장한 뉴스 ({bookmarks.length})</span>
                    </div>

                    {bookmarks.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {bookmarks.map((bookmark) => (
                          <div key={bookmark.id} className="p-2 bg-[#F9FAFB] rounded-lg border border-slate-50 flex justify-between items-center gap-2">
                            <a 
                              href={bookmark.original_url || bookmark.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-medium text-slate-700 truncate hover:text-blue-500 hover:underline flex-1 min-w-0"
                            >
                              • {bookmark.title}
                            </a>
                            {onToggleBookmark && (
                              <button 
                                onClick={() => onToggleBookmark(bookmark)}
                                className="shrink-0 text-xs text-amber-500 hover:scale-110 transition-transform cursor-pointer px-1"
                              >
                                ★
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 font-medium bg-[#F9FAFB] rounded-xl border border-dashed border-slate-200">
                        저장된 기사가 없습니다. <br/>뉴스 카드에서 ★을 눌러보세요!
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ⭕ [비로그인 상태]: 좌측 트렌드 버튼과 크기, 패딩, 폰트 굵기, 섀도우를 완벽히 매칭한 통일감 패키지 버튼 */
            <Link 
              to="/login" 
              className="shrink-0 whitespace-nowrap flex items-center justify-center px-3 py-2 sm:px-6 sm:py-3 border rounded-2xl bg-white text-sm font-extrabold text-slate-700 border-slate-200 shadow-[0_4px_14px_rgba(0,0,0,0.03)] transition-all cursor-pointer hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:bg-slate-50 active:scale-[0.99]"
            >
              로그인
            </Link>
          )}

        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
      )}
    </header>
  );
}