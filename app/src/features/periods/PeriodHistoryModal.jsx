import React from 'react';
import { localDateStr } from '../../core/dates';
import { periodPhaseOf, periodsOf } from '../../domain/periods';

// سجل فترات الموظف. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const PeriodHistoryModal = ({ ctx }) => {
    const { canEdit, deletePeriodFromHistory, openPeriodEdit, periodHistoryEmpId, periodSpanJsx, setPeriodHistoryEmpId, staff } = ctx;
    return (() => {
        const emp = (staff || []).find(s => s.id === periodHistoryEmpId);
        if (!emp) return null;
        const today = localDateStr();
        const list = periodsOf(emp).slice().sort((a, b) => (a.from < b.from ? 1 : -1));
        const canManage = canEdit('staffMaster');
        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 no-print" onClick={() => setPeriodHistoryEmpId(null)}>
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 flex items-center justify-between flex-shrink-0">
                    <div className="text-right">
                        <h3 className="text-base font-black">📅 سجل فترات الموظف</h3>
                        <p className="text-xs font-bold text-indigo-100 mt-0.5">{emp.name} — {emp.jobNumber}</p>
                    </div>
                    <button type="button" onClick={() => setPeriodHistoryEmpId(null)} aria-label="إغلاق سجل الفترات" title="إغلاق (Esc)"
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold transition cursor-pointer flex-shrink-0">✕</button>
                </div>
                <div className="p-4 space-y-2 overflow-y-auto">
                    {list.length === 0 ? (
                        <p className="text-sm font-bold text-slate-500 text-center py-6">لا فترات مؤرخة لهذا المنتسب.</p>
                    ) : list.map((p, idx) => {
                        const phase = periodPhaseOf(p, today);
                        const phaseClass = phase === 'سارية' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : phase === 'قادمة' ? 'bg-sky-100 text-sky-800 border-sky-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300';
                        return (
                            <div key={p.id || (p.type + p.from + idx)} data-period-id={p.id || ''}
                                className="border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${phaseClass}`}>{phase}</span>
                                        <span className="text-sm font-black text-slate-800">{p.type}</span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-600">{periodSpanJsx(p)}</div>
                                    {p.note ? <div className="text-[11px] font-bold text-slate-500">📝 {p.note}</div> : null}
                                </div>
                                {canManage && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button type="button" onClick={() => openPeriodEdit(emp, p)}
                                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-black border border-indigo-200 transition cursor-pointer">تعديل</button>
                                        <button type="button" onClick={() => deletePeriodFromHistory(emp, p)}
                                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-black border border-rose-200 transition cursor-pointer">حذف</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-[11px] font-bold text-slate-600 flex-shrink-0">
                    التعديل يفتح نافذة الفترة نفسها مملوءة، والحذف يُسجَّل فلا يُعيده ملف أقدم.
                </div>
            </div>
        </div>
        );
    })();
};
