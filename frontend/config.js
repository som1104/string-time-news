// src/config.js
// 백엔드 FastAPI 서버 주소.
// 공개 데모(Vercel)는 public/data/*.json 정적 데이터를 사용하므로 이 값을 쓰지 않습니다.
// backend/main.py 를 직접 띄워 서버 연동 버전으로 돌릴 때만 사용합니다.
// 로컬 개발 시 frontend/.env에 VITE_API_BASE_URL=http://127.0.0.1:8000 을 추가하면 이 값이 우선 적용됩니다.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://project-2-27c7.onrender.com";