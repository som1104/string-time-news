import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// 💡 공통 백엔드 주소를 가져옵니다 (상위로 두 단계 이동)
import { API_BASE_URL } from '../../config';

const Login = () => {
  const navigate = useNavigate();
  // 💡 백엔드 명세(username)에 맞춰 상태를 하나로 통합합니다.
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // 유효성 검사 (공백 차단)
    if (!username.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);

      // 💡 1단계: 닉네임 중복 확인 (선택 사항이지만 백엔드에 설계된 API를 검증차 활용합니다)
      const checkRes = await fetch(`${API_BASE_URL}/api/check-nickname?username=${encodeURIComponent(username.trim())}`, {
       headers: { "ngrok-skip-browser-warning": "69420" }
      });
      const checkData = await checkRes.json();
      
      // 💡 2단계: 로그인 또는 자동 회원가입 요청 진행
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420" // 👈 여기에 추가!
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) throw new Error("서버 응답 오류");
      const resJson = await response.json();

      if (resJson.status === "success") {
        // 💡 백엔드가 돌려준 { user_id, username } 데이터셋을 로컬 스토리지에 세션 대용으로 저장
        localStorage.setItem("user_id", resJson.data.user_id);
        localStorage.setItem("username", resJson.data.username);

        // 💡 서버에 저장된 즐겨찾기를 가져와 이 기기의 캐시에 반영 (다른 기기에서 저장한 것도 이어서 보이게)
        try {
          const favRes = await fetch(`${API_BASE_URL}/api/favorites?user_id=${resJson.data.user_id}`, {
            headers: { "ngrok-skip-browser-warning": "69420" }
          });
          const favJson = await favRes.json();
          if (favJson.status === "success") {
            localStorage.setItem(`news_bookmarks_${resJson.data.user_id}`, JSON.stringify(favJson.data));
          }
        } catch (syncError) {
          console.error("즐겨찾기 서버 동기화 실패:", syncError);
        }

        // 안내 메시지 가동
        if (checkData.status === "available") {
          alert(`🎉 가입을 환영합니다, ${resJson.data.username}님!`);
        } else {
          alert(`👋 반갑습니다, ${resJson.data.username}님!`);
        }

        // 로그인 성공 후 첫 메인 화면(Home.jsx)으로 안전하게 이동
        navigate('/');
      } else {
        alert(resJson.message || "로그인 처리에 실패했습니다.");
      }

    } catch (error) {
      console.error("로그인 연동 중 장애 발생:", error);
      alert("백엔드 API 서버와 통신할 수 없습니다. 서버 가동 상태를 점검해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-5 font-sans antialiased">
      <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 w-full max-w-md">
        
        {/* 서비스 심볼 그래픽 */}
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-md mx-auto mb-4">
          AI
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 text-center tracking-tight">서비스 시작하기</h2>
        <p className="text-xs text-slate-400 font-medium text-center mb-8">사용하실 닉네임만 입력하면 즉시 로그인이 완료됩니다.</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">닉네임</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 text-sm bg-[#F2F4F6] rounded-xl focus:bg-white border border-transparent focus:border-slate-200 outline-none transition-all placeholder:text-slate-400 font-medium"
              placeholder="멋진 닉네임을 입력해 주세요"
              maxLength={15}
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm mt-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {isLoading ? "인증 정보 확인 중..." : "동의하고 시작하기"}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-slate-50">
          <Link to="/" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
            ← 로그인 없이 먼저 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

