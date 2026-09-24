import React from 'react';

// شارة حالة دلالية (المواصفة §6.4): ok حضور/نجاح، warn تنبيه، danger غياب/حذف،
// action تحديد/إجراء، neutral للأعداد التي لا تحمل دلالة. القاعدة نفسها في className.
const BADGE_TONES = {
    ok: 'bg-[var(--ok-tint)] text-[color:var(--ok)]',
    warn: 'bg-[var(--warn-tint)] text-[color:var(--warn)]',
    danger: 'bg-[var(--danger-tint)] text-[color:var(--danger)]',
    action: 'bg-[var(--action-tint)] text-[color:var(--action-ink)]',
    neutral: 'bg-[var(--surface-muted)] text-[color:var(--ink-2)]'
};
export const StatusBadge = ({ tone = 'neutral', className = '', children, ...rest }) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap ${BADGE_TONES[tone]} ${className}`} {...rest}>
        {children}
    </span>
);
