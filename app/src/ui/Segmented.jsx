import React from 'react';

// شريحة مُعمَّمة (segmented control): مسار رمادي بحبّة نشطة مرفوعة، بأعمدة متساوية
// (grid-flow-col + auto-cols-fr) عرضُ كلٍّ منها بقدر أطول الخيارات، والمسار بعرضها لا بعرض
// الشريط (sm:w-fit) — ممتدّاً كان يُقرأ زراً واحداً (المواصفة §14.2). يتكدّس تحت `sm`.
// الفاصل بين الخيارات ولون التحويم في CSS تحت «.seg-opt».
export const Segmented = ({ options, value, onChange, ariaLabel, stackBelow = 'sm' }) => {
    const stackClass = stackBelow === 'sm'
        ? 'grid-cols-2 sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr'
        : 'grid-cols-1 sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr';
    return (
        <div className={`seg-track grid ${stackClass} gap-1 p-1 bg-slate-100 rounded-xl sm:w-fit sm:max-w-full`} aria-label={ariaLabel}>
            {options.map(opt => {
                const on = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        aria-pressed={on ? 'true' : 'false'}
                        title={opt.title}
                        className={`seg-opt min-w-0 [overflow-wrap:anywhere] flex items-center justify-center text-center gap-1 px-3 py-2 rounded-lg text-xs md:text-sm font-bold leading-snug transition-all duration-200 cursor-pointer ${
                            on
                                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {opt.icon ? <span>{opt.icon}</span> : null}{opt.label}
                    </button>
                );
            })}
        </div>
    );
};
