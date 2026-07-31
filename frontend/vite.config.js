import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 👈 Tailwind v4 전용 Vite 플러그인 가져오기

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 플러그인 배열에 반드시 추가해야 합니다!
  ],
  server: {
    // ngrok 등 외부 도메인으로 접속할 때 Vite의 Host 헤더 차단을 풀어줍니다.
    allowedHosts: true,
  },
})