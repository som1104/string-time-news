import React, { useEffect, useState } from 'react';

// 💡 OpenWeatherMap 아이콘 코드를 화사한 이모지로 변환
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
    return emojiMap[iconCode] || '🌤️';
};

const TodayWeather = () => {
    const [weather, setWeather] = useState(null);
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    useEffect(() => {
        const success = (position) => {
            const { latitude, longitude } = position.coords;
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=kr`)
                .then(res => res.json())
                .then(data => {
                    setWeather({
                        temp: Math.round(data.main.temp),
                        iconCode: data.weather[0].icon // ⭕ URL 대신 코드만 저장
                    });
                })
                .catch(err => console.error(err));
        };
        navigator.geolocation.getCurrentPosition(success, () => {});
    }, [apiKey]);

    if (!weather) return <div className="w-24 h-12 bg-slate-100 rounded-full animate-pulse"></div>;

    return (
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-5 h-full rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-default min-w-max">
            {/* ⭕ 이미지 <img> 대신 큼직한 이모지로 렌더링합니다 */}
            <span className="text-2xl drop-shadow-sm pb-1 select-none">
                {getWeatherEmoji(weather.iconCode)}
            </span>
            <span className="text-[15px] font-black text-slate-800 tracking-tighter">
                {weather.temp}°C
            </span>
        </div>
    );
};

export default TodayWeather;