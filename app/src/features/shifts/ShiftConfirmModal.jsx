import React from 'react';

// نافذة تأكيد إعادة ضبط وتثبيت الوجبة. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const ShiftConfirmModal = ({ ctx }) => {
    const { dailyReportDate, dailyStatusOverrides, dataEntryOperator, hourlyLeaveRecords, hourlyLeaveTimings, officialHolidays, overtimeHoursRecords, overtimeIds, pendingDeletionRequest, pendingShiftConfirm, pushDataToCloud, safeStorage, setAnchorDate, setPendingShiftConfirm, setThreeShiftAnchorSquad, setTwoShiftAnchorSquad, showCustomAlert, staff, systemUsers, threeShiftAnchorSquad, twoShiftAnchorSquad } = ctx;
    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fadeIn no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-5 text-white flex items-center gap-3 flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30">
                        ⚠️
                    </div>
                    <div>
                        <h3 className="font-black text-lg md:text-xl">تأكيد إعادة ضبط تدوير الوجبات</h3>
                        <p className="text-xs opacity-90 font-bold mt-0.5">إعادة معايرة الوجبة المعتمدة للنظام</p>
                    </div>
                </div>

                <div className="p-6 space-y-4 text-right overflow-y-auto min-h-0 flex-1">
                    <div className="bg-amber-50 border-2 border-amber-200/80 p-4 rounded-2xl space-y-2 text-amber-900">
                        <p className="text-xs md:text-sm font-black leading-relaxed">
                            تنبيه هـام: تغيير وتحديد <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-lg font-black font-mono">الوجبة {pendingShiftConfirm.squad}</span> كوجبة مستلمة بتاريخ <span className="underline font-black dir-ltr inline-block">{pendingShiftConfirm.date}</span> سيؤدي إلى إعادة حساب وتحديث جدول الوجبات لجميع الأيام القادمة والسابقة بناءً على هذا التعديل.
                        </p>
                    </div>

                    <p className="text-xs md:text-sm font-extrabold text-slate-700 leading-relaxed">
                        هل أنت متأكد من تثبيت هذا التغيير واعتماد الوجبة الجديدة كمرجع أساسي للنظام؟
                    </p>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={() => {
                            const targetDate = pendingShiftConfirm.date || dailyReportDate;
                            setAnchorDate(targetDate);
                            safeStorage.setItem('shiftAnchorDate', targetDate);

                            let newThreeSquad = threeShiftAnchorSquad;
                            let newTwoSquad = twoShiftAnchorSquad;

                            if (pendingShiftConfirm.type === '24h') {
                                newThreeSquad = pendingShiftConfirm.squad;
                                setThreeShiftAnchorSquad(newThreeSquad);
                                safeStorage.setItem('threeShiftAnchorSquad', newThreeSquad);
                            } else if (pendingShiftConfirm.type === '12h') {
                                newTwoSquad = pendingShiftConfirm.squad;
                                setTwoShiftAnchorSquad(newTwoSquad);
                                safeStorage.setItem('twoShiftAnchorSquad', newTwoSquad);
                            }

                            // المزامنة السحابية الفورية لضمان عدم عودة الوجبة السابقة
                            pushDataToCloud({
                                staffData: staff,
                                systemUsersList: systemUsers,
                                officialHolidaysList: officialHolidays,
                                hourlyLeaveRecords: hourlyLeaveRecords,
                                hourlyLeaveTimings: hourlyLeaveTimings,
                                overtimeHoursRecords: overtimeHoursRecords,
                                dailyStatusOverrides: dailyStatusOverrides,
                                shiftAnchorDate: targetDate,
                                threeShiftAnchorSquad: newThreeSquad,
                                twoShiftAnchorSquad: newTwoSquad,
                                dataEntryOperator: dataEntryOperator,
                                overtimeSelectedIds: overtimeIds,
                                lastCloudUpdate: new Date().toISOString(),
                                pendingDeletionRequest: pendingDeletionRequest
                            });

                            setPendingShiftConfirm(null);
                            showCustomAlert(`✅ تم تغيير وتثبيت الوجبة (${pendingShiftConfirm.squad}) بنجاح كمرجع أساسي للنظام وتعميمها سحابياً.`, 'success');
                        }}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-xs md:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>✅</span>
                        <span>نعم، اعتماد الوجبة وتأكيد التغيير</span>
                    </button>
                    <button
                        onClick={() => setPendingShiftConfirm(null)}
                        className="py-3 px-5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-black text-xs md:text-sm transition active:scale-95 cursor-pointer"
                    >
                        التراجع (إلغاء)
                    </button>
                </div>
            </div>
        </div>
    );
};
