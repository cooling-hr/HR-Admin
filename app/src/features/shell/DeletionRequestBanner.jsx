import React from 'react';

// شريط طلب مسح البيانات بانتظار موافقة مدير النظام. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const DeletionRequestBanner = ({ ctx }) => {
    const { authorizeWipeApproval, currentUserRole, executeCompleteDatabaseWipe, pendingDeletionRequest, rejectDeletionRequest } = ctx;
    return (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 shadow-xl border-b-2 border-amber-300 animate-pulse sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-right">
                    <span className="text-3xl">🔔</span>
                    <div>
                        <div className="font-extrabold text-sm md:text-base flex items-center gap-2">
                            <span>طلب حذف قاعدة البيانات مقدم من:</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg font-mono font-black">{pendingDeletionRequest.requestedBy}</span>
                            <span className="text-xs opacity-80">({pendingDeletionRequest.timestamp})</span>
                        </div>
                        <div className="text-xs text-amber-100 mt-1 font-semibold">
                            سبب الطلب: "{pendingDeletionRequest.reason}"
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {currentUserRole === 'admin' ? (
                        <>
                            <button 
                                onClick={() => {
                                    if (authorizeWipeApproval()) {
                                        executeCompleteDatabaseWipe();
                                    }
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg transition flex items-center gap-1"
                            >
                                <span>✅</span> موافقة وتنفيذ الحذف
                            </button>
                            <button 
                                onClick={rejectDeletionRequest}
                                className="bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition"
                            >
                                <span>❌</span> رفض الطلب
                            </button>
                        </>
                    ) : (
                        <div className="bg-black/30 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-200 flex items-center gap-1.5">
                            <span className="animate-spin text-sm">⏳</span> الطلب بانتظار موافقة مدير النظام الرئيسي
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
