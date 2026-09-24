import React from 'react';
import { HOURLY_LEAVE_TIMINGS } from '../../domain/hourlyLeave';

// نافذة الإجازة الزمنية: عدد الساعات وتوقيتها من الدوام. الحالة (pendingHourlyLeave) والحفظ في StaffSystem؛
// هذا المكوّن يرسم فقط ويستلم ما يحتاجه عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const HourlyLeaveModal = ({ ctx }) => {
    const { confirmHourlyLeave, pendingHourlyLeave, setPendingHourlyLeave } = ctx;
    const { empName, hours, timing } = pendingHourlyLeave;
    const set = (patch) => setPendingHourlyLeave(prev => prev && ({ ...prev, ...patch }));
    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fadeIn no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-5 text-white flex items-center gap-3 flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30">
                        ⏰
                    </div>
                    <div>
                        <h3 className="font-black text-lg">إجازة زمنية</h3>
                        <p className="text-xs opacity-90 font-bold mt-0.5">{empName}</p>
                    </div>
                </div>

                <div className="p-6 space-y-5 text-right overflow-y-auto min-h-0 flex-1">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-800">عدد الساعات:</label>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map(h => (
                                <button key={h} onClick={() => set({ hours: h })}
                                    className={`w-10 h-10 rounded-xl text-sm font-black border transition cursor-pointer ${hours === h ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-800">توقيت الإجازة:</label>
                        <div className="grid grid-cols-3 gap-2">
                            {HOURLY_LEAVE_TIMINGS.map(t => (
                                <button key={t} onClick={() => set({ timing: t })}
                                    className={`px-2 py-2.5 rounded-xl text-xs font-black border transition cursor-pointer ${timing === t ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] font-bold text-slate-500">يظهر التوقيت في عمود الملاحظات بكشف الموقف اليومي.</p>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 justify-end flex-shrink-0">
                    <button onClick={() => setPendingHourlyLeave(null)}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-bold transition cursor-pointer">
                        إلغاء
                    </button>
                    <button onClick={confirmHourlyLeave} disabled={!timing}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-black shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        ✅ تثبيت
                    </button>
                </div>
            </div>
        </div>
    );
};
