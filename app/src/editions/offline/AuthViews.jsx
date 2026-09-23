import React from 'react';

// كتل الواجهة الخاصة بالنسخة الأوفلاين وحدها. نفس أسماء صادرات النسخة السحابية
// وبنفس اصطلاح ctx، حتى يستدعيها الجسم المشترك بلا شرط ولا فرق بين النسختين.
// ما لا تحتاجه هذه النسخة يُصدَّر فارغاً بدل أن يفحص الجسمُ النسخةَ.

export const HeaderExtras = () => null;   // لا مزامنة سحابية فلا شارة حالة
export const SyncModal = () => null;      // ولا نافذة مزامنة
export const PinScreen = () => null;      // الدخول هنا برمز مباشر بلا خطوة ثانية
export const SetPinOffer = () => null;    // ولا عرض لتفعيل رمز رباعي

// الوجهة من شاشة الترحيب: نافذة الدخول مباشرة، بلا شاشة رمز وسيطة.
export const makeWelcomeAction = (ctx) => () => ctx.setShowLoginModal(true);

// عناصر قائمة المستخدم: صلاحية المدير وحدها تفتح الحسابات والأرشيف معاً.
export const UserMenuItems = ({ ctx }) => {
    const { currentUserRole, setShowUserMenu, handleOpenUserManagement, fetchAvailableSnapshots, setShowRestoreCenterModal } = ctx;
    return (
        <>
        {currentUserRole === 'admin' && (
            <>
                <button
                    onClick={() => { setShowUserMenu(false); handleOpenUserManagement(); }}
                    className="w-full text-right px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
                    title="إدارة الحسابات والمستخدمين والصلاحيات وكلمات المرور"
                >
                    <span>👥</span><span>الحسابات والصلاحيات</span>
                </button>
                <button
                    onClick={() => {
                        setShowUserMenu(false);
                        fetchAvailableSnapshots();
                        setShowRestoreCenterModal(true);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
                    title="مركز الاستعادة والأرشيف الزمني للنسخ الاحتياطية اليومية"
                >
                    <span>🛡️</span><span>الأرشيف والاستعادة</span>
                </button>
            </>
        )}
        </>
    );
};

// حقول نافذة الدخول: رمز واحد. الغلاف <form> مشترك ويبقى في الجسم.
export const LoginFields = ({ ctx }) => {
    const { loginInputPin, setLoginInputPin, loginError, isCheckingLogin,
        setShowLoginModal, setShowWelcome, setCurrentUserRole, safeStorage } = ctx;
    return (
        <>
        <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700">🔑 أدخل كلمة المرور الخاصة بك:</label>
            <input
                type="password"
                autoFocus
                placeholder="••••"
                value={loginInputPin}
                onChange={(e) => setLoginInputPin(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold text-indigo-900 outline-none focus:border-indigo-600 transition shadow-inner"
            />
        </div>

        {loginError && (
            <div className="p-3 bg-red-50 border-2 border-red-300 text-red-700 text-xs font-bold rounded-xl text-center whitespace-pre-line leading-relaxed shadow-sm">
                {loginError}
            </div>
        )}

        <button
            type="submit"
            disabled={isCheckingLogin}
            className={`w-full py-3.5 text-white font-bold rounded-xl text-sm shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 ${
                isCheckingLogin 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 hover:from-green-700 hover:to-teal-800 cursor-pointer'
            }`}
        >
            <span>{isCheckingLogin ? '⏳' : '🔓'}</span>
            <span>{isCheckingLogin ? 'جارٍ التحقق من الجلسة والصلاحية...' : 'دخول للنظام'}</span>
        </button>

        <div className="text-center pt-2">
            <button
                type="button"
                onClick={() => {
                    setCurrentUserRole('viewer');
                    setShowWelcome(false);
                    setShowLoginModal(false);
                }}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 hover:underline transition cursor-pointer"
            >
                👁️ استمرار كـ (مستعرض فقط) دون كلمة سر
            </button>
        </div>

        <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>الإصدار: <strong className="text-slate-600 font-mono">v9.5 Enterprise</strong></span>
            <button
                type="button"
                onClick={() => {
                    safeStorage.removeItem('systemUsersList');
                    safeStorage.removeItem('passwordsConfig');
                    window.location.href = window.location.pathname + '?v=' + Date.now();
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer flex items-center gap-1"
                title="تفريغ ذاكرة التخزين المؤقت وتحميل أحدث كود برمجيات من السحابة"
            >
                <span>🔄</span>
                <span>تحديث الكاش والصفحة</span>
            </button>
        </div>
        </>
    );
};

// حقول اعتماد المستخدم في نموذج الحسابات: رمز دخول محلي واحد.
export const UserCredentialFields = ({ ctx }) => {
    const { userFormPin, setUserFormPin } = ctx;
    return (
        <>
        <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-black text-slate-700">🔑 كلمة المرور (PIN):</label>
            <input
                id="userFormPinInput"
                type="text"
                value={userFormPin}
                onChange={(e) => setUserFormPin(e.target.value)}
                placeholder="رمز الدخول..."
                className="w-full bg-white border border-amber-400 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs font-mono font-black text-indigo-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
            />
        </div>
        </>
    );
};

// خانة الاعتماد في صف المستخدم: الرمز المحلي مع زر كشفه.
export const UserRowCredentialCell = ({ ctx }) => {
    const { u, isPinRevealed, revealedPinUsers, setRevealedPinUsers } = ctx;
    return (
        <>
        <div className="flex items-center justify-center gap-1">
            <span className={`px-2.5 py-1 rounded-lg border font-mono inline-block text-xs font-black transition ${
                isPinRevealed 
                    ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-sm ring-1 ring-amber-400' 
                    : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
                {isPinRevealed ? u.pin : '••••'}
            </span>
            <button
                type="button"
                onClick={() => setRevealedPinUsers(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                className={`p-1 rounded-lg transition cursor-pointer text-xs ${
                    revealedPinUsers[u.id] 
                        ? 'bg-amber-200 text-amber-900 font-bold' 
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                }`}
                title={revealedPinUsers[u.id] ? "إخفاء كلمة المرور لهذا المستخدم" : "إظهار كلمة المرور لهذا المستخدم مباشرة هنا"}
            >
                {revealedPinUsers[u.id] ? '🙈' : '👁️'}
            </button>
        </div>
        </>
    );
};
