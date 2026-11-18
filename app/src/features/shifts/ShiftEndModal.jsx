import React, { useState } from 'react';
import { hasOpenEndedShift } from '../../domain/workHistory';

// نافذة وضع تاريخ نهاية موحّد على المناوبين الحاليين بلا نهاية (منتقي تاريخ منبثق).
// تُرسم في المستوى الأعلى من StaffSystem لتتوسط الشاشة (داخل حاوية متحركة يصير fixed نسبةً إليها).
// شرط الظهور (shiftEndOpen) يبقى عند موضع الاستدعاء.
export const ShiftEndModal = ({ ctx }) => {
    const { staff, todayStr, setCurrentShiftEnd, setShiftEndOpen } = ctx;
    const [shiftEndPick, setShiftEndPick] = useState('');
    const openEndedShiftCount = staff.filter(s => hasOpenEndedShift(s, todayStr)).length;
    const confirmShiftEnd = () => {
        if (!shiftEndPick) return;
        const n = setCurrentShiftEnd(shiftEndPick);
        if (!n) return;
        setShiftEndOpen(false);
        alert('✅ وُضع تاريخ النهاية ' + shiftEndPick + ' على ' + n + ' مناوباً.');
    };
    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[130] flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-800 p-4 text-white flex items-center justify-between">
                    <h3 className="text-base font-black flex items-center gap-2"><span>📅</span><span>نهاية مناوبة المناوبين الحاليين</span></h3>
                    <button type="button" onClick={() => setShiftEndOpen(false)} aria-label="إغلاق" title="إغلاق"
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold transition cursor-pointer flex-shrink-0">✕</button>
                </div>
                <div className="p-5 space-y-4 text-right">
                    <div className="space-y-1">
                        <label className="block text-xs font-black text-slate-700">📅 آخر يوم لمناوبتهم الحالية:</label>
                        <input type="date" value={shiftEndPick} min={todayStr} onChange={(e) => setShiftEndPick(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-indigo-600" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 leading-relaxed">
                        {shiftEndPick
                            ? <span>سيُوضع تاريخ النهاية <span className="font-mono text-indigo-800">{shiftEndPick}</span> على {openEndedShiftCount} مناوباً حالياً. من لا تُجدِّد له يعود صباحياً بعد هذا التاريخ تلقائياً، ومن تجدّد له يُرشَّح من اليوم التالي كالمعتاد.</span>
                            : <span>اختر التاريخ من التقويم (مثلاً آخر يوم في الفترة الحالية).</span>}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setShiftEndOpen(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer">إلغاء</button>
                        <button type="button" onClick={confirmShiftEnd} disabled={!shiftEndPick}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">✓ تأكيد وحفظ</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
