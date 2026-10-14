import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// 💡 공개 데모용 로컬 로그인 (백엔드 /api/login 대응)
import { loginWithNickname } from '../services/demoAuth';

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

      // 💡 공개 데모에서는 서버 대신 브라우저에 닉네임과 user_id 를 보관한다.
      //    (백엔드 /api/check-nickname, /api/login 과 같은 규칙으로 동작)
      const user = loginWithNickname(username);

      // 안내 메시지 가동
      if (user.isNew) {
        alert(`🎉 가입을 환영합니다, ${user.username}님!`);
      } else {
        alert(`👋 반갑습니다, ${user.username}님!`);
      }

      // 로그인 성공 후 첫 메인 화면(Home.jsx)으로 안전하게 이동
      navigate('/');
    } catch (error) {
      console.error("로그인 처리 중 오류:", error);
      alert("로그인 처리에 실패했습니다. 브라우저 설정(개인정보 보호 모드)을 확인해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4 sm:px-5 font-sans antialiased">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 w-full max-w-md">
        
        {/* 서비스 심볼 그래픽 */}
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-md mx-auto mb-4">
          AI
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 text-center tracking-tight">서비스 시작하기</h2>
        <p className="text-xs text-slate-400 font-medium text-center mb-8 break-keep">사용하실 닉네임만 입력하면 즉시 로그인이 완료됩니다.</p>
        
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

