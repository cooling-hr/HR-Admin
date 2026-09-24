import React from 'react';

// الأزرار بأربع درجات (المواصفة §6.2)، وألوانها من رموز التصميم وحدها — فلا تحتاج أي
// مدخل في طبقة الوضع الليلي. className للتخطيط فقط (عرض، ترتيب، flex-shrink): فئة تنافس
// فئات الدرجة أو المقاس (px-/py-/rounded-/bg-/justify-) لا تفوز بموضعها في النص بل بترتيب
// Tailwind الداخلي، فتُهمَل بصمت. شكل جديد يُضاف درجةً أو مقاساً هنا، لا تجاوزاً في الاستعمال.
const BUTTON_BASE = 'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--action)]';
const BUTTON_VARIANTS = {
    primary: 'bg-[var(--action)] hover:bg-[var(--action-hover)] text-white shadow-sm',
    secondary: 'bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[color:var(--ink)] border border-[color:var(--border-strong)]',
    ghost: 'text-[color:var(--ink-2)] hover:text-[color:var(--ink)] hover:bg-[var(--surface-muted)]',
    danger: 'bg-[var(--danger-tint)] text-[color:var(--danger)] border border-[color:var(--danger-border)]'
};
const BUTTON_SIZES = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
export const Button = ({ variant = 'secondary', size = 'md', type = 'button', className = '', children, ...rest }) => (
    <button type={type} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`} {...rest}>
        {children}
    </button>
);
