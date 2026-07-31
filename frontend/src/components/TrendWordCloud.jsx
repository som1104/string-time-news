import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config"; // 💡 환경변수 중앙 설정에서 가져오기

export default function TrendWordCloud({ pointColor, bookmarks, onToggleBookmark }) {
  const [keywords, setKeywords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [expandedKeyword, setExpandedKeyword] = useState(null);
  const [keywordNewsList, setKeywordNewsList] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  // 특정 키워드의 뉴스를 가져오는 통신 함수
  const fetchNewsForKeyword = async (keywordText) => {
    try {
      setIsNewsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/news/keyword/${encodeURIComponent(keywordText)}`, {
        headers: { "ngrok-skip-browser-warning": "69420" }
      });

      if (!response.ok) throw new Error("네트워크 응답 오류");

      const resJson = await response.json();
      
      let limitNews = [];
      if (resJson.status === "success" && Array.isArray(resJson.data)) {
        limitNews = resJson.data.slice(0, 4);
      } else if (Array.isArray(resJson)) {
        limitNews = resJson.slice(0, 4);
      }
      
      setKeywordNewsList(limitNews);
    } catch (error) {
      console.error("단어별 뉴스 로드 실패:", error);
      setKeywordNewsList([]);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        setIsLoading(true);
        // 💡 1. 백엔드 실시간 트렌드 실제 API 주소(/api/news/trend)로 변경
        const response = await fetch(`${API_BASE_URL}/api/news/trend`, {
          headers: { "ngrok-skip-browser-warning": "69420" }
        });
        
        let loadedKeywords = [];

        if (response.ok) {
          const data = await response.json();
          
          if (data.status === "success" && Array.isArray(data.data)) {
            // 💡 2. 백엔드의 'keyword' 변수명을 프론트엔드의 'text' 구조로 알맞게 변환 매핑
            loadedKeywords = data.data.map(item => ({
              text: item.keyword,
              count: item.count
            })).slice(0, 5); // 상위 5개만 노출
          }
        }
        
        // 💡 3. 데이터베이스에 뉴스 기사가 전혀 없을 때 작동할 안전한 방어용 데이터(Fallback)
        if (!loadedKeywords || loadedKeywords.length === 0) {
           loadedKeywords = [
            { text: "인공지능", count: 142 },
            { text: "반도체", count: 98 },
            { text: "챗GPT", count: 85 },
            { text: "금리", count: 64 },
            { text: "K팝", count: 53 }
          ];
        }

        setKeywords(loadedKeywords);

        // 1위 키워드 자동 오픈 및 뉴스 로드
        if (loadedKeywords.length > 0) {
          const firstKeyword = loadedKeywords[0].text;
          setExpandedKeyword(firstKeyword);
          fetchNewsForKeyword(firstKeyword);
        }

      } catch (err) {
        console.error("키워드 로드 실패", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchKeywords();
  }, []); 

  const handleKeywordToggle = async (keywordText) => {
    if (expandedKeyword === keywordText) {
      setExpandedKeyword(null);
      setKeywordNewsList([]);
      return;
    }
    setExpandedKeyword(keywordText);
    setKeywordNewsList([]);
    fetchNewsForKeyword(keywordText);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#1A1F27]">🔥실시간 트렌드</h2>
        <p className="text-xs text-slate-400 mt-1">단어를 누르면 관련 기사가 아래에 바로 펼쳐집니다.</p>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-50 rounded-2xl" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {keywords.map((item, index) => {
            const isTargetOpen = expandedKeyword === item.text;

            return (
              <div 
                key={index} 
                className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden ${
                  isTargetOpen ? "shadow-sm" : "border-slate-100 hover:border-slate-200"
                }`}
                style={isTargetOpen ? { borderColor: pointColor } : {}}
              >
                <div 
                  onClick={() => handleKeywordToggle(item.text)}
                  className="p-4 flex items-center justify-between cursor-pointer group bg-[#F8F9FA]/50 hover:bg-[#F8F9FA]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 tracking-tighter">
                      {index === 0 ? "🔥 " : ""}{index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </span>
                    <span className="font-bold text-sm text-[#1A1F27] group-hover:text-blue-500 transition-colors">
                      {item.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.count}건
                    </span>
                    <span
                      className={`text-xs transition-transform font-bold ${isTargetOpen ? "rotate-90" : "text-slate-400"}`}
                      style={isTargetOpen ? { color: pointColor } : {}}
                    >
                      ▶
                    </span>
                  </div>
                </div>

                {isTargetOpen && (
                  <div className="border-t border-slate-50 bg-[#F8F9FA]/30 px-4 py-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {isNewsLoading ? (
                      <div className="text-center py-4 text-xs font-semibold text-slate-400 animate-pulse">
                        관련 뉴스 기사를 분석 중...
                      </div>
                    ) : keywordNewsList.length > 0 ? (
                      keywordNewsList.map((news, idx) => {
                        const isBookmarked = bookmarks && bookmarks.some((b) => b.id === news.id);
                        return (
                          <div key={news.id || idx} className="pb-2.5 last:pb-0 border-b border-dashed border-slate-100 last:border-b-0">
                            <div className="flex justify-between items-start gap-2">
                              <a
                                href={news.original_url || news.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-slate-800 hover:text-blue-600 hover:underline block leading-snug truncate"
                              >
                                • {news.title}
                              </a>
                              {onToggleBookmark && (
                                <button
                                  onClick={() => onToggleBookmark(news)}
                                  className="text-sm cursor-pointer transition-transform hover:scale-110 shrink-0"
                                  style={{ color: isBookmarked ? pointColor : "#C4C4C4" }}
                                >
                                  {isBookmarked ? "★" : "☆"}
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 pl-2">
                              {news.summary_1}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-xs font-medium text-slate-400">
                        현재 관련 뉴스 내용이 존재하지 않습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}