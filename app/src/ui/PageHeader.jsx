import React from 'react';
import { Icon } from './Icon';

// ترويسة صفحة موحّدة محايدة (المواصفة §6.1) تحلّ محلّ بانرات التدرّج لكل شاشة.
// icon إمّا اسم من ICON_PATHS (الحالة الشائعة) أو عقدة React جاهزة — لهوية ديناميكية
// ليست بعد ضمن ICON_PATHS (أيقونة/إيموجي الوحدة في شاشة «الوحدة المختارة»، تحويلها
// مهمة المرحلة 3 لا هذه المرحلة). meta لا يفرض تغليف شارة موحّد: بعض الشاشات تحتاج
// أكثر من عنصر meta بتنسيقين مختلفين (عدّاد + شارة ملوّنة)، فالمستدعي يغلّف بنفسه.
export const PageHeader = ({ icon, title, description, meta, actions }) => (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[color:var(--border)]">
        <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-black text-[color:var(--ink)] flex items-center gap-2 flex-wrap">
                {icon && (typeof icon === 'string'
                    ? <Icon name={icon} className="w-5 h-5 text-[color:var(--action)] flex-shrink-0" />
                    : icon)}
                <span>{title}</span>
            </h1>
            {(description || meta) && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {description && <p className="text-xs text-[color:var(--ink-2)]">{description}</p>}
                    {meta}
                </div>
            )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
);
