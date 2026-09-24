import React from 'react';

// مركز الاستعادة والأرشيف الزمني السحابي. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const RestoreCenterModal = ({ ctx }) => {
    const { availableSnapshots, currentUserRole, fetchAvailableSnapshots, handleDownloadSnapshot, handleRestoreSnapshot, isLoadingSnapshots, selectedSnapshotPreview, setSelectedSnapshotPreview, setShowRestoreCenterModal, snapshotsError } = ctx;
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-fadeInUp my-auto">
                {/* ترويسة النافذة */}
                <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-5 text-white flex justify-between items-center border-b border-teal-900/50">
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-2xl text-2xl">🛡️</span>
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                                <span>مركز الاستعادة والأرشيف الزمني (Time-Machine Recovery)</span>
                                <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">{currentUserRole === 'admin' ? 'خاص بالمدير 👑' : 'اطلاع وتنزيل 🛡️'}</span>
                            </h3>
                            <p className="text-xs text-slate-300 mt-0.5">أرشيف سحابي ومحلي تلقائي غير قابل للإلغاء لحفظ واسترجاع لقطات الأيام السابقة بضغطة زر</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedSnapshotPreview(null);
                            setShowRestoreCenterModal(false);
                        }}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 md:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    {/* بطاقة التوجيه والشرح */}
                    <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                            <h4 className="text-xs md:text-sm font-black text-teal-950 flex items-center gap-1.5">
                                <span>💡 كيف يعمل نظام الأرشفة التلقائية؟</span>
                            </h4>
                            <p className="text-xs text-teal-800 leading-relaxed">
                                يقوم النظام تلقائياً عند كل تعديل بحفظ <strong>لقطة كاملة مستقلة (Snapshot)</strong> لكل يوم في مجلد الأرشيف السحابي والمحلي. يمكنك معاينة أي يوم، تنزيل ملفه الاحتياطي، أو استعادته فورياً ليصبح هو القاعدة الحية.
                            </p>
                        </div>
                        <button
                            onClick={fetchAvailableSnapshots}
                            disabled={isLoadingSnapshots}
                            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                        >
                            <span>{isLoadingSnapshots ? '⏳' : '🔄'}</span>
                            <span>تحديث قائمة الأرشيف</span>
                        </button>
                    </div>

                    {/* معاينة تفاصيل لقطة محددة */}
                    {selectedSnapshotPreview && (
                        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-teal-500/30 shadow-lg space-y-3 animate-fadeIn">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📅</span>
                                    <span className="text-sm font-black text-teal-300">تفاصيل لقطة أرشيف يوم [{selectedSnapshotPreview.date}]</span>
                                </div>
                                <button
                                    onClick={() => setSelectedSnapshotPreview(null)}
                                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                                >
                                    إغلاق المعاينة
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-[10px]">👥 عدد الموظفين بالملاك:</div>
                                    <div className="font-bold text-sm text-teal-400 mt-0.5">{selectedSnapshotPreview.staffCount} موظف</div>
                                </div>
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-[10px]">📅 أيام المواقف المسجلة:</div>
                                    <div className="font-bold text-sm text-amber-400 mt-0.5">{selectedSnapshotPreview.overridesCount} أيام</div>
                                </div>
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-[10px]">👤 القائم بآخر حفظ:</div>
                                    <div className="font-bold text-xs text-white mt-0.5 truncate">{selectedSnapshotPreview.savedBy}</div>
                                </div>
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                                    <div className="text-slate-400 text-[10px]">⏰ وقت الختم الزمني:</div>
                                    <div className="font-bold text-[10px] text-slate-300 mt-0.5 truncate">{new Date(selectedSnapshotPreview.timestamp).toLocaleTimeString('ar-IQ')}</div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    onClick={() => handleDownloadSnapshot(selectedSnapshotPreview)}
                                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-600"
                                >
                                    <span>📥 تنزيل ملف النسخة (JSON)</span>
                                </button>
                                {currentUserRole === 'admin' && (
                                    <button
                                        onClick={() => handleRestoreSnapshot(selectedSnapshotPreview)}
                                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                                    >
                                        <span>⏪ اعتماد واستعادة هذه النسخة كقاعدة حية</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                        {currentUserRole !== 'admin' && (
                            <div className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900">
                                🛡️ يمكنك استعراض اللقطات وتنزيلها. اعتماد لقطة كقاعدة حية يبدّل بيانات الشعبة كلها ويبقى بيد مدير النظام.
                            </div>
                        )}
                    {/* قائمة اللقطات المتاحة */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs md:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <span>📋 قائمة اللقطات والنسخ المؤرشفة:</span>
                                <span className="text-[11px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">{availableSnapshots.length} نسخة محفوظة</span>
                            </span>
                        </div>

                        {snapshotsError && (
                            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-900">
                                ⚠️ {snapshotsError}
                            </div>
                        )}

                        {isLoadingSnapshots ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="text-3xl animate-spin mb-2">⏳</div>
                                <div className="text-xs font-bold text-slate-600">جارٍ قراءة الأرشيف السحابي والمحلي...</div>
                            </div>
                        ) : availableSnapshots.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                                <div className="text-4xl">📭</div>
                                <div className="text-sm font-bold">لا توجد لقطات مؤرشفة حالياً</div>
                                <p className="text-xs text-slate-400">سيقوم النظام بإنشاء أول لقطة تلقائياً فور إجراء وحفظ أي تعديل جديد على الموقف أو الملاك.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                                                <th className="p-3 font-black text-center w-10">ت</th>
                                                <th className="p-3 font-black">تاريخ اللقطة</th>
                                                <th className="p-3 font-black text-center">وقت الحفظ</th>
                                                <th className="p-3 font-black text-center">الملاك</th>
                                                <th className="p-3 font-black text-center">أيام المواقف</th>
                                                <th className="p-3 font-black text-center">القائم بالحفظ</th>
                                                <th className="p-3 font-black text-center w-48">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {availableSnapshots.map((snap, idx) => {
                                                const isToday = snap.date === new Date().toISOString().split('T')[0];
                                                return (
                                                    <tr key={snap.date} className={`hover:bg-teal-50/40 transition ${isToday ? 'bg-teal-50/20 font-bold' : ''}`}>
                                                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                                        <td className="p-3 font-black text-slate-900">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono text-xs">{snap.date}</span>
                                                                {isToday && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">اليوم</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                                                            {new Date(snap.timestamp).toLocaleTimeString('ar-IQ')}
                                                        </td>
                                                        <td className="p-3 text-center font-bold text-slate-700">
                                                            {snap.staffCount} موظف
                                                        </td>
                                                        <td className="p-3 text-center font-bold text-indigo-700">
                                                            <span className="bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 text-[11px]">
                                                                {snap.overridesCount} أيام
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center text-slate-600 text-[11px]">
                                                            {snap.savedBy}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedSnapshotPreview(snap)}
                                                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                                                    title="معاينة تفاصيل اللقطة"
                                                                >
                                                                    👁️ معاينة
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDownloadSnapshot(snap)}
                                                                    className="p-1 text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                                                                    title="تنزيل ملف JSON"
                                                                >
                                                                    📥
                                                                </button>
                                                                {currentUserRole === 'admin' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRestoreSnapshot(snap)}
                                                                        className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-[11px] font-black shadow-sm transition cursor-pointer active:scale-95"
                                                                        title="استعادة واعتماد هذه النسخة"
                                                                    >
                                                                        ⏪ استعادة
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* تذييل النافذة */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <span>🔒</span>
                        <span>حماية الأرشيف: عمليات الاستعادة تتطلب مصادقة رمز مدير النظام للتأكيد.</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedSnapshotPreview(null);
                            setShowRestoreCenterModal(false);
                        }}
                        className="w-full sm:w-auto px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow transition cursor-pointer"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};
