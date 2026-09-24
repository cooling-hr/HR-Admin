import React from 'react';

// تنبيهات الفترات المنتهية وغير المؤكَّدة أو القريبة من الانتهاء. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const PeriodAlerts = ({ ctx }) => {
    const { periodAlerts } = ctx;
    return (
        <div className="mb-4 space-y-2 no-print">
            {periodAlerts.endedUnconfirmed.length > 0 && (
                <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-xl">
                    <div className="font-black text-rose-900 text-sm mb-1">🔴 انتهت فترتهم ولم تُؤكَّد المباشرة ({periodAlerts.endedUnconfirmed.length})</div>
                    <div className="text-xs text-rose-800 font-bold leading-relaxed">
                        {periodAlerts.endedUnconfirmed.map(a => `${a.emp.name} (${a.period.type} — انتهت ${a.period.to})`).join(' · ')}
                    </div>
                </div>
            )}
            {periodAlerts.endingSoon.length > 0 && (
                <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl">
                    <div className="font-black text-amber-900 text-sm mb-1">🟡 تنتهي فترتهم خلال ثلاثة أيام ({periodAlerts.endingSoon.length})</div>
                    <div className="text-xs text-amber-800 font-bold leading-relaxed">
                        {periodAlerts.endingSoon.map(a => `${a.emp.name} (${a.period.type} — بعد ${a.daysLeft} يوم)`).join(' · ')}
                    </div>
                </div>
            )}
        </div>
    );
};
