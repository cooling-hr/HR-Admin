import React from 'react';
import { PageHeader } from '../../ui/PageHeader';
import { ARABIC_MONTH_NAMES, getArabicDayName, localDateStr } from '../../core/dates';
import { getTripleName } from '../../core/arabic';
import { ensureLibs } from '../../core/lazyLibs';
import { DUTY_MEAL_HEADERS, DUTY_MEAL_SECTION, DUTY_MEAL_SITES, DUTY_MEAL_SQUADS, buildDutyMealDay, dutyMealDayTitle, dutyMealSiteLabel, isTripleShiftSite, monthDates, siteSquadMembers } from '../../domain/dutyMeals';

// الشهر التالي افتراضياً: الجدول يُعدّ قبل بداية شهره
// الأحمر لما يحتاج تدخّلاً: لا مخول محدّد، أو لا حاضر من الوجبة. الاستبدال التلقائي يُذكر فقط
const isSeriousMealWarning = (w) => !!w && (w.startsWith('لم يُحدَّد') || w.startsWith('لا حاضر'));

const nextMonthStr = () => {
    const [y, m] = localDateStr().split('-').map(Number);
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
};

// شاشة «إطعام المناوبين» في الوحدات والموقف: إعداد المخولين لكل موقع ووجبة، ثم جدول الشهر مولَّداً
// من دورة المناوبة والموقف اليومي، وتصديره Excel بهيكل استمارة القسم أو طباعته. الحالة
// (mealAuthorizations) في StaffSystem وتُزامَن؛ هذا المكوّن يرسم ويستلم ما يحتاجه عبر ctx صريح.
export const DutyMealsScreen = ({ ctx }) => {
    const { getEmployeeDailyStatus, getSquadsOnDuty, mealAuthorizations, setMealAuthorizations, staff } = ctx;
    const [month, setMonth] = React.useState(nextMonthStr);
    const [showSetup, setShowSetup] = React.useState(() => Object.keys(mealAuthorizations || {}).length === 0);
    const [exporting, setExporting] = React.useState(false);

    const [y, m] = month.split('-').map(Number);
    const monthLabel = y && m ? `${ARABIC_MONTH_NAMES[m - 1]} ${y}` : '';
    const days = React.useMemo(() => monthDates(month).map(dateStr => ({
        dateStr,
        title: dutyMealDayTitle(dateStr, getArabicDayName(dateStr)),
        sites: buildDutyMealDay({ staff, dateStr, authorizations: mealAuthorizations || {}, getEmployeeDailyStatus, getSquadsOnDuty })
    })), [month, staff, mealAuthorizations, getEmployeeDailyStatus, getSquadsOnDuty]);
    const warningDays = days.filter(d => d.sites.some(s => s.rows.some(r => isSeriousMealWarning(r.warning)))).length;

    // تحديث دالّي: اختياران متتاليان قبل إعادة الرسم (أو مع مزامنة واصلة) لا يمحو أحدهما الآخر
    const setPick = (unit, squad, field, id) => setMealAuthorizations(prev => {
        const all = prev || {};
        const cur = (all[unit] && all[unit][squad]) || {};
        const next = { ...cur, [field]: id || undefined };
        // الشخص نفسه لا يكون مخولاً وبديلاً معاً
        if (id && field === 'main' && next.alt === id) next.alt = undefined;
        if (id && field === 'alt' && next.main === id) next.main = undefined;
        return { ...all, [unit]: { ...(all[unit] || {}), [squad]: next } };
    });

    const exportExcel = async () => {
        if (!(await ensureLibs('exceljs'))) return;
        setExporting(true);
        try {
            const ExcelJS = window.ExcelJS;
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('اطعام المناوبين', {
                views: [{ rightToLeft: true }],
                pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true,
                    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } }
            });
            // عروض أعمدة الاستمارة الأصلية
            [9, 33.42, 17.67, 18.42, 17.42, 31.25, 24.42, 31, 24, 37.75].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
            const thin = { style: 'thin', color: { argb: 'FF000000' } };
            const border = { top: thin, left: thin, bottom: thin, right: thin };
            const font = { name: 'Arial', size: 14, bold: true };
            const align = { horizontal: 'center', vertical: 'middle', wrapText: true };
            const styleRow = (r, fill) => {
                const row = ws.getRow(r);
                row.height = 36;
                for (let c = 1; c <= 10; c++) {
                    const cell = row.getCell(c);
                    cell.font = font; cell.alignment = align; cell.border = border;
                    if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
                }
            };
            const name = (p) => (p ? getTripleName(p.name) : '');
            let r = 1;
            days.forEach((day, di) => {
                ws.mergeCells(r, 1, r, 10);
                ws.getCell(r, 1).value = day.title;
                ws.getRow(r).height = 36;
                ws.getCell(r, 1).font = font; ws.getCell(r, 1).alignment = align;
                r++;
                DUTY_MEAL_HEADERS.forEach((h, i) => { ws.getCell(r, i + 1).value = h; });
                styleRow(r, true);
                r++;
                const firstSiteRow = r;
                day.sites.forEach((site, si) => {
                    styleRow(r); styleRow(r + 1);
                    ws.mergeCells(r, 1, r + 1, 1); ws.getCell(r, 1).value = si + 1;
                    ws.mergeCells(r, 2, r + 1, 2); ws.getCell(r, 2).value = site.label;
                    ws.mergeCells(r, 3, r + 1, 3); ws.getCell(r, 3).value = site.total;
                    if (site.triple) {
                        // وجبة واحدة 24 ساعة: العدد والمخول يشغلان الصفّين
                        const row = site.rows[0];
                        ws.mergeCells(r, 4, r + 1, 5); ws.getCell(r, 4).value = row.count;
                        [[6, name(row.main)], [7, row.main ? row.main.mobile : ''], [8, name(row.alt)], [9, row.alt ? row.alt.mobile : '']].forEach(([c, v]) => {
                            ws.mergeCells(r, c, r + 1, c); ws.getCell(r, c).value = v;
                        });
                    } else {
                        site.rows.forEach((row, k) => {
                            ws.getCell(r + k, k === 0 ? 4 : 5).value = row.count;
                            ws.getCell(r + k, 6).value = name(row.main);
                            ws.getCell(r + k, 7).value = row.main ? row.main.mobile : '';
                            ws.getCell(r + k, 8).value = name(row.alt);
                            ws.getCell(r + k, 9).value = row.alt ? row.alt.mobile : '';
                        });
                    }
                    r += 2;
                });
                ws.mergeCells(firstSiteRow, 10, r - 1, 10); ws.getCell(firstSiteRow, 10).value = DUTY_MEAL_SECTION;
                // يومان في كل صفحة أفقية
                if (di % 2 === 1 && di < days.length - 1) ws.getRow(r - 1).addPageBreak();
                r++;
            });
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `جدول اطعام المناوبين لشهر ${monthLabel} - قسم التكييف والتبريد.xlsx`;
            a.click();
            setTimeout(() => window.URL.revokeObjectURL(url), 1500);
        } catch (e) {
            alert('خطأ في التصدير: ' + e.message);
        } finally {
            setExporting(false);
        }
    };

    // طباعة أفقية بعزل القالب أدناه (body.printing-meals في CSS القالب)، بنمط طباعة مصفوفة الأيام
    const printDutyMeals = () => {
        const styleEl = document.createElement('style');
        styleEl.id = 'mealsLandscapeStyle';
        styleEl.textContent = '@media print { @page { size: A4 landscape; margin: 6mm; } }';
        document.head.appendChild(styleEl);
        document.body.classList.add('printing-meals');
        const cleanup = () => {
            document.body.classList.remove('printing-meals');
            const el = document.getElementById('mealsLandscapeStyle');
            if (el) el.remove();
        };
        window.addEventListener('afterprint', cleanup, { once: true });
        setTimeout(() => window.print(), 250);
    };

    const cell = 'border border-slate-300 px-2 py-1.5 text-center';
    return (
        <div className="space-y-5 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <PageHeader icon={<span className="text-xl">🍽️</span>} title="جدول إطعام المناوبين"
                    description={`لشهر ${monthLabel} — يُولَّد من دورة المناوبة والموقف اليومي، ويُطرح من العدد المجاز والغائب`}
                    actions={<>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            📅 الشهر
                            <input type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)}
                                className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-bold bg-white" />
                        </label>
                        <button onClick={exportExcel} disabled={exporting}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition cursor-pointer disabled:opacity-50">
                            {exporting ? '⏳ جارٍ التصدير...' : '📥 تصدير Excel'}
                        </button>
                        <button onClick={() => printDutyMeals()}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition cursor-pointer">
                            🖨️ طباعة
                        </button>
                    </>} />

                {/* إعداد المخولين: مرة واحدة ويبقى ثابتاً لكل الأشهر */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button onClick={() => setShowSetup(v => !v)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-200 text-right cursor-pointer">
                        <span className="font-black text-slate-800 text-sm">👤 المخولون والبدلاء لكل موقع ووجبة</span>
                        <span className="text-xs font-bold text-slate-500">{showSetup ? '▲ إخفاء' : '▼ عرض وتعديل'}</span>
                    </button>
                    {showSetup && (
                        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {DUTY_MEAL_SITES.map(unit => (
                                <div key={unit} className="border border-slate-200 rounded-xl p-3">
                                    <div className="font-black text-slate-800 mb-2">📍 {dutyMealSiteLabel(unit)}
                                        <span className="text-[11px] font-bold text-slate-500 mr-2">{isTripleShiftSite(unit) ? 'وجبة واحدة 24 ساعة' : 'صباحية ومسائية'}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {DUTY_MEAL_SQUADS.map(squad => {
                                            const members = siteSquadMembers(staff, unit, squad);
                                            const pick = (mealAuthorizations && mealAuthorizations[unit] && mealAuthorizations[unit][squad]) || {};
                                            return (
                                                <div key={squad} className="grid grid-cols-[2.5rem_1fr_1fr] gap-2 items-center">
                                                    <span className="text-center font-black text-slate-700 bg-slate-100 rounded-lg py-1.5 text-sm">{squad}</span>
                                                    {['main', 'alt'].map(field => (
                                                        <select key={field} value={pick[field] || ''} disabled={members.length === 0}
                                                            onChange={e => setPick(unit, squad, field, e.target.value)}
                                                            className="w-full min-w-0 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold bg-white disabled:opacity-50">
                                                            <option value="">{members.length === 0 ? 'لا مناوبين' : field === 'main' ? '— المخول —' : '— البديل —'}</option>
                                                            {members.map(emp => <option key={emp.id} value={emp.id}>{getTripleName(emp.name)}</option>)}
                                                        </select>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {warningDays > 0 && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-black text-rose-800">
                        ⚠️ {warningDays} يوماً فيها وجبة بلا مخول محدَّد أو بلا حاضر — مؤشَّرة بالأحمر أدناه.
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {days.map(day => (
                    <div key={day.dateStr} className="bg-white rounded-xl shadow overflow-x-auto">
                        <table className="w-full text-xs md:text-sm font-bold text-slate-800 border-collapse min-w-[48rem]">
                            <thead>
                                <tr><th colSpan={10} className={`${cell} font-black text-sm md:text-base`}>{day.title}</th></tr>
                                <tr className="bg-amber-100">{DUTY_MEAL_HEADERS.map((h, i) => <th key={i} className={`${cell} font-black`}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {day.sites.map((site, si) => {
                                    const rows = site.triple ? [site.rows[0]] : site.rows;
                                    return rows.map((row, k) => (
                                        <tr key={`${site.unit}-${k}`} className={isSeriousMealWarning(row.warning) ? 'bg-rose-50' : ''}>
                                            {k === 0 && <>
                                                <td rowSpan={rows.length} className={cell}>{si + 1}</td>
                                                <td rowSpan={rows.length} className={cell}>{site.label}</td>
                                                <td rowSpan={rows.length} className={cell}>{site.total}</td>
                                            </>}
                                            {site.triple
                                                ? <td colSpan={2} className={cell}>{row.count} <span className="text-[10px] text-slate-500">(وجبة {row.squad || '—'} · 24 ساعة)</span></td>
                                                : <>
                                                    <td className={cell}>{k === 0 ? <>{row.count} <span className="text-[10px] text-slate-500">({row.squad})</span></> : ''}</td>
                                                    <td className={cell}>{k === 1 ? <>{row.count} <span className="text-[10px] text-slate-500">({row.squad})</span></> : ''}</td>
                                                </>}
                                            <td className={cell}>
                                                {row.main ? getTripleName(row.main.name) : ''}
                                                {row.warning && <div className={`text-[10px] font-black ${isSeriousMealWarning(row.warning) ? 'text-rose-700' : 'text-amber-700'}`}>{row.warning}</div>}
                                            </td>
                                            <td className={`${cell} font-mono`} dir="ltr">{row.main ? row.main.mobile : ''}</td>
                                            <td className={cell}>{row.alt ? getTripleName(row.alt.name) : ''}</td>
                                            <td className={`${cell} font-mono`} dir="ltr">{row.alt ? row.alt.mobile : ''}</td>
                                            {si === 0 && k === 0 && <td rowSpan={day.sites.reduce((n, s) => n + (s.triple ? 1 : 2), 0)} className={cell}>{DUTY_MEAL_SECTION}</td>}
                                        </tr>
                                    ));
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* قالب الطباعة: يظهر أثناء الطباعة فقط (body.printing-meals)، بلا حرف الوجبة ولا التنبيهات */}
            <div className="meals-print-only hidden bg-white text-black" style={{ direction: 'rtl' }}>
                {days.map((day, di) => (
                    <table key={day.dateStr} className="meals-print-day" style={{ pageBreakAfter: di % 2 === 1 ? 'always' : 'auto' }}>
                        <thead>
                            <tr><th colSpan={10} className="meals-print-title">{day.title}</th></tr>
                            <tr className="meals-print-head">{DUTY_MEAL_HEADERS.map((h, i) => <th key={i}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {day.sites.map((site, si) => [0, 1].map(k => {
                                const row = site.triple ? site.rows[0] : site.rows[k];
                                return (
                                    <tr key={`${site.unit}-${k}`}>
                                        {k === 0 && <>
                                            <td rowSpan={2}>{si + 1}</td>
                                            <td rowSpan={2}>{site.label}</td>
                                            <td rowSpan={2}>{site.total}</td>
                                        </>}
                                        {site.triple
                                            ? (k === 0 && <>
                                                <td rowSpan={2} colSpan={2}>{row.count}</td>
                                                <td rowSpan={2}>{row.main ? getTripleName(row.main.name) : ''}</td>
                                                <td rowSpan={2} dir="ltr">{row.main ? row.main.mobile : ''}</td>
                                                <td rowSpan={2}>{row.alt ? getTripleName(row.alt.name) : ''}</td>
                                                <td rowSpan={2} dir="ltr">{row.alt ? row.alt.mobile : ''}</td>
                                            </>)
                                            : <>
                                                <td>{k === 0 ? row.count : ''}</td>
                                                <td>{k === 1 ? row.count : ''}</td>
                                                <td>{row.main ? getTripleName(row.main.name) : ''}</td>
                                                <td dir="ltr">{row.main ? row.main.mobile : ''}</td>
                                                <td>{row.alt ? getTripleName(row.alt.name) : ''}</td>
                                                <td dir="ltr">{row.alt ? row.alt.mobile : ''}</td>
                                            </>}
                                        {si === 0 && k === 0 && <td rowSpan={day.sites.length * 2}>{DUTY_MEAL_SECTION}</td>}
                                    </tr>
                                );
                            }))}
                        </tbody>
                    </table>
                ))}
            </div>
        </div>
    );
};
