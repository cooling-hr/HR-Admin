import React from 'react';
import { getArabicDayName, localDateStr } from '../../core/dates';

// قالب طباعة مصفوفة الأيام، يظهر أثناء الطباعة فقط. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. يظهر دائماً ويخفيه CSS خارج الطباعة.
export const DayMatrixPrint = ({ ctx }) => {
    const { DAY_MATRIX_LEGEND, getDayMatrixCell, periodEndDate, periodReportData, periodReportRows, periodStartDate, periodUnitFilter, periodWorkTypeFilter } = ctx;
    return <div className="matrix-print-only hidden bg-white text-black" style={{ direction: 'rtl' }}>
        <div style={{ textAlign: 'center', marginBottom: '4mm' }}>
            <div style={{ fontWeight: 900, fontSize: '13pt' }}>شركة نفط البصرة — هيأة الصيانة الهندسية — قسم التكييف والتبريد</div>
            <div style={{ fontWeight: 700, fontSize: '10pt' }}>شعبة تبريد المركز ومحطة عزل نهر بن عمر</div>
            <div style={{ fontWeight: 900, fontSize: '11pt', marginTop: '2mm' }}>
                موقف الحضور اليومي — {(() => {
                    const parts = [];
                    if (periodUnitFilter !== 'all') parts.push(periodUnitFilter);
                    if (periodWorkTypeFilter !== 'all') parts.push(periodWorkTypeFilter === 'صباحي' ? 'الملاك الصباحي' : 'الملاك المناوب');
                    return parts.length ? parts.join(' — ') : 'كامل الشعبة';
                })()}
            </div>
            <div style={{ fontSize: '9pt', fontWeight: 700 }}>
                للفترة من {periodStartDate} إلى {periodEndDate} — عدد المنتسبين: {periodReportData.employees.length}
            </div>
        </div>

        {/* مفتاح الرموز يُطبع مع الجدول: كشف بلا مفتاح غير مقروء لمن يستلمه */}
        <div style={{ marginBottom: '3mm', fontSize: '7pt', display: 'flex', flexWrap: 'wrap', gap: '2mm', justifyContent: 'center' }}>
            {DAY_MATRIX_LEGEND.map(l => (
                <span key={l.code} style={{ whiteSpace: 'nowrap' }}>
                    <strong style={{ border: '1px solid #64748b', padding: '0 3px', borderRadius: '2px' }}>{l.code}</strong>
                    <span style={{ marginRight: '1mm' }}>{l.label}</span>
                </span>
            ))}
        </div>

        <table style={{ fontSize: '7pt' }}>
            <thead>
                <tr style={{ background: '#e2e8f0' }}>
                    <th style={{ width: '7mm' }}>ت</th>
                    <th style={{ textAlign: 'right', minWidth: '45mm' }}>الاسم الكامل</th>
                    <th style={{ width: '14mm' }}>الرقم</th>
                    {periodReportData.datesList.map(d => (
                        <th key={d}>
                            <div style={{ fontWeight: 900 }}>{d.split('-')[2]}</div>
                            <div style={{ fontSize: '5.5pt' }}>{getArabicDayName(d).slice(0, 3)}</div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {periodReportRows.map((item, idx) => (
                    <tr key={item.employee.id || idx}>
                        <td>{idx + 1}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{item.employee.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.employee.jobNumber}</td>
                        {item.dailyLog.map(dayItem => {
                            const cell = getDayMatrixCell(dayItem.status, dayItem.isFuture);
                            return <td key={dayItem.dateStr} className={cell.cls} style={{ fontWeight: 900 }}>{cell.code}</td>;
                        })}
                    </tr>
                ))}
            </tbody>
        </table>

        <div style={{ marginTop: '6mm', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', fontWeight: 700 }}>
            <span>تاريخ الطباعة: {localDateStr()}</span>
            <span>مسؤول شعبة تبريد المركز ومحطة عزل نهر بن عمر</span>
        </div>
    </div>;
};
