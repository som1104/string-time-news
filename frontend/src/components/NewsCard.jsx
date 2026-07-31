import React from 'react';
// 💡 로컬 이미지를 import 합니다 (경로는 실제 위치에 맞춰 확인해 주세요)
import defaultImg from "../assets/no_image.png"; 

const NewsCard = ({ article, bookmarks, onToggleBookmark }) => {
  const {
    title,
    summary_1,
    image_url,
    original_url
  } = article;

  const isBookmarked = bookmarks && bookmarks.some((b) => b.id === article.id);

  const handleCardClick = () => {
    if (original_url) {
      window.open(original_url, "_blank", "noopener,noreferrer");
    }
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    if (onToggleBookmark) onToggleBookmark(article);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`flex flex-col bg-white overflow-hidden w-full h-[620px] rounded-3xl border border-slate-100 shadow-[0_6px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.05)] hover:scale-[1.01] transition-all duration-300 group ${original_url ? 'cursor-pointer' : ''}`}
    >
      
      {/* 📸 사진 및 제목 영역 */}
      <div className="w-full h-[410px] overflow-hidden shrink-0 relative">
        <img 
          // 💡 삼항 연산자와 onError를 통한 이중 방어
          src={image_url || defaultImg} 
          alt={title || '뉴스 이미지'} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          onError={(e) => { e.target.src = defaultImg; }}
        />

        {/* ⭐ 즐겨찾기 뱃지 */}
        {onToggleBookmark && (
          <button
            onClick={handleBookmarkClick}
            className="absolute top-4 right-4 z-20 text-2xl cursor-pointer transition-transform hover:scale-110 drop-shadow-md"
            style={{ color: isBookmarked ? "#F59E0B" : "#E5E7EB" }}
          >
            {isBookmarked ? "★" : "☆"}
          </button>
        )}

        {/* ✍️ 이미지 위에 겹쳐지는 제목 영역 */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent z-10">
          <div className="absolute inset-0 bg-black/20 z-0"></div>
          <h2 className="text-xl font-black text-white mb-1 leading-snug tracking-tight line-clamp-2 relative z-10 drop-shadow-md">
            “ {title} ”
          </h2>
        </div>
      </div>
      
      {/* ✍️ 하단 요약 내용 영역 */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <p className="text-slate-600 font-medium text-[13px] leading-relaxed line-clamp-6 break-keep">
            {summary_1 || '요약된 내용이 없습니다.'}
          </p>
        </div>
        
        <div className="pt-3 border-t border-slate-100 mt-4 flex justify-between items-center">
          {original_url ? (
            <span className="text-[12px] font-black text-slate-800 group-hover:text-blue-600 transition-colors">
              
            </span>
          ) : (
            <span className="text-[12px] text-slate-400 italic">링크 제공 안됨</span>
          )}
        </div>
      </div>

    </div>
  );
};

export default NewsCard;