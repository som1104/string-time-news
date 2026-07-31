import React, { useEffect, useState } from 'react';

// 💡 주간 날씨용 이모지 변환 함수
const getWeatherEmoji = (iconCode) => {
    const emojiMap = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '☔',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    // 시간대 관계없이 낮(d) 아이콘으로 통일하여 보여줍니다
    const code = iconCode.replace('n', 'd'); 
    return emojiMap[code] || '🌤️';
};

const WeatherIcon = () => {
    const [forecast, setForecast] = useState([]);
    const [address, setAddress] = useState("위치 확인 중...");
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    useEffect(() => {
        const success = (position) => {
            const { latitude, longitude } = position.coords;
            
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko`)
                .then(res => res.json())
                .then(data => setAddress(data.address.sigungu || data.address.city || "내 위치"));

            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=kr`)
                .then(res => res.json())
                .then(data => {
                    const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
                    setForecast(dailyData);
                })
                .catch(err => console.error("날씨 정보를 불러오지 못했습니다.", err));
        };

        const error = () => { setAddress("위치 권한 필요"); };
        navigator.geolocation.getCurrentPosition(success, error);
    }, [apiKey]);

    if (forecast.length === 0) {
        return <div className="text-xs text-slate-400 mt-4 py-2 bg-white/50 rounded-full border border-slate-100 max-w-3xl mx-auto">날씨 불러오는 중...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto mt-5 px-6 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:shadow-[0_4px_25px_rgba(0,0,0,0.05)]">
            
            <div className="flex items-center gap-2 whitespace-nowrap">
                
                <h3 className="font-extrabold text-slate-700 text-xs flex items-center gap-1">
                    📍 {address}
                </h3>
            </div>

            <div className="flex items-center gap-5 md:gap-7 overflow-x-auto w-full md:w-auto px-2" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                {forecast.map((day, idx) => {
                    const date = new Date(day.dt * 1000);
                    const dayName = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date);
                    const temp = Math.round(day.main.temp);
                    
                    return (
                        <div key={idx} className="flex items-center gap-2 min-w-max group cursor-default">
                            <span className="text-[11px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">{dayName}</span>
                            {/* ⭕ 이모지로 교체하고 크기를 키움 */}
                            <span className="text-xl drop-shadow-sm group-hover:scale-125 transition-transform select-none">
                                {getWeatherEmoji(day.weather[0].icon)}
                            </span>
                            <span className="text-xs font-black text-slate-800">{temp}°</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeatherIcon;