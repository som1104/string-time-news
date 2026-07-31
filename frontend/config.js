// src/config.js
// 백엔드 Fast API 또는 Express 서버의 주소를 적어줍니다.
// 로컬 개발 시 frontend/.env에 VITE_API_BASE_URL=http://127.0.0.1:8000 을 추가하면 이 값이 우선 적용됩니다.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ai-news-service-2eyc.onrender.com";