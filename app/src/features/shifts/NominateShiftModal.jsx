import React, { useState } from 'react';
import { localDateStr, addMonthsClamped } from '../../core/dates';
import { isTripleShiftSite } from '../../domain/dutyMeals';

// نهاية فترة بالتقويم الميلادي: اليوم السابق لذكرى البداية بعد عدد من الأشهر
const untilAfterMonths = (start, months) => {
    if (!start) return '';
    const anniv = addMonthsClamped(start, months);
    const [y, m, d] = anniv.split('-').map(Number);
    return localDateStr(new Date(y, m - 1, d - 1));
};

// نافذة ترشيح المناوبين مسبقاً (جديد) أو تعديل تاريخي دورة مرشحة (edit). الحالة والمعالجة في StaffSystem؛
// الحقول المحلية هنا مسودة النافذة فقط. شرط الظهور يبقى عند موضع الاستدعاء.
export const NominateShiftModal = ({ ctx }) => {
    const { nominateModal, setNominateModal, nominateBasket, setNominateBasket, nominatePeriod, setNominatePeriod, staff, nominationCycles, nominateEmployees, editNominationCycle } = ctx;
    const isEdit = nominateModal.mode === 'edit';
    const isPeriod = nominateModal.mode === 'period';
    const isNew = !isEdit && !isPeriod;
    const todayStr = localDateStr();
    // دورة مفتوحة قائمة: تُقترح تاريخاها افتراضياً عند ترشيح جديد
    // لا تُقترح دورة بدأت فعلاً: تاريخ بدايتها يسبق اليوم فتفشل النافذة في فحصها هي
    const open = isPeriod && !nominateModal.start ? (nominationCycles.find(c => c.start >= todayStr) || null) : null;
    const initStart = isNew ? nominatePeriod.start : (isEdit || nominateModal.start) ? nominateModal.start : (open ? open.start : '');
    const [start, setStart] = useState(initStart || '');
    const [duration, setDuration] = useState(isEdit || open || nominateModal.until ? 'manual' : '6');
    const [manualEnd, setManualEnd] = useState(isEdit || nominateModal.until ? nominateModal.until : (open ? open.until : ''));
    const [kinds, setKinds] = useState({});
    const nominees = !isNew ? [] : staff.filter(s => nominateBasket.includes(s.id));
    const kindOf = (s) => kinds[s.id] || (s.workType === 'مناوب' && s.shiftKind) || (isTripleShiftSite(s.unit || '') ? '24h' : '12h');
    const until = isNew ? nominatePeriod.until : duration === 'manual' ? manualEnd : untilAfterMonths(start, Number(duration));
    let problem = '';
    if (!start) problem = 'حدّد تاريخ البداية.';
    else if (start < todayStr && !(!isNew && start === nominateModal.start)) problem = 'تاريخ البداية يجب ألا يسبق اليوم.';
    else if (!until) problem = 'حدّد تاريخ النهاية.';
    else if (until < start) problem = 'تاريخ النهاية قبل البداية.';
    else if (isNew && nominees.length === 0) problem = 'لا يوجد مرشحون في السلة.';
    const close = () => setNominateModal(null);
    const save = () => {
        if (problem) return;
        let ok;
        if (isEdit) {
            ok = editNominationCycle(nominateModal.start, nominateModal.until, start, until);
            // فترة الترشيح المفتوحة على الدورة نفسها تتبع تاريخيها الجديدين، وإلا رُشِّح الباقون بالقديمين فانقسمت الدورة
            if (ok && nominatePeriod && nominatePeriod.start === nominateModal.start && nominatePeriod.until === nominateModal.until) setNominatePeriod({ start, until });
        }
        else if (isPeriod) {
            // اعتماد الفترة: بدء وضع الترشيح يكون بسلة فارغة، أما تغيير الفترة فيُبقي المختارين
            if (!nominatePeriod) setNominateBasket([]);
            setNominatePeriod({ start, until });
            ok = true;
        } else {
            const kindMap = {};
            nominees.forEach(s => { kindMap[s.id] = kindOf(s); });
            ok = nominateEmployees(nominees.map(s => s.id), { start, until, shiftKind: '12h', kinds: kindMap });
            if (ok) setNominateBasket([]); // الفترة تبقى لإكمال وحدات أخرى؛ ينهيها المستخدم من الشريط
        }
        if (ok) close();
    };
    const choiceBtn = (val, label) => (
        <button type="button" onClick={() => setDuration(val)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${duration === val ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'}`}>
            {label}
        </button>
    );
    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[130] flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-800 p-4 text-white flex-shrink-0 flex items-center justify-between">
                    <h3 className="text-base font-black flex items-center gap-2"><span>🎯</span><span>{isEdit ? 'تعديل تاريخي دورة الترشيح' : (isPeriod ? 'فترة ترشيح المناوبين' : 'ترشيح للمناوبة')}</span></h3>
                    <button type="button" onClick={close} aria-label="إغلاق" title="إغلاق"
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold transition cursor-pointer flex-shrink-0">✕</button>
                </div>
                <div className="p-5 space-y-4 text-right overflow-y-auto min-h-0 flex-1">
                    {open && (
                        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs font-bold text-amber-900 leading-relaxed">
                            توجد دورة مرشحة مفتوحة ({open.start} ← {open.until || 'بلا نهاية'}): اقتُرح تاريخاها ليكون الجميع في دورة واحدة. يمكنك تغييرهما.
                        </div>
                    )}
                    {!isNew && <>
                    <div className="space-y-1">
                        <label className="block text-xs font-black text-slate-700">📅 بداية المناوبة:</label>
                        <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-indigo-600" />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-black text-slate-700">⏳ مدة الفترة:</label>
                        <div className="flex gap-2">
                            {choiceBtn('6', '6 أشهر')}
                            {choiceBtn('3', '3 أشهر')}
                            {choiceBtn('manual', 'تاريخ نهاية يدوي')}
                        </div>
                        {duration === 'manual' && (
                            <input type="date" value={manualEnd} min={start} onChange={(e) => setManualEnd(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-indigo-600" />
                        )}
                    </div>
                    </>}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 leading-relaxed">
                        {problem ? <span className="text-rose-700">{problem}</span> : (
                            <span>الفترة: <span className="font-mono text-indigo-800">{start}</span> ← <span className="font-mono text-indigo-800">{until}</span> (بعدها يعود المرشح صباحياً). لا يتغير شيء قبل تاريخ البداية.</span>
                        )}
                    </div>
                    {isNew && (
                        <div className="space-y-2">
                            <p className="text-xs font-black text-slate-700">المرشحون ({nominees.length}) — الوجبة تُحدَّد لاحقاً عند اقتراب البداية:</p>
                            {nominees.map(s => (
                                <div key={s.id} className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-black text-slate-900 truncate">{s.name}</div>
                                        <div className="text-[10px] font-bold text-slate-500">{s.unit || '—'}</div>
                                        {s.workType === 'مناوب' && (
                                            <div className="text-[10px] font-black text-indigo-700">🔄 مناوب حالياً (وجبته: {s.squad || '—'}) — يُجدَّد له، وتُحدَّد وجبته عند التوزيع</div>
                                        )}
                                    </div>
                                    <select value={kindOf(s)} onChange={(e) => setKinds({ ...kinds, [s.id]: e.target.value })}
                                        className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-indigo-600">
                                        <option value="24h">ثلاثية (24 ساعة)</option>
                                        <option value="12h">ثنائية (12 ساعة)</option>
                                    </select>
                                    <button type="button" onClick={() => setNominateBasket(nominateBasket.filter(x => x !== s.id))}
                                        aria-label="إزالة من السلة" title="إزالة من السلة"
                                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex-shrink-0">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex gap-2 p-5 pt-3 border-t border-slate-100 flex-shrink-0">
                    <button type="button" onClick={save} disabled={!!problem}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600">
                        {isEdit ? '💾 حفظ التاريخين' : (isPeriod ? '⏳ اعتماد الفترة واختيار الأشخاص' : '🎯 ترشيح')}
                    </button>
                    <button type="button" onClick={close} className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black rounded-xl text-xs transition cursor-pointer">
                        ✕ إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};
