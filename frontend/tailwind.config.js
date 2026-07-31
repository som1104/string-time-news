/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // 💡 components와 pages 폴더 내부의 모든 js, jsx 파일을 감시하도록 명시해야 합니다.
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    
    // 또는 간단하게 src 하위의 모든 폴더를 스캔하도록 아래처럼 작성해도 됩니다.
    // "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}