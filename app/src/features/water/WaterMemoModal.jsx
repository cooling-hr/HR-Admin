import React from 'react';
import { daysInMonth, getArabicMonthLabel } from '../../core/dates';

// مذكرة طلب الماء لمجموعة الدوام. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const WaterMemoModal = ({ ctx }) => {
    const { BOC_LOGO_DATA_URI, amountToArabicWords, getWaterGroupSummary, setWaterMemoGroup, waterMemoGroup, waterMonth } = ctx;
    return (() => {
        const sum = getWaterGroupSummary(waterMemoGroup, waterMonth);
        const groupLabel = waterMemoGroup === 'morning' ? 'صباحي' : waterMemoGroup === 'triple' ? 'مناوبة ثلاثية' : 'مناوبة ثنائية';
        const attachLabel = waterMemoGroup === 'morning' ? 'المنتسبين الصباحي' : waterMemoGroup === 'triple' ? 'المناوبين (ثلاثية)' : 'المناوبين (ثنائية)';
        const total = daysInMonth(waterMonth);
        const periodLabel = waterMonth + '-01 ولغاية ' + waterMonth + '-' + String(total).padStart(2, '0');
        return (
        <div className="preview-overlay">
            <div className="preview-container" style={{maxWidth: '850px', width: '100%'}}>
                <div className="preview-header no-print">
                    <div>
                        <h2 className="text-2xl font-bold">🖨️ مذكرة تجهيز مياه معدنية — {groupLabel}</h2>
                        <p className="text-sm mt-1 opacity-90">عايِن الأرقام ثم اطبع</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="bg-white text-cyan-700 px-4 py-2 rounded-lg font-bold hover:bg-cyan-50 transition">🖨️ طباعة</button>
                        <button onClick={() => setWaterMemoGroup(null)} className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg transition">✕ إغلاق</button>
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
                        <div>
                            <div>رمز التشكيل: BOC-ED-07-01</div>
                            <div>العدد: .....................</div>
                            <div>التاريخ: .....................</div>
                        </div>
                    </div>

                    <div className="text-center mt-4 mb-3">
                        <span className="font-black text-base underline">م/استمارة تجهيز مياه معدنية</span>
                    </div>

                    <p className="text-sm leading-relaxed mb-2">
                        يرجى التفضل بالموافقة على شراء قناني مياه R.O من الأسواق المحلية وذلك لعدم توفرها في مخازن الشركة وحسب التفاصيل في الجدول أدناه.
                    </p>
                    <p className="text-center font-bold text-sm mb-1">شعبة تبريد المركز ومحطة عزل نهر بن عمر</p>
                    <p className="text-center font-bold text-sm mb-3">لشهر: {getArabicMonthLabel(waterMonth)}</p>
                    <p className="text-xs font-bold mb-1">ملاحظة العدد الكلي</p>

                    <table className="w-full border-collapse border border-black text-[11px] text-center">
                        <thead>
                            <tr className="bg-slate-200 font-bold">
                                <th className="border border-black p-1">ت</th>
                                <th className="border border-black p-1">عدد المنتسبين</th>
                                <th className="border border-black p-1">طبيعة العمل</th>
                                <th className="border border-black p-1">عدد أيام الدوام الفعلي</th>
                                <th className="border border-black p-1">الفترة من - إلى</th>
                                <th className="border border-black p-1">عدد القناني</th>
                                <th className="border border-black p-1">عدد السيتات</th>
                                <th className="border border-black p-1">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-1">1</td>
                                <td className="border border-black p-1">{sum.headcount}</td>
                                <td className="border border-black p-1">{groupLabel}</td>
                                <td className="border border-black p-1">{sum.days}</td>
                                <td className="border border-black p-1">{periodLabel}</td>
                                <td className="border border-black p-1">{sum.bottles}</td>
                                <td className="border border-black p-1">{sum.sets}</td>
                                <td className="border border-black p-1">{sum.cost.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3">&nbsp;</td>
                                <td className="border border-black p-3">&nbsp;</td>
                                <td className="border border-black p-3">&nbsp;</td>
                                <td className="border border-black p-3">&nbsp;</td>
                                <td className="border border-black p-3">&nbsp;</td>
                                <td className="border border-black p-3">&nbsp;</td>
                                <td className="border border-black p-3">&nbsp;</td>
                                <td className="border border-black p-3">&nbsp;</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 font-bold bg-slate-100" colSpan={7}>{amountToArabicWords(sum.cost)}</td>
                                <td className="border border-black p-1 font-black bg-slate-200">المجموع</td>
                            </tr>
                        </tbody>
                    </table>

                    <p className="text-center mt-6 text-sm">مع التقدير.....</p>

                    <div className="mt-6 text-xs">
                        <div className="font-bold mb-1">المرفقات:</div>
                        <div>- جدول بأسماء {attachLabel}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-10 text-center text-xs font-bold">
                        <div>
                            <div className="border-t border-black pt-1 mt-8">مسؤول الشعبة</div>
                        </div>
                        <div>
                            <div className="border-t border-black pt-1 mt-8">مدير القسم</div>
                        </div>
                        <div>
                            <div className="border-t border-black pt-1 mt-8">مدير الهيأة</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        );
    })();
};
