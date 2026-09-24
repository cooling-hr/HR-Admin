import React from 'react';
import { getArabicDayName } from '../../core/dates';

// جدول الوجبات. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const SquadScheduleModal = ({ ctx }) => {
    const { BOC_LOGO_DATA_URI, getSquadsOnDuty, periodEndDate, periodReportData, periodStartDate, setShowSquadSchedule, squadRosters } = ctx;
    return (
        <div className="preview-overlay">
            <div className="preview-container" style={{maxWidth: '850px', width: '100%'}}>
                <div className="preview-header no-print">
                    <div>
                        <h2 className="text-2xl font-bold">🔄 توزيع وجبات المناوبين</h2>
                        <p className="text-sm mt-1 opacity-90">وفق دورة الوجبات المعتمدة — لا يتضمن الإجازات أو التبديلات الفردية</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="bg-white text-cyan-700 px-4 py-2 rounded-lg font-bold hover:bg-cyan-50 transition">🖨️ طباعة</button>
                        <button onClick={() => setShowSquadSchedule(false)} className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg transition">✕ إغلاق</button>
                    </div>
                </div>

                <div className="preview-body paper-sheet p-8 bg-white text-black font-sans" style={{maxHeight: '75vh', overflowY: 'auto'}} dir="rtl">
                    <div className="flex justify-between items-start text-[11px] mb-2">
                        <img src={BOC_LOGO_DATA_URI} alt="B.O.C" className="w-16 h-16 rounded-full object-cover border border-black" />
                        <div className="text-center">
                            <div className="font-bold">جمهورية العراق</div>
                            <div className="font-bold">وزارة النفط</div>
                            <div className="font-bold">شركة نفط البصرة (شركة عامة)</div>
                            <div className="font-bold text-sm">شعبة تبريد المركز ومحطة عزل نهر بن عمر</div>
                        </div>
                        <div className="w-16"></div>
                    </div>

                    <div className="text-center mt-4 mb-1">
                        <span className="font-black text-base underline">م/جدول توزيع وجبات المناوبين</span>
                    </div>
                    <p className="text-center font-bold text-sm mb-3">للفترة من {periodStartDate} إلى {periodEndDate}</p>

                    <table className="w-full border-collapse border border-black text-[11px] text-center">
                        <thead>
                            <tr className="bg-slate-200 font-bold">
                                <th className="border border-black p-1" rowSpan={2}>التاريخ</th>
                                <th className="border border-black p-1" rowSpan={2}>اليوم</th>
                                <th className="border border-black p-1">المناوبة الثلاثية</th>
                                <th className="border border-black p-1" colSpan={2}>المناوبة الثنائية</th>
                            </tr>
                            <tr className="bg-slate-100 font-bold">
                                <th className="border border-black p-1">مستلمة</th>
                                <th className="border border-black p-1">صباحي</th>
                                <th className="border border-black p-1">مسائي</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periodReportData.datesList.map(d => {
                                const s = getSquadsOnDuty(d);
                                return (
                                    <tr key={d} data-squad-date={d}>
                                        <td className="border border-black p-1 font-mono">{d}</td>
                                        <td className="border border-black p-1">{getArabicDayName(d)}</td>
                                        <td className="border border-black p-1 font-black">{s.triple ? 'الوجبة ' + s.triple : '—'}</td>
                                        <td className="border border-black p-1 font-black">{'الوجبة ' + s.morning}</td>
                                        <td className="border border-black p-1 font-black">{'الوجبة ' + s.evening}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="grid grid-cols-3 gap-4 mt-10 text-center text-xs font-bold">
                        <div></div>
                        <div></div>
                        <div>
                            <div className="border-t border-black pt-1 mt-8">مسؤول الشعبة</div>
                        </div>
                    </div>

                    <hr className="no-print my-6 border-dashed border-slate-300" />
                    <p className="no-print text-center text-[11px] text-gray-400 mb-2">— الصفحة الثانية عند الطباعة: كشف بأسماء أفراد كل وجبة —</p>

                    <div style={{pageBreakBefore: 'always'}}>
                        <div className="flex justify-between items-start text-[11px] mb-2">
                            <img src={BOC_LOGO_DATA_URI} alt="B.O.C" className="w-16 h-16 rounded-full object-cover border border-black" />
                            <div className="text-center">
                                <div className="font-bold">جمهورية العراق</div>
                                <div className="font-bold">وزارة النفط</div>
                                <div className="font-bold">شركة نفط البصرة (شركة عامة)</div>
                                <div className="font-bold text-sm">شعبة تبريد المركز ومحطة عزل نهر بن عمر</div>
                            </div>
                            <div className="w-16"></div>
                        </div>

                        <div className="text-center mt-4 mb-4">
                            <span className="font-black text-base underline">م/كشف بأسماء أفراد وجبات المناوبين</span>
                        </div>

                        {[
                            { label: 'المناوبة الثلاثية (نهر بن عمر)', data: squadRosters.triple, key: 't' },
                            { label: 'المناوبة الثنائية (بقية الوحدات)', data: squadRosters.double, key: 'd' }
                        ].map(group => (
                            <div key={group.key} className="mb-6">
                                <div className="font-black text-sm mb-2">{group.label}</div>
                                <div className="grid grid-cols-4 gap-2">
                                    {['A', 'B', 'C', 'D'].map(q => (
                                        <div key={q} className="border border-black rounded">
                                            <div className="bg-slate-200 font-black p-1 text-center border-b border-black text-[11px]">الوجبة {q}</div>
                                            <div className="p-1.5 text-[10px] leading-relaxed" data-squad-roster={group.key + q}>
                                                {group.key === 'd' ? (
                                                    group.data[q].length ? group.data[q].map((u, ui) => (
                                                        <div key={u.unit} className={ui > 0 ? 'mt-1.5' : ''}>
                                                            <div className="font-bold text-gray-600 border-b border-gray-400 mb-0.5">{u.unit}</div>
                                                            {u.employees.map(e => <div key={e.id} data-squad-name={group.key + q}>{e.name}</div>)}
                                                        </div>
                                                    )) : <div className="text-gray-400">—</div>
                                                ) : (
                                                    group.data[q].length ? group.data[q].map(e => <div key={e.id} data-squad-name={group.key + q}>{e.name}</div>) : <div className="text-gray-400">—</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-3 gap-4 mt-8 text-center text-xs font-bold">
                            <div></div>
                            <div></div>
                            <div>
                                <div className="border-t border-black pt-1 mt-8">مسؤول الشعبة</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
