import React from 'react';

// ترويسة النظام العلوية. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. يُرسم دائماً.
export const AppHeader = ({ ctx }) => {
    const { AuthViews, clearDevicePinLock, cloudSyncStatus, currentUserIdRef, currentUserName, currentUserRole, fetchAvailableSnapshots, getDevicePinLockFor, handleLogout, handleOpenUserManagement, isDarkTheme, setIsDarkTheme, setShowRestoreCenterModal, setShowSyncModal, setShowUserMenu, showUserMenu, syncStatus } = ctx;
    return <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-xl relative overflow-hidden py-7 px-6 border-b-2 border-indigo-500 border-opacity-20">
        {/* توهج ضوئي خلفي ناعم */}
        <div className="absolute inset-0 bg-white opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
            <div className="text-center md:text-right w-full md:w-auto">
                <h1 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-2.5">
                    <span>🏢</span>
                    <span>نظام إدارة الملاك المتكامل</span>
                </h1>
                <p className="text-center md:text-right text-blue-100 mt-1.5 text-sm font-medium">
                    شركة نفط البصرة · شعبة تبريد المركز ومحطة عزل نهر بن عمر
                </p>
            </div>

            <AuthViews.HeaderExtras ctx={{ cloudSyncStatus, syncStatus, setShowSyncModal }} />

            {/* مبدّل الوضع الليلي — متاح للجميع، حتى الزائر الذي يتصفّح ويطبع دون تسجيل دخول */}
            <button
                onClick={() => setIsDarkTheme(window.__toggleHrTheme())}
                className="px-3 py-1 bg-slate-900/50 hover:bg-slate-900/80 border border-white/20 text-white rounded-full text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer flex-shrink-0 no-print"
                title={isDarkTheme ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي (الطباعة تبقى بيضاء دائماً)"}
            >
                {isDarkTheme ? '☀️ نهاري' : '🌙 ليلي'}
            </button>

            {/* ============================================================= */}
            {/* قائمة المستخدم: إدارة النظام تحتها لا بجانب هوية الشعبة.     */}
            {/* الأرشيف والحسابات يُستخدمان مرة في الشهر، ووجودهما كزرّين    */}
            {/* بألوان صارخة في الرأس كان يرفع شأنهما فوق العمل اليومي.      */}
            {/* ============================================================= */}
            {currentUserRole && (
                <div className="relative flex-shrink-0 no-print flex items-center gap-2">
                    {/* «خروج» يبقى ظاهراً بنقرة واحدة عمداً: الأجهزة هنا مشتركة بين
                        عدة موظفين، وإخفاؤه داخل قائمة يجعل نسيان الخروج أرجح — وجلسة
                        متروكة مفتوحة على جهاز مشترك ثغرة لا تحسيناً بصرياً. */}
                    <button
                        onClick={handleLogout}
                        className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer order-2"
                        title="تسجيل الخروج أو تبديل المستخدم"
                    >
                        🚪 خروج
                    </button>
                    <button
                        onClick={() => setShowUserMenu(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full border border-white/20 text-xs font-extrabold text-white shadow-sm transition cursor-pointer"
                        title="حسابك وإدارة النظام"
                    >
                        <span>{currentUserRole === 'admin' ? `👑 ${currentUserName || 'مدير النظام'}` : (currentUserRole === 'manager' ? `🛡️ ${currentUserName || 'إداري'}` : (currentUserRole === 'operator' ? `✍️ ${currentUserName || 'إداري مُدخل'}` : `👁️ ${currentUserName || 'مستعرض'}`))}</span>
                        <span className={`text-[9px] transition-transform ${showUserMenu ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {showUserMenu && (
                        <>
                            {/* طبقة الإغلاق بالنقر خارج القائمة — تحتها في التكديس لا فوقها */}
                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                            <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-50 text-right animate-fadeIn">
                                <AuthViews.UserMenuItems ctx={{ currentUserRole, setShowUserMenu, handleOpenUserManagement, fetchAvailableSnapshots, setShowRestoreCenterModal, getDevicePinLockFor, currentUserIdRef, clearDevicePinLock }} />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    </header>;
};
