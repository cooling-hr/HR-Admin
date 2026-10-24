import React from 'react';
import { DAILY_STATUS_GROUPS } from './UnitsScreen';
import { PERIOD_TYPES } from '../../domain/periods';
import { OFFICIAL_TIME_CODES, STATUS_TO_CODE_ID, linkedStatusesOf, normalizeTimeFormCodeEdits, resolveCodeTable, validateCodeEdit } from '../../domain/timeForm';

// حالات لها معنى في النظام ولا تظهر في المصادر الثلاثة أدناه، فلا يُعاد استعمالها معنى لرمز مضاف
const EXTRA_RESERVED_STATUSES = ['استراحة نهاية الأسبوع', 'حضور فعلي', 'دوام صباحي', 'إجازة زمنية', 'إجازة اعتيادية', 'ورقة عمل', 'مكلف بواجب'];

const BTN = 'px-2 py-1 rounded-lg font-black text-[11px] transition';
const BTN_OFF = 'bg-slate-100 text-slate-400 cursor-not-allowed';
const INPUT = 'px-2 py-1 border-2 border-slate-200 rounded-lg font-bold text-sm text-slate-800 focus:border-indigo-500 focus:outline-none';

// نافذة «دليل الرموز» (المواصفة 4.4): كل رموز استمارة ضبط الوقت، وإضافة رمز يصير حالة يومية، وتعديل الحرف
// والمعنى والحذف والاستعادة. الحالة في StaffSystem؛ هذا المكوّن يرسم ويحسب الكتابة ويستلم ما يحتاجه عبر ctx.
export const CodesGuideModal = ({ ctx }) => {
    const { timeFormCodeEdits, updateTimeFormCodeEdits, countCodeUsage, canEditCodes, codesLockedBy, setShowCodesGuide } = ctx;
    const [editingId, setEditingId] = React.useState(null);
    const [editLetter, setEditLetter] = React.useState('');
    const [editMeaning, setEditMeaning] = React.useState('');
    const [notice, setNotice] = React.useState(null);
    const [addLetter, setAddLetter] = React.useState('');
    const [addMeaning, setAddMeaning] = React.useState('');

    const edits = normalizeTimeFormCodeEdits(timeFormCodeEdits);
    const table = resolveCodeTable(edits);
    const reservedStatuses = [...new Set([
        ...DAILY_STATUS_GROUPS.flatMap(g => g.options.map(o => o.value)),
        ...PERIOD_TYPES,
        ...Object.keys(STATUS_TO_CODE_ID),
        ...EXTRA_RESERVED_STATUSES,
    ])];

    const officialOf = (id) => OFFICIAL_TIME_CODES.find(c => c.id === id);
    const isCustom = (id) => edits.custom.some(c => c.id === id);
    const isActivated = (id) => !!officialOf(id) && edits.activated.includes(id) && linkedStatusesOf(id).length === 0;
    const removedCodes = OFFICIAL_TIME_CODES.filter(c => edits.removed.includes(c.id) && linkedStatusesOf(c.id).length === 0);
    const save = (patch) => updateTimeFormCodeEdits({ ...edits, ...patch });
    const fail = (id, text) => setNotice({ id, text });
    const usedText = (n) => `مستعمل في ${n} يوماً`;

    const startEdit = (c) => { setEditingId(c.id); setEditLetter(c.letter); setEditMeaning(c.meaning); setNotice(null); };
    const cancelEdit = () => { setEditingId(null); setNotice(null); };

    const saveEdit = (c) => {
        const letter = editLetter.trim().toUpperCase();
        const meaning = editMeaning.trim();
        const err = validateCodeEdit(table, { id: c.id, letter, meaning }, reservedStatuses);
        if (err) return fail(c.id, err);
        if (isCustom(c.id)) {
            save({ custom: edits.custom.map(x => x.id === c.id ? { ...x, letter, meaning } : x) });
        } else {
            const base = officialOf(c.id);
            const overrides = { ...edits.overrides };
            const o = {};
            if (letter !== base.letter) o.letter = letter;
            if (meaning !== base.meaning) o.meaning = meaning;
            if (o.letter || o.meaning) overrides[c.id] = o; else delete overrides[c.id];
            save({ overrides });
        }
        setEditingId(null);
        setNotice(null);
    };

    const restoreDefault = (c) => {
        const base = officialOf(c.id);
        const err = validateCodeEdit(table, { id: c.id, letter: base.letter, meaning: base.meaning }, reservedStatuses);
        if (err) return fail(c.id, err);
        const used = isActivated(c.id) && c.meaning !== base.meaning ? countCodeUsage(c.meaning) : 0;
        if (used > 0) return fail(c.id, `لا يُستعاد الافتراضي: معنى الرمز ${usedText(used)}.`);
        const overrides = { ...edits.overrides };
        delete overrides[c.id];
        save({ overrides });
        setNotice(null);
    };

    const removeCode = (c) => {
        const used = (isCustom(c.id) || isActivated(c.id)) ? countCodeUsage(c.meaning) : 0;
        if (used > 0) return fail(c.id, `لا يُحذف: ${usedText(used)}.`);
        if (!window.confirm(`حذف الرمز ${c.letter} «${c.meaning}» من الدليل؟`)) return;
        if (isCustom(c.id)) save({ custom: edits.custom.filter(x => x.id !== c.id) });
        else save({ removed: [...edits.removed, c.id], activated: edits.activated.filter(x => x !== c.id) });
        setNotice(null);
    };

    const restoreRemoved = (base) => {
        const o = edits.overrides[base.id] || {};
        const err = validateCodeEdit(table, { id: base.id, letter: o.letter || base.letter, meaning: o.meaning || base.meaning }, reservedStatuses);
        if (err) return fail(base.id, err);
        save({ removed: edits.removed.filter(x => x !== base.id) });
        setNotice(null);
    };

    const activate = (c) => {
        const tmpTable = resolveCodeTable({ ...edits, activated: [...edits.activated, c.id] });
        const err = validateCodeEdit(tmpTable, { id: c.id, letter: c.letter, meaning: c.meaning }, reservedStatuses);
        if (err) return fail(c.id, err);
        save({ activated: [...edits.activated, c.id] });
        setNotice(null);
    };

    const deactivate = (c) => {
        const used = countCodeUsage(c.meaning);
        if (used > 0) return fail(c.id, `لا يُلغى التفعيل: ${usedText(used)}.`);
        save({ activated: edits.activated.filter(x => x !== c.id) });
        setNotice(null);
    };

    const addCode = () => {
        const letter = addLetter.trim().toUpperCase();
        const meaning = addMeaning.trim();
        const err = validateCodeEdit(table, { letter, meaning }, reservedStatuses);
        if (err) return fail('add', err);
        save({ custom: [...edits.custom, { id: 'c' + Date.now().toString(36), letter, meaning }] });
        setAddLetter('');
        setAddMeaning('');
        setNotice(null);
    };

    const NoticeText = ({ id }) => notice && notice.id === id ? <p className="text-xs font-bold text-red-700 mt-1">{notice.text}</p> : null;

    const actionBtn = (label, onClick, color, title) => (
        <button type="button" disabled={!canEditCodes} onClick={onClick} title={title} className={`${BTN} ${canEditCodes ? color + ' cursor-pointer' : BTN_OFF}`}>{label}</button>
    );

    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-fadeIn no-print">
            <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 px-6 py-4 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">📖</div>
                        <div>
                            <h3 className="text-xl font-black">دليل الرموز</h3>
                            <p className="text-xs text-indigo-100 font-bold">رموز استمارة ضبط الوقت، تُعدَّل وتُضاف وتُحذف منه</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCodesGuide(false)}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg transition cursor-pointer"
                        title="إغلاق النافذة"
                    >
                        ✕
                    </button>
                </div>

                {codesLockedBy && (
                    <div className="bg-amber-50 text-amber-900 border-b border-slate-200 px-6 py-2 text-xs font-black">
                        🔒 {codesLockedBy} يعدّل الموقف اليومي الآن — الدليل للاطلاع.
                    </div>
                )}

                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-slate-800 font-black text-xs">
                                    <th className="px-3 py-2 text-right w-20">الحرف</th>
                                    <th className="px-3 py-2 text-right">المعنى</th>
                                    <th className="px-3 py-2 text-right">حالة النظام</th>
                                    <th className="px-3 py-2 text-right">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {table.list.map(c => {
                                    const linked = linkedStatusesOf(c.id);
                                    const custom = isCustom(c.id);
                                    const activated = isActivated(c.id);
                                    const base = officialOf(c.id);
                                    const hasOverride = !!base && !!edits.overrides[c.id];
                                    const editing = editingId === c.id;
                                    const usage = (custom || activated) ? countCodeUsage(c.meaning) : 0;
                                    const statusText = linked.length ? linked.join('، ') : custom ? 'حالة مضافة' : activated ? 'حالة مفعَّلة' : '—';
                                    return (
                                        <React.Fragment key={c.id}>
                                            <tr className="border-t border-slate-100 align-top">
                                                <td className="px-3 py-2">
                                                    {editing
                                                        ? <input value={editLetter} onChange={e => setEditLetter(e.target.value)} aria-label="الحرف" className={`${INPUT} w-16 text-center`} />
                                                        : <span className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1 rounded font-black text-xs bg-slate-100 text-slate-700">{c.letter}</span>}
                                                </td>
                                                <td className="px-3 py-2 font-bold text-slate-800">
                                                    {editing
                                                        ? <input value={editMeaning} onChange={e => setEditMeaning(e.target.value)} aria-label="المعنى" disabled={usage > 0} title={usage > 0 ? `مستعمل في ${usage} يوماً، فلا يُغيَّر معناه` : undefined} className={`${INPUT} w-full ${usage > 0 ? 'bg-slate-100 text-slate-500' : ''}`} />
                                                        : c.meaning}
                                                </td>
                                                <td className="px-3 py-2 text-xs font-bold text-slate-600">{statusText}</td>
                                                <td className="px-3 py-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {editing ? (<>
                                                            {actionBtn('💾 حفظ', () => saveEdit(c), 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700')}
                                                            <button type="button" onClick={cancelEdit} className={`${BTN} bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer`}>إلغاء</button>
                                                        </>) : (<>
                                                            {actionBtn('✏️ تعديل', () => startEdit(c), 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800')}
                                                            {hasOverride && actionBtn('↩️ استعادة الافتراضي', () => restoreDefault(c), 'bg-slate-100 hover:bg-slate-200 text-slate-600')}
                                                            {!!base && !linked.length && !activated && actionBtn('➕ استعماله حالةً يومية', () => activate(c), 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800')}
                                                            {activated && actionBtn('إلغاء التفعيل', () => deactivate(c), 'bg-amber-100 hover:bg-amber-200 text-amber-900')}
                                                            {!linked.length && actionBtn('🗑️ حذف', () => removeCode(c), 'bg-rose-100 hover:bg-rose-200 text-rose-700')}
                                                        </>)}
                                                    </div>
                                                </td>
                                            </tr>
                                            {notice && notice.id === c.id && (
                                                <tr><td colSpan={4} className="px-3 pb-2"><NoticeText id={c.id} /></td></tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {removedCodes.length > 0 && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                            <h4 className="text-sm font-black text-slate-800">رموز محذوفة من الدليل</h4>
                            {removedCodes.map(base => {
                                const o = edits.overrides[base.id] || {};
                                return (
                                    <div key={base.id}>
                                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                                            <span><span className="font-black">{o.letter || base.letter}</span> — {o.meaning || base.meaning}</span>
                                            {actionBtn('↩️ استعادة', () => restoreRemoved(base), 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700')}
                                        </div>
                                        <NoticeText id={base.id} />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                        <h4 className="text-sm font-black text-slate-800">➕ إضافة رمز</h4>
                        <div className="flex flex-wrap items-center gap-2">
                            <input value={addLetter} onChange={e => setAddLetter(e.target.value)} disabled={!canEditCodes} placeholder="الحرف" aria-label="حرف الرمز الجديد" className={`${INPUT} w-20 text-center`} />
                            <input value={addMeaning} onChange={e => setAddMeaning(e.target.value)} disabled={!canEditCodes} placeholder="المعنى" aria-label="معنى الرمز الجديد" className={`${INPUT} flex-1 min-w-[10rem]`} />
                            {actionBtn('➕ إضافة', addCode, 'bg-indigo-600 hover:bg-indigo-700 text-white')}
                        </div>
                        <NoticeText id="add" />
                        <p className="text-[11px] font-bold text-slate-500">الرمز المضاف يظهر خياراً في قائمة الموقف اليومي ضمن «رموز أخرى»، وتكتبه الاستمارة تلقائياً.</p>
                    </div>
                </div>

                <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={() => setShowCodesGuide(false)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-sm"
                    >
                        إغلاق النافذة
                    </button>
                </div>
            </div>
        </div>
    );
};
