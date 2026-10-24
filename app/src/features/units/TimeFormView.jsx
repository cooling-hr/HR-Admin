import React from 'react';
import { OFFICIAL_TIME_CODES, UNKNOWN_CODE, timeFormTitle } from '../../domain/timeForm';
import { dailyStatusCategory } from '../../domain/dailyCounts';
import { getArabicMonthLabel, getArabicDayName } from '../../core/dates';
import { getTripleName } from '../../core/arabic';

// لون خانة الرمز حسب فئة الموقف اليومي نفسها (dailyStatusCategory)، بأصناف كاملة لا تُركَّب
const CODE_CLASS_BY_CATEGORY = {
    present: 'bg-emerald-100 text-emerald-800', leave: 'bg-rose-100 text-rose-800', course: 'bg-indigo-100 text-indigo-800',
    mission: 'bg-purple-100 text-purple-800', detached: 'bg-teal-100 text-teal-800', rest: 'bg-slate-100 text-slate-500',
    excused: 'bg-sky-100 text-sky-800', absent: 'bg-red-100 text-red-800', suspended: 'bg-red-200 text-red-800', other: 'bg-slate-100 text-slate-700'
};
const UNKNOWN_CLASS = 'bg-red-200 text-red-800 ring-2 ring-red-500';
const CELL = 'border border-slate-300 text-center';
// حدّ أسفل صفّي كل موظف، فلا تُنسب ساعات موظف إلى رموز الذي يليه عند التمرير
const ROW_END = 'border-b-2 border-b-slate-500';
// اسم اليوم بلا «ال» وبحرفين: الأحد والأربعاء كانا يظهران معاً «الأ»
const shortDayName = (dateStr) => getArabicDayName(dateStr).replace(/^ال/, '').slice(0, 2);

