import React from 'react';

// نافذة إدارة العطل الرسمية والأعياد. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const HolidaysModal = ({ ctx }) => {
    const { addOfficialHolidayRange, dailyReportDate, holidayRangeEnd, holidayRangeStart, officialHolidays, setHolidayRangeEnd, setHolidayRangeStart, setShowHolidaysModal, toggleOfficialHolidayDate } = ctx;
    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-fadeIn no-print">
            <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
                {/* رأس النافذة */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                            🎉
                        </div>
                        <div>
                            <h3 className="text-xl font-black">إدارة العطل الرسمية والأعياد</h3>
                            <p className="text-xs text-amber-100 font-bold">تحديد أيام العطل ليتم اعتبارهن عطلة رسمية لكافة المنتسبين</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowHolidaysModal(false)}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg transition cursor-pointer"
                        title="إغلاق النافذة"
                    >
                        ✕
                    </button>
                </div>

                {/* محتوى النافذة القابل للتمرير */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

                    {/* قسم 1: التحكم بتاريخ الموقف المحدد حالياً */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <span className="text-xs font-black text-slate-500 block">📅 تاريخ الموقف اليومي المحدد حالياً:</span>
                                <span className="text-lg font-black text-slate-800 dir-ltr inline-block">{dailyReportDate}</span>
                            </div>
                            <div>
                                {officialHolidays.includes(dailyReportDate) ? (
                                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-300 font-black text-xs flex items-center gap-1">
                                        🎉 محدد حالياً كـ عطلة رسمية
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 font-black text-xs flex items-center gap-1">
                                        💼 يوم عمل اعتيادي
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => toggleOfficialHolidayDate(dailyReportDate)}
                            className={`w-full py-2.5 px-4 rounded-xl font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                                officialHolidays.includes(dailyReportDate)
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                            }`}
                        >
                            {officialHolidays.includes(dailyReportDate) ? (
                                <><span>❌</span><span>إلغاء اعتبار تاريخ الموقف الحالي ({dailyReportDate}) كـ عطلة</span></>
                            ) : (
                                <><span>🎉</span><span>تثبيت تاريخ الموقف الحالي ({dailyReportDate}) كـ عطلة رسمية</span></>
                            )}
                        </button>
                    </div>

                    {/* قسم 2: إضافة عطلة أو عيد متعدد الأيام */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <span>🗓️</span>
                            <span>إضافة نطاق عطلة رسمية أو عيد (عدة أيام):</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">من تاريخ (تاريخ البداية):</label>
                                <input
                                    type="date"
                                    value={holidayRangeStart}
                                    onChange={e => setHolidayRangeStart(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">إلى تاريخ (تاريخ النهاية):</label>
                                <input
                                    type="date"
                                    value={holidayRangeEnd}
                                    onChange={e => setHolidayRangeEnd(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => addOfficialHolidayRange(holidayRangeStart, holidayRangeEnd)}
                            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                        >
                            <span>➕</span>
                            <span>إضافة نطاق التواريخ المحددة كـ عطل رسمية</span>
                        </button>
                    </div>

                    {/* قسم 3: سجل وقائمة العطل الرسمية المعرفة */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <span>📜</span>
                                <span>سجل العطل الرسمية والأعياد المعرفة بالنظام</span>
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-xs">
                                المجموع: {officialHolidays.length} يوم
                            </span>
                        </div>

                        {officialHolidays.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 font-bold text-xs space-y-1">
                                <p>لا توجد أي عطل رسمية معرفة بالنظام حالياً.</p>
                                <p>يمكنك استخدام الخيارات أعلاه لتحديد العطل الرسمية والأعياد.</p>
                            </div>
                        ) : (
                            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                                {[...officialHolidays].sort().map((hDate) => (
                                    <div
                                        key={hDate}
                                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition ${
                                            hDate === dailyReportDate
                                                ? 'bg-amber-50 border-amber-300 text-amber-950 ring-1 ring-amber-300'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">🎉</span>
                                            <span className="dir-ltr font-black">{hDate}</span>
                                            {hDate === dailyReportDate && (
                                                <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black">
                                                    التاريخ الحالي بالموقف
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleOfficialHolidayDate(hDate)}
                                            className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-black transition cursor-pointer text-[11px] flex items-center gap-1"
                                            title="حذف هذه العطلة"
                                        >
                                            <span>🗑️</span>
                                            <span>حذف</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* أسفل النافذة - أزرار الإجراءات */}
                <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={() => setShowHolidaysModal(false)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-sm"
                    >
                        إغلاق النافذة
                    </button>
                </div>
            </div>
        </div>
    );
};
