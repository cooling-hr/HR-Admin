import React from 'react';

// نافذة تسجيل الدخول للنظام. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const LoginModal = ({ ctx }) => {
    const { AuthViews, cancelSessionTakeover, confirmSessionTakeover, handleLogin, isCheckingLogin, loginEmail, loginError, loginInputPin, loginPassword, pendingTakeover, safeStorage, setLoginEmail, setLoginInputPin, setLoginPassword, setShowLoginModal, setShowLoginPassword, showLoginPassword } = ctx;
    return (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden animate-fadeInUp">
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white text-center relative flex-shrink-0">
                    <button
                        onClick={() => setShowLoginModal(false)}
                        className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition"
                    >
                        ✕
                    </button>
                    <div className="text-4xl mb-2">🔐</div>
                    <h2 className="text-2xl font-black">تسجيل الدخول للنظام</h2>
                    <p className="text-xs text-blue-200 mt-1">{AuthViews.editionTexts.loginSubtitle}</p>
                </div>

                <form onSubmit={handleLogin} className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
                    <AuthViews.LoginFields ctx={{ loginInputPin, setLoginInputPin, loginEmail, setLoginEmail, loginPassword, setLoginPassword, showLoginPassword, setShowLoginPassword, loginError, isCheckingLogin, pendingTakeover, confirmSessionTakeover, cancelSessionTakeover, safeStorage }} />
                </form>
            </div>
        </div>
    );
};