// استمارة ضبط الوقت على الشاشة: صفّان لكل موظف (الرموز ثم الساعات الإضافية)، استمارة الملاك أو العقود
export const TimeFormView = ({ ctx }) => {
    const { timeFormData, timeFormKind, setTimeFormKind, selectTimeFormMonth } = ctx;
    const isContracts = timeFormKind === 'contracts';
    const rows = isContracts ? timeFormData.contractRows : timeFormData.staffRows;
    const unknown = (isContracts ? timeFormData.warnings.contracts : timeFormData.warnings.staff).unknown;
    const unknownTotal = unknown.reduce((sum, u) => sum + u.days.length, 0);
    const { ym, daysInMonth } = timeFormData;
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 no-print">
                <div className="flex bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                    <button
                        onClick={() => setTimeFormKind('staff')}
                        className={`px-3 py-1.5 text-[11px] font-black transition cursor-pointer ${!isContracts ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        👥 الملاك ({timeFormData.staffRows.length})
                    </button>
                    <button
                        onClick={() => setTimeFormKind('contracts')}
                        className={`px-3 py-1.5 text-[11px] font-black transition cursor-pointer ${isContracts ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        📄 العقود ({timeFormData.contractRows.length})
                    </button>
                </div>
                <input
                    type="month"
                    value={ym}
                    onChange={e => { if (e.target.value) selectTimeFormMonth(e.target.value); }}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                />
            </div>

            {!timeFormData.coversMonth && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2 text-xs font-bold flex flex-wrap items-center gap-3 no-print">
                    <span>الفترة المختارة لا تغطي الشهر كاملاً، فالأيام خارجها معلَّمة بـ«–».</span>
                    <button
                        onClick={() => selectTimeFormMonth(ym)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-black cursor-pointer"
                    >
                        📅 الشهر كاملاً
                    </button>
                </div>
            )}

            {unknown.length > 0 && (
                <div className="bg-red-100 text-red-800 border border-red-200 rounded-xl px-4 py-2 text-xs font-bold no-print">
                    ⚠️ {unknownTotal} خانة بلا رمز ({UNKNOWN_CODE})، صحّح موقفها قبل الطباعة:{' '}
                    {unknown.map((u, i) => (
                        <span key={i} className="inline-block ml-3">{getTripleName(u.name)} (الأيام {u.days.join('، ')})</span>
                    ))}
                </div>
            )}

            <div className="text-center">
                <div className="font-black text-slate-800 text-base">{timeFormTitle(timeFormKind)}</div>
                <div className="font-bold text-slate-600 text-sm">{getArabicMonthLabel(ym)}</div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-100 text-slate-800 font-black">
                            <th className={`${CELL} px-2 py-1`}>التسلسل</th>
                            <th className={`${CELL} px-2 py-1`}>الرقم الوظيفي</th>
                            <th className={`${CELL} px-2 py-1 min-w-[150px] sticky right-0 z-10 bg-slate-100`}>الاسم الثلاثي</th>
                            <th className={`${CELL} px-2 py-1`}>نوع الحركة</th>
                            {days.map(day => {
                                const out = day > daysInMonth;
                                const dateStr = `${ym}-${String(day).padStart(2, '0')}`;
                                return (
                                    <th key={day} className={`${CELL} px-1 py-1 min-w-[28px] ${out ? 'bg-slate-200' : ''}`}>
                                        <div className="font-mono">{day}</div>
                                        {!out && <div className="text-[9px] font-bold text-slate-500">{shortDayName(dateStr)}</div>}
                                    </th>
                                );
                            })}
                            <th className={`${CELL} px-2 py-1`}>مجموع الساعات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <React.Fragment key={row.employee.id || idx}>
                                <tr>
                                    <td rowSpan={2} className={`${CELL} ${ROW_END} px-2 font-mono`}>{idx + 1}</td>
                                    <td rowSpan={2} className={`${CELL} ${ROW_END} px-2 font-mono`}>{row.employee.jobNumber}</td>
                                    <td rowSpan={2} className={`${CELL} ${ROW_END} px-2 text-right font-bold whitespace-nowrap sticky right-0 z-10 bg-white`}>{getTripleName(row.employee.name)}</td>
                                    <td rowSpan={2} className={`${CELL} ${ROW_END} px-2`}></td>
                                    {row.cells.map(cell => {
                                        if (!cell.inMonth) return <td key={cell.day} className={`${CELL} bg-slate-200`}></td>;
                                        if (cell.outOfPeriod) return <td key={cell.day} title="خارج الفترة المختارة" className={`${CELL} bg-slate-100 text-slate-400`}>–</td>;
                                        if (cell.isFuture) return <td key={cell.day} title="يوم قادم" className={`${CELL} text-slate-400 font-black`}>·</td>;
                                        if (cell.code === '') return <td key={cell.day} title={cell.status} className={CELL}></td>;
                                        const cls = cell.code === UNKNOWN_CODE ? UNKNOWN_CLASS : CODE_CLASS_BY_CATEGORY[dailyStatusCategory(cell.status)];
                                        return (
                                            <td key={cell.day} title={cell.status} className={`${CELL} px-0.5 py-0.5`}>
                                                <span className={`inline-flex items-center justify-center w-6 h-5 rounded font-black text-[10px] ${cls}`}>{cell.code}</span>
                                            </td>
                                        );
                                    })}
                                    <td rowSpan={2} className={`${CELL} ${ROW_END} px-2 font-mono font-black`}>{row.totalHours || ''}</td>
                                </tr>
                                <tr>
                                    {row.cells.map(cell => {
                                        if (!cell.inMonth) return <td key={cell.day} className={`${CELL} ${ROW_END} bg-slate-200`}></td>;
                                        // اليوم خارج الفترة رمادي في الصفّين، لا سماوي كيوم محسوب
                                        if (cell.outOfPeriod) return <td key={cell.day} className={`${CELL} ${ROW_END} bg-slate-100`}></td>;
                                        return <td key={cell.day} className={`${CELL} ${ROW_END} font-mono text-[10px]`} style={{ backgroundColor: '#ccffff', color: '#0f172a' }}>{cell.hours ?? ''}</td>;
                                    })}
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {rows.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-bold text-sm">لا يوجد منتسبون ضمن الفلاتر المحددة</div>
            )}

            <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center no-print">
                <span className="text-[11px] font-black text-slate-500">مفتاح الرموز:</span>
                {OFFICIAL_TIME_CODES.map(c => (
                    <span key={c.id} className="flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-6 h-5 rounded font-black text-[10px] bg-slate-100 text-slate-700">{c.letter}</span>
                        <span className="text-[10px] font-bold text-slate-500">{c.meaning}</span>
                    </span>
                ))}
            </div>
        </div>
    );
};
