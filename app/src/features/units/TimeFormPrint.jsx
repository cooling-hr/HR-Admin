import React from 'react';
import { timeFormTitle } from '../../domain/timeForm';
import { getArabicMonthLabel, getArabicDayName } from '../../core/dates';
import { getTripleName } from '../../core/arabic';

// قالب طباعة استمارة ضبط الوقت (الملاك أو العقود)، يظهر أثناء الطباعة فقط. الحالة والمنطق في StaffSystem؛
// هذا المكوّن يرسم فقط ويستلم ما يحتاجه عبر ctx صريح. يظهر دائماً ويخفيه CSS خارج الطباعة.
// ورق A4 أفقي بهامش 8 مم (العرض المتاح نحو 281 مم): الأعمدة الخمسة الثابتة نحو 85 مم، والأيام الـ31 تتقاسم الباقي.
// الاستمارة وثيقة رسمية فلا يُطبع عليها توقيع المُعدّ ولا مفتاح الرموز.
const OUT_BG = '#d9d9d9';
const shortDayName = (dateStr) => getArabicDayName(dateStr).replace(/^ال/, '').slice(0, 2);

export const TimeFormPrint = ({ ctx }) => {
    const { timeFormData, timeFormKind } = ctx;
    const isContracts = timeFormKind === 'contracts';
    const rows = isContracts ? timeFormData.contractRows : timeFormData.staffRows;
    const { ym, daysInMonth } = timeFormData;
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return <div className="timeform-print-only hidden bg-white text-black" style={{ direction: 'rtl' }}>
        <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
            <div style={{ fontWeight: 900, fontSize: '13pt' }}>{timeFormTitle(timeFormKind)}</div>
            <div style={{ fontWeight: 700, fontSize: '10pt' }}>{getArabicMonthLabel(ym)}</div>
        </div>

        <table style={{ fontSize: '7pt', tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
                <col style={{ width: '7mm' }} />
                <col style={{ width: '14mm' }} />
                <col style={{ width: '40mm' }} />
                <col style={{ width: '12mm' }} />
                {days.map(d => <col key={d} />)}
                <col style={{ width: '12mm' }} />
            </colgroup>
            <thead>
                <tr style={{ fontWeight: 900 }}>
                    <th>التسلسل</th>
                    <th>الرقم الوظيفي</th>
                    <th>الاسم الثلاثي</th>
                    <th>نوع الحركة</th>
                    {days.map(day => {
                        const out = day > daysInMonth;
                        const dateStr = `${ym}-${String(day).padStart(2, '0')}`;
                        return (
                            <th key={day} className={out ? 'tf-out' : undefined} style={out ? { background: OUT_BG } : undefined}>
                                <div>{day}</div>
                                {!out && <div style={{ fontSize: '6pt', fontWeight: 700, lineHeight: 1 }}>{shortDayName(dateStr)}</div>}
                            </th>
                        );
                    })}
                    <th>مجموع الساعات</th>
                </tr>
            </thead>
            {rows.map((row, idx) => (
                <tbody key={row.employee.id || idx}>
                    <tr>
                        <td rowSpan={2}>{idx + 1}</td>
                        <td rowSpan={2}>{row.employee.jobNumber}</td>
                        {/* الاسم الطويل يلتفّ على سطرين في الخانة المدمجة، ولا يُقصّ: ارتفاع الصفّين يتسع لهما */}
                        <td rowSpan={2} style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'normal', lineHeight: 1.15 }}>{getTripleName(row.employee.name)}</td>
                        <td rowSpan={2}></td>
                        {row.cells.map(cell => {
                            if (!cell.inMonth) return <td key={cell.day} className="tf-out" style={{ background: OUT_BG }}></td>;
                            if (cell.outOfPeriod) return <td key={cell.day}>–</td>;
                            if (cell.isFuture) return <td key={cell.day}></td>;
                            return <td key={cell.day} style={{ fontWeight: 900 }}>{cell.code}</td>;
                        })}
                        <td rowSpan={2} style={{ fontWeight: 900 }}>{row.totalHours || ''}</td>
                    </tr>
                    <tr>
                        {row.cells.map(cell => {
                            if (!cell.inMonth) return <td key={cell.day} className="tf-out" style={{ background: OUT_BG }}></td>;
                            return <td key={cell.day} className="tf-hours" style={{ background: '#ccffff' }}>{cell.hours ?? ''}</td>;
                        })}
                    </tr>
                </tbody>
            ))}
        </table>
        {rows.length === 0 && (
            <div style={{ textAlign: 'center', padding: '8mm', fontSize: '10pt', fontWeight: 700 }}>لا يوجد منتسبون ضمن الفلاتر المحددة</div>
        )}

        <div style={{ marginTop: '8mm', display: 'flex', justifyContent: 'space-between', fontSize: '9pt', fontWeight: 700, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div style={{ width: '60mm', textAlign: 'center' }}>
                <div>منظّم الاستمارة</div>
                <div style={{ height: '16mm', borderBottom: '1px solid #000' }}></div>
            </div>
            <div style={{ width: '60mm', textAlign: 'center' }}>
                <div>مسؤول الشعبة</div>
                <div style={{ height: '16mm', borderBottom: '1px solid #000' }}></div>
            </div>
        </div>
    </div>;
};
