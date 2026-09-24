import React from 'react';
import { OPEN_ENDED_PERIOD_TYPES, quickPeriodEnd } from '../../domain/periods';

// معالج الفترة السريعة من قائمة الحالة. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const QuickPeriodModal = ({ ctx }) => {
    const { quickPeriod, saveQuickPeriod, setQuickPeriod } = ctx;
    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[130] flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-800 p-4 text-white flex-shrink-0 flex items-center justify-between">
                    <h3 className="text-base font-black flex items-center gap-2"><span>📅</span><span>{quickPeriod.editingId ? 'تعديل فترة' : 'تسجيل فترة'}: {quickPeriod.category}</span></h3>
                    <button type="button" onClick={() => setQuickPeriod(null)} aria-label="إغلاق" title="إغلاق (Esc)"
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold transition cursor-pointer flex-shrink-0">✕</button>
                </div>
                <div className="p-5 space-y-4 text-right overflow-y-auto min-h-0 flex-1">
                    <p className="text-sm font-black text-slate-900">{quickPeriod.empName}</p>

                    {quickPeriod.category === 'إجازة طويلة' && (
                        <div className="space-y-1">
                            <label className="block text-xs font-black text-slate-700">صنف الإجازة:</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setQuickPeriod({ ...quickPeriod, paid: true })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition cursor-pointer ${quickPeriod.paid ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'}`}>
                                    براتب (إجازة اعتيادية)
                                </button>
                                <button type="button" onClick={() => setQuickPeriod({ ...quickPeriod, paid: false })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition cursor-pointer ${!quickPeriod.paid ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'}`}>
                                    بدون راتب
                                </button>
                            </div>
                        </div>
                    )}

                    {/* سحب اليد غالباً يأتي بعد غياب فعلي (وليس دائماً)، فيحتاج المسؤول أحياناً
                        إعادة تصنيف فترة غياب قائمة إلى سحب يد بعد صدور قرار إداري/قانوني —
                        هذا التبديل متاح فقط عند تعديل فترة موجودة، لا عند تسجيل فترة جديدة
                        (فالتصنيف عندها يُختار مسبقاً من قائمة «الحالة» نفسها) */}
                    {quickPeriod.editingId && OPEN_ENDED_PERIOD_TYPES.includes(quickPeriod.category) && (
                        <div className="space-y-1">
                            <label className="block text-xs font-black text-slate-700">تبديل التصنيف:</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setQuickPeriod({ ...quickPeriod, category: 'غياب' })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition cursor-pointer ${quickPeriod.category === 'غياب' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-slate-700 border-slate-300 hover:border-red-400'}`}>
                                    غياب
                                </button>
                                <button type="button" onClick={() => setQuickPeriod({ ...quickPeriod, category: 'سحب يد' })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition cursor-pointer ${quickPeriod.category === 'سحب يد' ? 'bg-red-800 text-white border-red-900' : 'bg-white text-slate-700 border-slate-300 hover:border-red-400'}`}>
                                    سحب يد
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-black text-slate-700">📅 من تاريخ:</label>
                        <input
                            type="date"
                            value={quickPeriod.from}
                            onChange={(e) => setQuickPeriod({ ...quickPeriod, from: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-indigo-600"
                        />
                    </div>

                    {/* الغياب وسحب اليد يُحدَّدان بتاريخ بداية فقط — مفتوحا النهاية دائماً بلا
                        استثناء، فلا معنى لعرض اختيار مدة أو تاريخ نهاية لهما، بخلاف بقية الأنواع */}
                    {!OPEN_ENDED_PERIOD_TYPES.includes(quickPeriod.category) && (
                        <>
                            <div className="space-y-1">
                                <label className="block text-xs font-black text-slate-700">طريقة تحديد النهاية:</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setQuickPeriod({ ...quickPeriod, mode: 'duration' })}
                                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${quickPeriod.mode === 'duration' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'}`}>
                                        تحديد بالمدة
                                    </button>
                                    <button type="button" onClick={() => setQuickPeriod({ ...quickPeriod, mode: 'date' })}
                                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${quickPeriod.mode === 'date' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'}`}>
                                        تحديد بتاريخ النهاية
                                    </button>
                                </div>
                            </div>

                            {quickPeriod.mode === 'duration' ? (
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1">
                                        <label className="block text-xs font-black text-slate-700">⏳ المدة:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quickPeriod.count}
                                            onChange={(e) => setQuickPeriod({ ...quickPeriod, count: e.target.value })}
                                            placeholder="مثال: 5"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-indigo-600"
                                        />
                                    </div>
                                    <select
                                        value={quickPeriod.unit}
                                        onChange={(e) => setQuickPeriod({ ...quickPeriod, unit: e.target.value })}
                                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-indigo-600"
                                    >
                                        <option value="days">يوم</option>
                                        <option value="months">شهر</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="block text-xs font-black text-slate-700">📅 إلى تاريخ:</label>
                                    <input
                                        type="date"
                                        value={quickPeriod.to}
                                        min={quickPeriod.from}
                                        onChange={(e) => setQuickPeriod({ ...quickPeriod, to: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-indigo-600"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 leading-relaxed">
                        {quickPeriodEnd(quickPeriod) ? (
                            <span>الفترة المحسوبة: <span className="font-mono text-indigo-800">{quickPeriod.from}</span> ← <span className="font-mono text-indigo-800">{quickPeriodEnd(quickPeriod)}</span></span>
                        ) : OPEN_ENDED_PERIOD_TYPES.includes(quickPeriod.category) ? (
                            <span>{quickPeriod.category} مفتوح النهاية — يبقى ظاهراً في الكشف حتى تُنهيه بإعادة الحالة إلى «نشط».</span>
                        ) : (
                            <span className="text-rose-700">حدّد المدة أو تاريخ النهاية أولاً.</span>
                        )}
                    </div>

                </div>

                <div className="flex gap-2 p-5 pt-3 border-t border-slate-100 flex-shrink-0">
                    <button type="button" onClick={saveQuickPeriod} disabled={!quickPeriodEnd(quickPeriod) && !OPEN_ENDED_PERIOD_TYPES.includes(quickPeriod.category)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600">
                        {quickPeriod.editingId ? '💾 حفظ التعديل' : '💾 حفظ الفترة'}
                    </button>
                    <button type="button" onClick={() => setQuickPeriod(null)} className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black rounded-xl text-xs transition cursor-pointer">
                        ✕ إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};
