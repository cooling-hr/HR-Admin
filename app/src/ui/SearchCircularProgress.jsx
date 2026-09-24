import React from 'react';

// مكون رسم الدوائر الإحصائية التفاعلية للبحث (إصدار V5.1)
export const SearchCircularProgress = ({ percent, label, color = "text-sky-300", size = 76, strokeWidth = 7 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    
    return (
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[70px]">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="rgba(255, 255, 255, 0.12)"
                        strokeWidth={strokeWidth}
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        className={`${color} transition-all duration-1000 ease-out`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <span className="text-[13px] font-black tracking-tight">{percent}%</span>
                </div>
            </div>
            <span className="text-[10px] font-extrabold text-blue-100 text-center leading-tight max-w-[85px] line-clamp-2">
                {label}
            </span>
        </div>
    );
};
