import React, { useState } from 'react';
import { DUTY_MEAL_SQUADS, isTripleShiftSite } from '../../domain/dutyMeals';
import { workOn } from '../../domain/workHistory';

const addDaysStr = (dateStr, n) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const t = new Date(y, m - 1, d + n);
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
};

// شريط تنبيه أعلى تبويب «الوحدات والموقف» (كل شاشاته الفرعية): دورة مرشحة اقتربت أو بدأت ولم تُوزَّع وجباتها
export const PendingNominationAlert = ({ ctx }) => {
    const { pendingNomCycles, setShiftAssignmentKey } = ctx;
    if (!pendingNomCycles.length) return null;
    return (
        <div className="space-y-2 no-print">
            {pendingNomCycles.map(c => (
                <div key={c.start + '|' + c.until} className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs font-black text-amber-900">🎯 {c.nominees.length} مرشحاً ينتظرون توزيعهم على الوجبات (تبدأ الفترة {c.start})</span>
                    <button onClick={() => setShiftAssignmentKey(c.start + '|' + c.until)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-lg text-xs transition cursor-pointer">
                        توزيع وقرارات
                    </button>
                </div>
            ))}
        </div>
    );
};

// نافذة توزيع المرشحين على الوجبات والقرار في المناوبين الحاليين (يُجدَّد لهم أو يعودون صباحيين).
// الحالة والحفظ في StaffSystem؛ الحقول المحلية هنا مسودة النافذة فقط.
export const ShiftAssignmentModal = ({ ctx }) => {
    const { shiftAssignmentKey, setShiftAssignmentKey, pendingNomCycles, applyShiftAssignments, org } = ctx;
    const cycle = pendingNomCycles.find(c => c.start + '|' + c.until === shiftAssignmentKey);
    const [squads, setSquads] = useState({});
    const [decisions, setDecisions] = useState({});
    const [renewSquads, setRenewSquads] = useState({});
    const [leaveUndecided, setLeaveUndecided] = useState(false);
    if (!cycle) return null;
    const dayBefore = addDaysStr(cycle.start, -1);
    const close = () => setShiftAssignmentKey(null);
    const unitIdx = (u) => { const i = org.units.findIndex(x => x.name === u); return i === -1 ? 999 : i; };
    // وحدات المرشحين والمناوبين الحاليين معاً، فلا يبقى مناوب بلا أزرار قرار إن تغيّر حصر pendingNominations
    const units = [...new Set([...cycle.nominees, ...cycle.outgoing].map(e => e.unit || ''))].sort((a, b) => unitIdx(a) - unitIdx(b));
    const curOf = (e) => workOn(e, dayBefore);
    const renewSquadOf = (e) => renewSquads[e.id] || curOf(e).squad || '';
    const undecided = cycle.outgoing.filter(e => !decisions[e.id]);
    const missingNominee = cycle.nominees.filter(e => !squads[e.id]);
    const renewMissing = cycle.outgoing.filter(e => decisions[e.id] === 'renew' && !renewSquadOf(e));
    let problem = '';
    if (missingNominee.length) problem = 'حدّد وجبة كل مرشح (' + missingNominee.length + ' بلا وجبة).';
    else if (renewMissing.length) problem = 'حدّد وجبة كل من يُجدَّد له.';
    else if (undecided.length && !leaveUndecided) problem = 'قرّر لكل مناوب حالي، أو أشّر على ترك من لم يُقرَّر له.';
    const save = () => {
        if (problem) return;
        const changes = [];
        cycle.nominees.forEach(e => changes.push({ id: e.id, action: 'squad', squad: squads[e.id], start: cycle.start }));
        cycle.outgoing.forEach(e => {
            if (decisions[e.id] === 'renew') {
                const kind = curOf(e).shiftKind || (isTripleShiftSite(e.unit || '') ? '24h' : '12h');
                changes.push({ id: e.id, action: 'renew', squad: renewSquadOf(e), start: cycle.start, until: cycle.until, shiftKind: kind });
            } else if (decisions[e.id] === 'morning') {
                changes.push({ id: e.id, action: 'morning', start: cycle.start });
            }
        });
        if (applyShiftAssignments(changes)) close();
    };
    const squadSelect = (value, onChange) => (
        <select value={value} onChange={(e) => onChange(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-indigo-600">
            <option value="">— الوجبة —</option>
            {DUTY_MEAL_SQUADS.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
    );
    const choiceBtn = (e, val, label) => (
        <button type="button" onClick={() => setDecisions({ ...decisions, [e.id]: val })}
            className={`px-2 py-1 rounded-lg text-[11px] font-black border transition cursor-pointer ${decisions[e.id] === val ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'}`}>
            {label}
        </button>
    );
    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[130] flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-800 p-4 text-white flex-shrink-0 flex items-center justify-between">
                    <h3 className="text-base font-black flex items-center gap-2"><span>🎯</span><span>توزيع وقرارات الفترة من {cycle.start}{cycle.until ? ' إلى ' + cycle.until : ''}</span></h3>
                    <button type="button" onClick={close} aria-label="إغلاق" title="إغلاق"
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold transition cursor-pointer flex-shrink-0">✕</button>
                </div>
                <div className="p-5 space-y-4 text-right overflow-y-auto min-h-0 flex-1">
                    {units.map(unit => {
                        const noms = cycle.nominees.filter(e => (e.unit || '') === unit);
                        const outs = cycle.outgoing.filter(e => (e.unit || '') === unit);
                        return (
                            <div key={unit || '—'} className="border border-slate-200 rounded-2xl p-3 space-y-3">
                                <div className="text-sm font-black text-indigo-900">{unit || 'بلا وحدة'}</div>
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-slate-700">المرشحون ({noms.length}):</p>
                                    {noms.map(e => (
                                        <div key={e.id} className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                                            <div className="flex-1 min-w-0 text-xs font-black text-slate-900 truncate">{e.name}</div>
                                            {squadSelect(squads[e.id] || '', (v) => setSquads({ ...squads, [e.id]: v }))}
                                        </div>
                                    ))}
                                </div>
                                {outs.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-slate-700">المناوبون الحاليون ({outs.length}):</p>
                                        {outs.map(e => (
                                            <div key={e.id} className="border border-slate-200 rounded-xl px-3 py-2 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <div className="flex-1 min-w-0 text-xs font-black text-slate-900 truncate">{e.name} <span className="text-[10px] font-bold text-slate-500">(وجبته الحالية: {curOf(e).squad || '—'})</span></div>
                                                    {choiceBtn(e, 'renew', 'يُجدَّد له')}
                                                    {choiceBtn(e, 'morning', 'يعود صباحياً')}
                                                </div>
                                                {decisions[e.id] === 'renew' && (
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                        <span>الوجبة المقترحة:</span>
                                                        {squadSelect(renewSquadOf(e), (v) => setRenewSquads({ ...renewSquads, [e.id]: v }))}
                                                        <span>حتى {cycle.until || 'بلا نهاية'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {undecided.length > 0 && (
                        <label className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 leading-relaxed cursor-pointer">
                            <input type="checkbox" checked={leaveUndecided} onChange={(e) => setLeaveUndecided(e.target.checked)} className="mt-0.5" />
                            <span>ترك من لم يُقرَّر له ({undecided.length}): يعود صباحياً بنهاية فترته الحالية دون تغيير في سجله.</span>
                        </label>
                    )}
                    {problem && <div className="text-xs font-bold text-rose-700">{problem}</div>}
                </div>
                <div className="flex gap-2 p-5 pt-3 border-t border-slate-100 flex-shrink-0">
                    <button type="button" onClick={save} disabled={!!problem}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600">
                        💾 حفظ
                    </button>
                    <button type="button" onClick={close} className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black rounded-xl text-xs transition cursor-pointer">
                        ✕ إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};
