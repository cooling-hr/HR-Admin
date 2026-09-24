import React from 'react';
import { arabicManualDaysCount, normalizeJobNumber } from '../../core/arabic';
import { localDateStr } from '../../core/dates';
import { mergeKeyOf } from '../../domain/merge';
import { periodIdentityOf } from '../../domain/periods';
import { Button } from '../../ui/Button';
import { StatusBadge } from '../../ui/StatusBadge';

// نافذة دمج البيانات المستوردة مع الموجودة. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const MergeModal = ({ ctx }) => {
    const { attendanceValueJsx, cancelMerge, confirmCloudFreshness, handleFullOverwrite, handleSmartMerge, incomingBundle, incomingStaff, mergeAddCount, mergeAddSelection, mergeAnalysis, mergeAttendance, mergeAttendanceCount, mergeAttendancePending, mergeAttendanceSelection, mergeClearDaysSelection, mergeDeleteCount, mergeDeleteSelection, mergePendingPeriodWarnings, mergePeriodCount, mergePeriodSelection, mergeSelectedCount, mergeSelection, mergeTotalChanges, periodRangeJsx, setMergeAddScope, setMergeAttendanceScope, setMergePeriodScope, setMergeScope, toggleMergeAdd, toggleMergeAttendance, toggleMergeClearDays, toggleMergeDelete, toggleMergeField, toggleMergePeriod } = ctx;
    return (() => {
        // التحليل يأتي جاهزاً من useMemo — مربّعات الاختيار مبنية عليه،
        // وإعادة حسابه هنا في كل رسم كانت تُعيد ترقيم ما يشير إليه الاختيار
        const analysis = mergeAnalysis;
        if (!analysis) return null;
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fadeIn no-print">
                {/* حدّ ارتفاع 92vh وعمود مرن: الرأس (وفيه ✕) والذيل (وفيه «إلغاء العملية») ثابتان،
                    والجسم وحده يُمرَّر — فيبقى الإلغاء ظاهراً مهما طال المحتوى. */}
                <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
                    <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white p-6 text-center relative flex-shrink-0">
                        <button
                            type="button"
                            onClick={cancelMerge}
                            aria-label="إغلاق نافذة المزامنة"
                            title="إغلاق دون تطبيق أي تغيير (Esc)"
                            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition cursor-pointer"
                        >
                            ✕
                        </button>
                        <div className="text-5xl mb-3">🔄</div>
                        <h3 className="text-xl font-bold">خيارات مزامنة ودمج قاعدة البيانات</h3>
                        <p className="text-indigo-100 text-xs mt-1.5 opacity-90">
                            لقد قمت بتحميل ملف بيانات خارجي يحتوي على ({incomingStaff.length}) موظف. يرجى اختيار طريقة الدمج:
                        </p>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
                        {/* تقرير المزامنة والدمج الذكي */}
                        <div className="p-4 bg-indigo-50 bg-opacity-60 rounded-2xl border border-indigo-100 text-xs text-indigo-950 font-bold space-y-1.5 animate-fadeIn">
                            <div className="text-sm font-black text-indigo-900 border-b border-indigo-100 pb-1 mb-2">📊 تقرير تحليل الفروقات قبل الدمج:</div>
                            <div className="flex justify-between">
                                <span>➕ عدد الموظفين الجدد للإضافة:</span>
                                <span className="text-emerald-700">{analysis.added.length} موظف</span>
                            </div>
                            <div className="flex justify-between">
                                <span>✏️ عدد الموظفين الذين سيتم تحديث حقولهم:</span>
                                <span className="text-amber-700">{analysis.updated.length} موظف</span>
                            </div>
                            {analysis.periods.length > 0 && (
                                <div className="flex justify-between">
                                    <span>📅 فترات مؤرخة مختلفة بين الملف وجهازك:</span>
                                    <span className="text-amber-700">{analysis.periods.length} فترة</span>
                                </div>
                            )}
                            {mergeAttendance && mergeAttendance.items.length > 0 && (
                                <div className="flex justify-between">
                                    <span>📋 مواقف يومية وساعات مختلفة بين الملف وجهازك:</span>
                                    <span className="text-amber-700">{mergeAttendance.items.length} موقف</span>
                                </div>
                            )}
                            {analysis.ambiguousJobs && analysis.ambiguousJobs.length > 0 && (
                                <div className="flex justify-between gap-2">
                                    <span>⚠️ أرقام وظيفية مكررة لديك لم تُقارَن (صحّحها ثم أعد المزامنة):</span>
                                    <span className="text-amber-700">{analysis.ambiguousJobs.join('، ')}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>🔒 إجمالي الموظفين في الملف المرفوع:</span>
                                <span>{incomingStaff.length} موظف</span>
                            </div>

                            {(analysis.deletedElsewhere || []).length > 0 && (
                                <div className="mt-2 bg-white bg-opacity-80 p-3 rounded-xl border border-rose-100 font-normal space-y-1.5 text-right">
                                    <div className="border-b border-rose-100 pb-1.5">
                                        <span className="font-black text-rose-900">🗑️ موظفون محذوفون على الجهاز الآخر وما زالوا لديك:</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                        لا يُحذف أحد إلا بتأشيرك. الحذف يُزيل الموظف من جهازك ويُسجَّل، فلا يعود من ملف أقدم.
                                    </div>
                                    <div className="max-h-28 overflow-y-auto space-y-0.5 text-[11px]">
                                        {(analysis.deletedElsewhere || []).map((del, dIdx) => {
                                            const picked = !!mergeDeleteSelection[del.jobNumber];
                                            return (
                                                <label key={del.jobNumber || dIdx} data-delete-job={del.jobNumber}
                                                    className={`flex items-center gap-1.5 cursor-pointer rounded px-1 py-0.5 ${picked ? 'bg-rose-50' : ''}`}>
                                                    <input type="checkbox" checked={picked}
                                                        onChange={() => toggleMergeDelete(del.jobNumber)}
                                                        className="w-3.5 h-3.5 accent-rose-600 cursor-pointer" />
                                                    <span className={picked ? 'text-rose-900 font-bold' : 'text-slate-500'}>
                                                        {picked ? 'سيُحذف من جهازك:' : 'يبقى لديك:'} {del.name} <span className="font-mono">({del.jobNumber})</span>
                                                        {del.at ? <span className="text-slate-400"> — حُذف هناك <bdi dir="ltr" className="whitespace-nowrap">{String(del.at).slice(0, 10)}</bdi></span> : null}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {analysis.added.length > 0 && (
                                <div className="mt-2 bg-white bg-opacity-80 p-3 rounded-xl border border-indigo-100 font-normal space-y-1.5 text-right">
                                    <div className="flex justify-between items-center flex-wrap gap-1.5 border-b pb-1.5">
                                        <span className="font-black text-indigo-950">من يُضاف من غير الموجودين لديك:</span>
                                        <span className="flex items-center gap-1.5">
                                            <button type="button" onClick={() => setMergeAddScope(true)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100">الكل</button>
                                            <button type="button" onClick={() => setMergeAddScope(false)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200">لا أحد</button>
                                        </span>
                                    </div>
                                    <div className="max-h-28 overflow-y-auto space-y-0.5 text-[11px]">
                                        {analysis.added.map((emp, aIdx) => {
                                            const num = normalizeJobNumber(emp.jobNumber);
                                            const picked = !!mergeAddSelection[num];
                                            const wasDeleted = (analysis.previouslyDeleted || {})[num];
                                            return (
                                                <label key={num || aIdx} data-add-job={num}
                                                    className={`flex items-center gap-1.5 cursor-pointer rounded px-1 py-0.5 ${picked ? 'bg-indigo-50/60' : ''}`}>
                                                    <input type="checkbox" checked={picked}
                                                        onChange={() => toggleMergeAdd(num)}
                                                        className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" />
                                                    <span className={picked ? 'text-indigo-950 font-bold' : 'text-slate-400'}>
                                                        {emp.name} <span className="font-mono">({num})</span>
                                                        {wasDeleted ? (
                                                            <span className="text-rose-700 font-bold"> — حذفتَه سابقاً{wasDeleted.at ? <React.Fragment> <bdi dir="ltr" className="whitespace-nowrap">{String(wasDeleted.at).slice(0, 10)}</bdi></React.Fragment> : null}؛ التأشير يُعيده</span>
                                                        ) : null}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t pt-1.5 text-[11px] font-black text-indigo-900">
                                        سيُضاف {mergeAddCount} من أصل {analysis.added.length}
                                    </div>
                                </div>
                            )}

                            {analysis.updated.length > 0 && (
                                <div className="mt-3 bg-white bg-opacity-80 p-3 rounded-xl border border-indigo-100 font-normal space-y-2 text-right">
                                    <div className="flex justify-between items-center flex-wrap gap-1.5 border-b pb-1.5">
                                        <span className="font-black text-indigo-950">اختر ما تريد تطبيقه:</span>
                                        <span className="flex items-center gap-1.5">
                                            <button type="button" onClick={() => setMergeScope('all', true)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100">تحديد الكل</button>
                                            <button type="button" onClick={() => setMergeScope('all', false)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200">إلغاء الكل</button>
                                        </span>
                                    </div>
                                    {/* المؤشَّر تلقائياً هو ما كان حقلك فيه فارغاً — كسبٌ بلا تعارض */}
                                    <div className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                        المؤشَّر تلقائياً: الحقول الفارغة لديك (لا تعارض فيها). ما وُسم <span className="font-bold text-[color:var(--warn)]">تعارض</span> لديك فيه قيمة مختلفة، وما وُسم <span className="font-bold text-[color:var(--action-ink)]">إملائي</span> نفس النص بصيغة كتابة أخرى — تُركا بلا تأشير لتقرّرهما بنفسك.
                                    </div>
                                    <div className="max-h-44 overflow-y-auto space-y-2 pl-1">
                                    {analysis.updated.map((upd, uIdx) => (
                                        <div key={upd.jobNumber || uIdx} className="border-b border-dashed border-indigo-100 pb-2 last:border-b-0 last:pb-0">
                                            {/* ثابت أثناء التمرير: بلا ذلك تُؤشِّر حقلاً وقد غاب اسم صاحبه عن الشاشة */}
                                            <div className="flex justify-between items-center gap-2 mb-1 sticky top-0 bg-white py-1 z-10">
                                                <span className="font-bold text-indigo-900">👤 {upd.name} (رقم: {upd.jobNumber})</span>
                                                <span className="flex items-center gap-1 flex-shrink-0">
                                                    <button type="button" onClick={() => setMergeScope(upd.jobNumber, true)}
                                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100">الكل</button>
                                                    <button type="button" onClick={() => setMergeScope(upd.jobNumber, false)}
                                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">لا شيء</button>
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-1 text-[11px] pr-1">
                                                {upd.changes.map((ch, cIdx) => {
                                                    const picked = !!mergeSelection[mergeKeyOf(upd.jobNumber, ch.field)];
                                                    return (
                                                        <label key={ch.field || cIdx}
                                                            className={`flex justify-between flex-wrap gap-1 items-center cursor-pointer rounded px-1 py-0.5 ${picked ? 'bg-indigo-50/60' : ''}`}>
                                                            <span className="flex items-center gap-1.5 text-gray-600">
                                                                <input type="checkbox" checked={picked}
                                                                    onChange={() => toggleMergeField(upd.jobNumber, ch.field)}
                                                                    className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" />
                                                                <span>حقل {ch.fieldNameAr}:</span>
                                                                {ch.cosmeticOnly
                                                                    ? <StatusBadge tone="action" title="نفس النص بصيغة كتابة مختلفة (مسافة أو همزة أو تاء مربوطة)">إملائي</StatusBadge>
                                                                    : !ch.wasEmpty && <StatusBadge tone="warn">تعارض</StatusBadge>}
                                                            </span>
                                                            {/* الكلمات تقول ما سيحدث، لا الشطب وحده: قُرئ الشطب الرمادي على قيمة الملف «تأشيراً»، وسُئل عن الأحمر «أهو الإلغاء؟» */}
                                                            <span className="font-semibold flex flex-wrap items-center gap-1">
                                                                {picked ? (
                                                                    ch.wasEmpty ? (
                                                                        <React.Fragment>
                                                                            <span className="text-[10px] font-bold text-emerald-700">يُضاف:</span>
                                                                            <span className="text-emerald-700 bg-emerald-50 px-1 rounded">{ch.newVal}</span>
                                                                        </React.Fragment>
                                                                    ) : (
                                                                        <React.Fragment>
                                                                            <span className="text-[10px] font-bold text-rose-700">يُستبدل:</span>
                                                                            <span className="line-through text-rose-500 bg-rose-50 px-1 rounded">{ch.oldVal}</span>
                                                                            <span className="mx-0.5">←</span>
                                                                            <span className="text-[10px] font-bold text-emerald-700">يُطبَّق:</span>
                                                                            <span className="text-emerald-700 bg-emerald-50 px-1 rounded">{ch.newVal}</span>
                                                                        </React.Fragment>
                                                                    )
                                                                ) : (
                                                                    <React.Fragment>
                                                                        <span className="text-[10px] font-bold text-slate-600">يبقى:</span>
                                                                        <span className="text-slate-700 bg-slate-100 px-1 rounded">{ch.oldVal}</span>
                                                                        <span className="text-[10px] font-bold text-slate-400 mr-1">— في الملف (لن يُطبَّق):</span>
                                                                        <span className="text-slate-500 bg-slate-50 px-1 rounded">{ch.newVal}</span>
                                                                    </React.Fragment>
                                                                )}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                    <div className="border-t pt-1.5 text-[11px] font-black text-indigo-900">
                                        سيُطبَّق {mergeSelectedCount} حقلاً من أصل {mergeTotalChanges}
                                        {mergeSelectedCount === 0 && <span className="text-slate-500 font-bold"> — لن يتغيّر أي حقل حالي</span>}
                                    </div>
                                </div>
                            )}
                            {analysis.periods.length > 0 && (
                                <div className="mt-3 bg-white bg-opacity-80 p-3 rounded-xl border border-indigo-100 font-normal space-y-2 text-right">
                                    <div className="flex justify-between items-center flex-wrap gap-1.5 border-b pb-1.5">
                                        <span className="font-black text-indigo-950">📅 الفترات المؤرخة المختلفة:</span>
                                        <span className="flex items-center gap-1.5">
                                            <button type="button" onClick={() => setMergePeriodScope(true)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100">كل الفترات</button>
                                            <button type="button" onClick={() => setMergePeriodScope(false)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200">لا فترة</button>
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                        الدمج لا يحذف فترة مؤرخة لم تختر استبدالها. المؤشَّر تلقائياً: ما لا يمسّ شيئاً لديك. <span className="text-amber-700">الشارة البرتقالية تنبيه</span>: الفترة تمسّ فترة أو حالة أو أياماً مثبَّتة لديك، فلا تُطبَّق ما لم تؤشّرها — واختيار فترة الملف يحذف من جهازك ما يظهر تحتها «سيُحذف».
                                    </div>
                                    {/* بلا سقف تمرير داخلي: جسم النافذة يُمرَّر أصلاً، والتمرير المتداخل يحبس العجلة داخل صندوق صغير */}
                                    <div className="space-y-1.5 pl-1 text-[11px]">
                                        {analysis.periods.map(item => {
                                            const picked = !!mergePeriodSelection[item.key];
                                            const ip = item.incoming;
                                            const badge = item.deletedLocally ? 'حذفته من جهازك' : item.kind === 'new' ? 'فترة جديدة'
                                                : item.kind === 'changed' ? (item.gainOnly ? 'إضافة إلى فترة لديك' : 'فترة لديك بتفاصيل مختلفة')
                                                : item.kind === 'overlap' ? (item.overlaps.some(p => p.type === ip.type) ? 'قد تكون مسجَّلة مرتين' : 'تتداخل مع فترة لديك')
                                                : item.kind === 'legacy' ? 'فوق حالة غير مؤرخة لديك'
                                                : 'تخالف أياماً مثبَّتة لديك';
                                            const calm = !item.deletedLocally && (item.kind === 'new' || item.gainOnly);
                                            const replacedClass = picked ? 'line-through text-rose-500 bg-rose-50 px-1 rounded' : 'text-slate-700 bg-slate-100 px-1 rounded';
                                            return (
                                                <div key={item.key} className="border-b border-dashed border-indigo-100 pb-1.5 last:border-b-0 last:pb-0">
                                                    <label data-period-key={item.key}
                                                        className={`flex justify-between flex-wrap gap-1 items-center cursor-pointer rounded px-1 py-0.5 ${picked ? 'bg-indigo-50/60' : ''}`}>
                                                        <span className="flex items-center flex-wrap gap-1.5 text-gray-600">
                                                            <input type="checkbox" checked={picked}
                                                                onChange={() => toggleMergePeriod(item.key)}
                                                                className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" />
                                                            <span className="font-bold text-indigo-900">👤 {item.name} ({item.jobNumber})</span>
                                                            <span className={`text-[9px] font-bold px-1 rounded ${calm ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>{badge}</span>
                                                        </span>
                                                        <span className={`font-semibold px-1 rounded ${picked ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 bg-slate-100'}`}>
                                                            {periodRangeJsx(ip)}{ip.note ? ` — ${ip.note}` : ''}
                                                        </span>
                                                    </label>
                                                    {(item.local || item.overlaps.length > 0 || item.legacy) && (
                                                        <div className="pr-6 text-[10px] text-slate-500 space-y-0.5">
                                                            {item.local && !item.gainOnly && (
                                                                <div>{picked ? <span className="font-bold text-rose-700">سيُحذف من جهازك:</span> : 'لديك (يبقى):'} <span className={replacedClass}>{periodRangeJsx(item.local)}{item.local.note ? ` — ${item.local.note}` : ''}</span></div>
                                                            )}
                                                            {item.overlaps.map(p => (
                                                                <div key={periodIdentityOf(p)}>{picked ? <span className="font-bold text-rose-700">سيُحذف من جهازك:</span> : 'لديك (يبقى):'} <span className={replacedClass}>{periodRangeJsx(p)}{p.note ? ` — ${p.note}` : ''}</span></div>
                                                            ))}
                                                            {item.legacy && (
                                                                <div>لديك حالة غير مؤرخة: <span className="text-slate-700 bg-slate-100 px-1 rounded">«{item.legacy}»</span>
                                                                    {picked && <span> — {item.legacy !== ip.type ? <React.Fragment>تبقى حتى <bdi dir="ltr" className="whitespace-nowrap">{localDateStr(new Date(ip.from).getTime() - 86400000)}</bdi> ثم تحكم فترة الملف</React.Fragment> : 'تُحصر في تواريخ هذه الفترة'}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.days.length > 0 && (
                                                        <label data-clear-days-key={item.key}
                                                            className={`flex items-start gap-1.5 pr-6 mt-0.5 text-[10px] transition-opacity ${picked ? 'text-slate-600 cursor-pointer' : 'text-slate-600 opacity-50'}`}>
                                                            <input type="checkbox" checked={!!mergeClearDaysSelection[item.key]} disabled={!picked}
                                                                onChange={() => toggleMergeClearDays(item.key)}
                                                                className="w-3 h-3 mt-0.5 accent-indigo-600" />
                                                            <span>امسح {arabicManualDaysCount(item.days.length)} لديك داخل الفترة (<span className={picked && mergeClearDaysSelection[item.key] ? 'line-through text-rose-500' : ''}>{item.days.slice(0, 3).map((d, di) => <React.Fragment key={d.date}>{di > 0 ? '، ' : ''}<bdi dir="ltr" className="whitespace-nowrap">{d.date}</bdi> «{d.value}»</React.Fragment>)}{item.days.length > 3 ? ' وغيرها' : ''}</span>){picked && mergeClearDaysSelection[item.key] ? <span className="font-bold text-rose-700"> — ستُمسح عند التطبيق</span> : ' — بدونه تبقى تلك الأيام على حالها ولا تظهر الفترة فيها'}</span>
                                                        </label>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t pt-1.5 text-[11px] font-black text-indigo-900">
                                        المؤشَّر للتطبيق: {mergePeriodCount} من {analysis.periods.length}
                                        {mergePeriodCount === 0 && <span className="text-slate-500 font-bold"> — لن تتغيّر أي فترة لديك</span>}
                                        {mergePendingPeriodWarnings > 0 && <span className="text-amber-700 font-bold"> — {mergePendingPeriodWarnings} عليها تنبيه وغير مؤشَّرة، فلن تُطبَّق ما لم تؤشّرها</span>}
                                    </div>
                                </div>
                            )}

                            {analysis.localOnlyPeriods.length > 0 && (
                                <div className="mt-3 bg-white bg-opacity-80 p-3 rounded-xl border border-indigo-100 font-normal space-y-1 text-right text-[11px]">
                                    <div className="font-black text-indigo-950 border-b pb-1.5">📌 تنبيه: فترات مؤرخة لديك غير موجودة في الملف — تبقى كما هي:</div>
                                    <div className="max-h-28 overflow-y-auto space-y-0.5">
                                        {analysis.localOnlyPeriods.map(lo => (
                                            <div key={lo.key} data-local-only-key={lo.key} className="text-slate-600">
                                                👤 {lo.name} ({lo.jobNumber}): {periodRangeJsx(lo.period)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {mergeAttendance && (mergeAttendance.items.length + mergeAttendance.holidays.length + mergeAttendance.settings.length) > 0 && (
                                <div className="mt-3 bg-white bg-opacity-80 p-3 rounded-xl border border-indigo-100 font-normal space-y-2 text-right">
                                    <div className="flex justify-between items-center flex-wrap gap-1.5 border-b pb-1.5">
                                        <span className="font-black text-indigo-950">📋 المواقف اليومية والساعات الزمنية والإضافي:</span>
                                        <span className="flex items-center gap-1.5">
                                            <button type="button" onClick={() => setMergeAttendanceScope('all', true)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100">كل المواقف</button>
                                            <button type="button" onClick={() => setMergeAttendanceScope('all', false)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200">لا موقف</button>
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                        المؤشَّر تلقائياً: ما في الملف وليس لديك (تحديثات الزملاء). <span className="text-amber-700">الشارة البرتقالية تنبيه</span>: لديك قيمة أخرى أو فترة مؤرخة تغطي اليوم — فيبقى ما لديك ما لم تؤشّره. لا يُحذف شيء من جهازك.
                                    </div>
                                    {(mergeAttendance.forNewEmployees + mergeAttendance.orphans + mergeAttendance.ambiguous + mergeAttendance.invalid) > 0 && (
                                        <div className="text-[10px] text-slate-400 leading-relaxed">
                                            {mergeAttendance.forNewEmployees > 0 && <span>قيم لموظفين جدد في الملف (عددها {mergeAttendance.forNewEmployees}) تأتي معهم إن أضفتهم. </span>}
                                            {(mergeAttendance.orphans + mergeAttendance.ambiguous + mergeAttendance.invalid) > 0 && <span>وتُجاهَل قيم عددها {mergeAttendance.orphans + mergeAttendance.ambiguous + mergeAttendance.invalid}: لموظف لا يطابقه أحد، أو لرقم وظيفي مكرر لديك، أو لقيمة غير صالحة.</span>}
                                        </div>
                                    )}
                                    {Array.from(new Set(mergeAttendance.items.map(item => item.date))).map(date => {
                                        // أسطر التنبيه أولاً في كل يوم: لا تضيع بين سطور جديدة كثيرة مؤشَّرة (الترتيب ثابت داخل كل فئة)
                                        const dayItems = mergeAttendance.items.filter(item => item.date === date)
                                            .sort((a, b) => (a.kind === 'new' && !a.deletedLocally ? 1 : 0) - (b.kind === 'new' && !b.deletedLocally ? 1 : 0));
                                        return (
                                            <div key={date} data-attendance-day={date} className="border-b border-dashed border-indigo-100 pb-1.5 last:border-b-0 last:pb-0">
                                                <div className="flex justify-between items-center gap-2 mb-1">
                                                    <span className="font-bold text-indigo-900 text-[11px]">🗓️ <bdi dir="ltr" className="whitespace-nowrap">{date}</bdi> ({dayItems.length})</span>
                                                    <span className="flex items-center gap-1 flex-shrink-0">
                                                        <button type="button" onClick={() => setMergeAttendanceScope(date, true)}
                                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100">الكل</button>
                                                        <button type="button" onClick={() => setMergeAttendanceScope(date, false)}
                                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">لا شيء</button>
                                                    </span>
                                                </div>
                                                <div className="space-y-0.5 text-[11px]">
                                                    {dayItems.map(item => {
                                                        const picked = !!mergeAttendanceSelection[item.key];
                                                        const hasLocal = Object.keys(item.local).length > 0;
                                                        return (
                                                            <label key={item.key} data-attendance-key={item.key}
                                                                className={`flex justify-between flex-wrap gap-1 items-center cursor-pointer rounded px-1 py-0.5 ${picked ? 'bg-indigo-50/60' : ''}`}>
                                                                <span className="flex items-center flex-wrap gap-1.5 text-gray-600">
                                                                    <input type="checkbox" checked={picked} onChange={() => toggleMergeAttendance(item.key)}
                                                                        className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" />
                                                                    <span className="font-bold text-indigo-900">👤 {item.name} ({item.jobNumber})</span>
                                                                    {item.kind === 'period' && <span className="text-[9px] font-bold px-1 rounded text-amber-700 bg-amber-50">يخالف فترة مؤرخة لديك: «{item.period.type}»</span>}
                                                                    {item.deletedLocally && <span className="text-[9px] font-bold px-1 rounded text-amber-700 bg-amber-50">حذفته من جهازك</span>}
                                                                    {item.kind === 'different' && <span className="text-[9px] font-bold px-1 rounded text-amber-700 bg-amber-50">لديك قيمة أخرى</span>}
                                                                </span>
                                                                <span className="font-semibold flex flex-wrap items-center gap-1">
                                                                    <span className={`text-[10px] font-bold ${picked ? 'text-emerald-700' : 'text-slate-400'}`}>{picked ? 'يُطبَّق:' : 'في الملف (لن يُطبَّق):'}</span>
                                                                    <span className={picked ? 'text-emerald-700 bg-emerald-50 px-1 rounded' : 'text-slate-700 bg-slate-100 px-1 rounded'}>{attendanceValueJsx(item.incoming)}</span>
                                                                    {hasLocal && (
                                                                        <React.Fragment>
                                                                            <span className={`text-[10px] font-bold mr-1 ${picked ? 'text-rose-700' : 'text-slate-600'}`}>{picked ? '— يُستبدل:' : '— يبقى:'}</span>
                                                                            <span className={picked ? 'line-through text-rose-500 bg-rose-50 px-1 rounded' : 'text-slate-700 bg-slate-100 px-1 rounded'}>{attendanceValueJsx(item.local)}</span>
                                                                        </React.Fragment>
                                                                    )}
                                                                    {!hasLocal && item.kind === 'period' && (
                                                                        <span className={`text-[10px] font-bold mr-1 ${picked ? 'text-rose-700' : 'text-slate-600'}`}>{picked ? '— يتقدّم على الفترة في هذا اليوم' : `— تبقى الفترة: «${item.period.type}»`}</span>
                                                                    )}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {mergeAttendance.holidays.length > 0 && (
                                        <div className="border-t pt-1.5 space-y-0.5 text-[11px]">
                                            <div className="font-bold text-indigo-900">🏖️ عطل رسمية في الملف ليست لديك — تُضاف ولا يُحذف شيء:</div>
                                            {mergeAttendance.holidays.map(h => (
                                                <label key={h.key} data-setting-key={h.key}
                                                    className={`inline-flex items-center gap-1.5 cursor-pointer rounded px-1 py-0.5 ml-2 ${mergeAttendanceSelection[h.key] ? 'bg-indigo-50/60' : ''}`}>
                                                    <input type="checkbox" checked={!!mergeAttendanceSelection[h.key]} onChange={() => toggleMergeAttendance(h.key)}
                                                        className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" />
                                                    <bdi dir="ltr" className="whitespace-nowrap">{h.date}</bdi>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {mergeAttendance.settings.length > 0 && (
                                        <div className="border-t pt-1.5 space-y-0.5 text-[11px]">
                                            <div className="font-bold text-indigo-900">⚙️ إعدادات عامة مختلفة — تمسّ حساب كل الجهاز، فلا تُطبَّق ما لم تؤشّرها:</div>
                                            {mergeAttendance.settings.map(s => {
                                                const picked = !!mergeAttendanceSelection[s.key];
                                                const anchorText = (a) => (
                                                    <React.Fragment>تاريخ المرجع <bdi dir="ltr" className="whitespace-nowrap">{a.shiftAnchorDate || '—'}</bdi>، الثلاثية {a.threeShiftAnchorSquad || '—'}، الثنائية {a.twoShiftAnchorSquad || '—'}</React.Fragment>
                                                );
                                                return (
                                                    <label key={s.key} data-setting-key={s.key}
                                                        className={`flex justify-between flex-wrap gap-1 items-center cursor-pointer rounded px-1 py-0.5 ${picked ? 'bg-indigo-50/60' : ''}`}>
                                                        <span className="flex items-center gap-1.5 text-gray-600">
                                                            <input type="checkbox" checked={picked} onChange={() => toggleMergeAttendance(s.key)}
                                                                className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer" />
                                                            <span className="font-bold text-indigo-900">{s.kind === 'anchor' ? 'مرجع المناوبات' : 'اسم مُدخل البيانات'}</span>
                                                            <span className="text-[9px] font-bold px-1 rounded text-amber-700 bg-amber-50">يمسّ كل الجهاز</span>
                                                        </span>
                                                        <span className="font-semibold flex flex-wrap items-center gap-1">
                                                            <span className={`text-[10px] font-bold ${picked ? 'text-rose-700' : 'text-slate-600'}`}>{picked ? 'يُستبدل:' : 'يبقى:'}</span>
                                                            <span className={picked ? 'line-through text-rose-500 bg-rose-50 px-1 rounded' : 'text-slate-700 bg-slate-100 px-1 rounded'}>{s.kind === 'anchor' ? anchorText(s.local) : (s.local || '—')}</span>
                                                            <span className={`text-[10px] font-bold mr-1 ${picked ? 'text-emerald-700' : 'text-slate-400'}`}>{picked ? '— يُطبَّق:' : '— في الملف (لن يُطبَّق):'}</span>
                                                            <span className={picked ? 'text-emerald-700 bg-emerald-50 px-1 rounded' : 'text-slate-700 bg-slate-100 px-1 rounded'}>{s.kind === 'anchor' ? anchorText(s.incoming) : s.incoming}</span>
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="border-t pt-1.5 text-[11px] font-black text-indigo-900">
                                        المؤشَّر للتطبيق: {mergeAttendanceCount} من {mergeAttendance.items.length + mergeAttendance.holidays.length + mergeAttendance.settings.length}
                                        {mergeAttendancePending > 0 && <span className="text-amber-700 font-bold"> — {mergeAttendancePending} عليها تنبيه وغير مؤشَّرة، فلن تُطبَّق ما لم تؤشّرها</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* الخيار الأول: تطبيق ما اختاره المستخدم */}
                        {(() => {
                            // ملخّص بلا تفاعل: الزرّ الفعلي انتقل إلى الذيل الثابت أسفل النافذة، فلا يبقى الوصول
                            // إليه مرهوناً بالتمرير حتى آخر القائمة مهما طال عرض الفروقات
                            const nothingToDo = mergeSelectedCount === 0 && mergeAddCount === 0 && mergePeriodCount === 0 && mergeAttendanceCount === 0 && mergeDeleteCount === 0;
                            return (
                        <div className={`w-full text-right p-4 rounded-2xl border-2 flex gap-4 items-start ${
                                nothingToDo ? 'border-slate-100 opacity-50' : 'border-indigo-100 bg-indigo-50/10'
                            }`}>
                            <div className="text-2xl p-2.5 bg-indigo-50 rounded-xl">🔄</div>
                            <div>
                                <h4 className="font-bold text-indigo-900 text-sm">تطبيق ما اخترته (موصى به)</h4>
                                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                                    {nothingToDo
                                        ? 'لم تختر شيئاً بعد — أشِّر ما تريد نقله من الملف أعلاه.'
                                        : `يطبّق الحقول المؤشَّرة أعلاه وحدها${mergeAddCount > 0 ? ` ويضيف ${mergeAddCount} موظفاً` : ''}${mergePeriodCount > 0 ? ` ويطبّق ${mergePeriodCount} فترة مؤرخة` : ''}${mergeAttendanceCount > 0 ? ` ومن المواقف والعطل والإعدادات ${mergeAttendanceCount}` : ''}. كل حقل لم تؤشّره يبقى على قيمته الحالية بلا مساس. زرّ التطبيق أسفل النافذة.`}
                                </p>
                            </div>
                        </div>
                            );
                        })()}

                        {/* الخيار الثاني: الاستبدال الكامل */}
                        <button 
                            onClick={async () => {
                                if (!(await confirmCloudFreshness(incomingBundle))) return;
                                if (confirm('⚠️ تنبيه هام: هذا الإجراء سيقوم بحذف كل البيانات الحالية واستبدالها بالكامل ببيانات الملف المرفوع! هل أنت متأكد؟')) {
                                    handleFullOverwrite(incomingStaff);
                                }
                            }}
                            className="w-full text-right p-4 rounded-2xl border border-rose-100 hover:border-rose-500 hover:bg-rose-50/20 transition group flex gap-4 items-start"
                        >
                            <div className="text-2xl p-2.5 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition">⚠️</div>
                            <div>
                                <h4 className="font-bold text-rose-900 text-sm">استبدال كامل لقاعدة البيانات الحالية</h4>
                                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                                    يقوم بمسح قاعدة البيانات المحلية واستبدالها بالكامل بالبيانات المستوردة من الملف المرفوع. (تنبيه: ستفقد البيانات الحالية غير المحفوظة في الملف).
                                </p>
                            </div>
                        </button>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between gap-3 border-t border-slate-100 flex-shrink-0">
                        <Button variant="secondary" onClick={cancelMerge} className="flex-shrink-0">
                            إلغاء العملية
                        </Button>
                        {(() => {
                            const nothingToDo = mergeSelectedCount === 0 && mergeAddCount === 0 && mergePeriodCount === 0 && mergeAttendanceCount === 0 && mergeDeleteCount === 0;
                            return (
                        <Button
                            variant="primary"
                            disabled={nothingToDo}
                            onClick={() => handleSmartMerge(incomingStaff, mergeSelection, mergeAddSelection, mergePeriodSelection, mergeClearDaysSelection, mergeAttendanceSelection, mergeDeleteSelection)}
                            className="flex-shrink-0"
                        >
                            <span>🔄</span><span>تطبيق ما اخترته</span>
                        </Button>
                            );
                        })()}
                    </div>
                </div>
            </div>
        );
    })();
};
