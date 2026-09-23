import React from 'react';

// كتل الواجهة الخاصة بالنسخة السحابية وحدها. كل مكوّن يستقبل prop واحداً اسمه ctx
// يحوي ما تقرأه الكتلة من نطاق StaffSystem — اصطلاح موحَّد فلا قوائم props طويلة.
// وجودها هنا لا في الجسم المشترك هو ما يُبقي شيفرة المزامنة والدخول السحابي خارج
// حزمة الأوفلاين: شجرة الاستيراد وحدها تفصلهما، لا شرط وقت تشغيل.

// إضافات الشريط العلوي: شارة تعطّل الحفظ السحابي ومؤشّر حالة الاتصال.
export const HeaderExtras = ({ ctx }) => {
    const { cloudSyncStatus, syncStatus, setShowSyncModal } = ctx;
    return (
        <>
            {cloudSyncStatus && cloudSyncStatus.error && (
                <span
                    className="px-3 py-1.5 rounded-full text-[10px] font-black bg-red-600 text-white border border-red-300 shadow animate-pulse cursor-help flex-shrink-0"
                    title={cloudSyncStatus.error}
                >
                    ⚠️ الحفظ السحابي متوقف
                </span>
            )}
            <div
                onClick={() => setShowSyncModal(true)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border cursor-pointer transition shadow-md flex-shrink-0 ${
                    syncStatus.connected
                        ? 'bg-emerald-950/70 border-emerald-400/40 text-emerald-200 hover:bg-emerald-900/80'
                        : 'bg-amber-950/70 border-amber-400/30 text-amber-200 hover:bg-amber-900/80'
                }`}
                title="اضغط لعرض تفاصيل المزامنة ورابط أجهزة الشعبة"
            >
                <span className="relative flex h-2.5 w-2.5">
                    {(typeof cloudSyncStatus !== 'undefined' && cloudSyncStatus && cloudSyncStatus.connected) || syncStatus.connected ? (
                        <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </>
                    ) : (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    )}
                </span>
                <span className="text-xs font-bold">
                    {(typeof cloudSyncStatus !== 'undefined' && cloudSyncStatus && cloudSyncStatus.connected) ? '☁️ متصل بالسحابة الحية (أونلاين 24/7)' : (syncStatus.connected ? `🟢 السيرفر المحلي نشط (${syncStatus.ip || 'Local'})` : '🟡 أوفلاين محلي')}
                </span>
            </div>
        </>
    );
};

// نافذة تفاصيل المزامنة وبثّ البيانات. تُستدعى في موضعها الأصلي من الشجرة تماماً:
// نقل نافذة منبثقة إلى موضع آخر يغيّر سياق تكديسها، وقد حبس ذلك النوافذ سابقاً في هذا المشروع.
export const SyncModal = ({ ctx }) => {
    const { showSyncModal, setShowSyncModal, cloudSyncStatus, syncStatus, pushDataToServer } = ctx;
    return (
        <>
    {showSyncModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-fadeInUp">
                {/* رأس النافذة */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white relative flex-shrink-0">
                    <button
                        onClick={() => setShowSyncModal(false)}
                        className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition"
                    >
                        ✕
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📡</span>
                        <div>
                            <h3 className="text-xl font-black">سيرفر المزامنة الداخلي للشعبة</h3>
                            <p className="text-xs text-blue-200 mt-0.5">ربط ومزامنة البيانات حياً بين حواسب وموبايلات الشعبة</p>
                        </div>
                    </div>
                </div>

                {/* محتوى النافذة */}
                <div className="p-6 space-y-5 overflow-y-auto min-h-0 flex-1">
                    {/* بطاقة حالة الاتصال */}
                    {cloudSyncStatus && cloudSyncStatus.connected ? (
                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 text-right space-y-2">
                            <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                                🟢 متصل بالسحابة الحية (أونلاين 24/7)
                            </div>
                            <div className="text-xs text-indigo-800 space-y-1 pt-1 border-t border-indigo-200/60">
                                <div>☁️ حالة السحابة: <span className="font-bold text-emerald-700">متصلة وشغالة بنجاح</span></div>
                                <div>🕒 آخر مزامنة سحابية: <span>{cloudSyncStatus.lastSync || 'الآن'}</span></div>
                            </div>
                        </div>
                    ) : syncStatus.connected ? (
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-right space-y-2">
                            <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                                🟢 متصل بالسيرفر المحلي (شبكة الشركة)
                            </div>
                            <div className="text-xs text-emerald-700 space-y-1 pt-1 border-t border-emerald-200/60">
                                <div>📍 عنوان السيرفر: <span className="font-mono dir-ltr inline-block">{syncStatus.ip}:{syncStatus.port}</span></div>
                                <div>🔄 إصدار التحديث: <span className="font-bold">v{syncStatus.version}</span></div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-right space-y-2">
                            <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                ⚠️ متصل بالذاكرة المحلية (أوفلاين)
                            </div>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                تأكد من الاتصال بالإنترنت للمزامنة السحابية الحية، أو تشغيل السيرفر المحلي في شبكة الشركة.
                            </p>
                        </div>
                    )}

                    {/* رابط أجهزة الشعبة */}
                    {syncStatus.connected && (
                        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <label className="text-xs font-bold text-slate-700 block">
                                🔗 رابط النظام لأجهزة وموبايلات الشعبة الأخرى:
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={`http://${syncStatus.ip}:${syncStatus.port}`}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-800 text-center select-all"
                                />
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(`http://${syncStatus.ip}:${syncStatus.port}`);
                                        alert('✅ تم نسخ رابط الشعبة بنجاح!');
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow transition"
                                >
                                    📋 نسخ الرابط
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500 text-right">
                                * افتح هذا الرابط في أي مبايل أو حاسبة متصلة بنفس راوتر الشعبة لقراءة وتحديث البيانات حياً.
                            </p>
                        </div>
                    )}
                </div>

                {/* أزرار التحكم والإجراءات — تذييل ثابت لا يمرّ مع المحتوى */}
                <div className="flex items-center justify-between gap-3 p-6 pt-4 border-t border-slate-100 flex-shrink-0">
                    <button
                        onClick={() => {
                            pushDataToServer();
                            alert('🔄 تم بث وتعميم البيانات الحالية للسيرفر بنجاح!');
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                        <span>🔄</span>
                        <span>مزامنة حية الآن (Force Sync)</span>
                    </button>
                    <button
                        onClick={() => setShowSyncModal(false)}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    )}
        </>
    );
};
