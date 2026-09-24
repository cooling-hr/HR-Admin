import React from 'react';

// سؤال تأكيد المباشرة بعد انتهاء الفترة. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const ReturnPromptModal = ({ ctx }) => {
    const { confirmReturn, pendingReturnPrompt } = ctx;
    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[130] flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-4 text-white flex-shrink-0">
                    <h3 className="text-base font-black flex items-center gap-2"><span>✅</span><span>تأكيد المباشرة</span></h3>
                </div>
                <div className="p-5 space-y-4 text-right overflow-y-auto min-h-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 leading-relaxed">
                        عاد <span className="font-black text-emerald-800">{pendingReturnPrompt.emp.name}</span> إلى الوضع الطبيعي بانتهاء ({pendingReturnPrompt.period.type}) في {pendingReturnPrompt.period.to}.
                    </p>
                    <p className="text-sm font-black text-slate-900">هل باشر فعلاً؟</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => confirmReturn(true)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow transition cursor-pointer">
                            نعم، باشر
                        </button>
                        <button type="button" onClick={() => confirmReturn(false)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow transition cursor-pointer">
                            لا — لم يباشر بعد
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        «لا» تفتح غياباً مفتوح النهاية من اليوم التالي لانتهاء الفترة، فيبقى ظاهراً في الكشف حتى يعود.
                    </p>
                </div>
            </div>
        </div>
    );
};
