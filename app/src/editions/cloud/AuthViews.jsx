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

// شاشة الدخول السريع بالرمز الرباعي وصندوق تولّي الجلسة. تبقى في موضعها من الشجرة.
export const PinScreen = ({ ctx }) => {
    const { showPinScreen, getDevicePinLocks, selectedPinUid, setSelectedPinUid, pinInput, setPinInput,
        pinError, setPinError, setPinAttempts, isCheckingLogin, handlePinLogin, useAnotherAccount,
        pendingTakeover, confirmSessionTakeover, cancelSessionTakeover } = ctx;
    return (
        <>
    {/* شاشة الدخول السريع بالرمز الرباعي — الجهاز قد يحمل رموز عدة موظفين معاً */}
    {showPinScreen && (() => {
        const deviceLocks = getDevicePinLocks().filter(l => l.session && l.session.refreshToken);
        const activeLock = selectedPinUid ? deviceLocks.find(l => l.uid === selectedPinUid) : null;
        return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full max-h-[92vh] flex flex-col overflow-hidden animate-fadeInUp">
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white text-center flex-shrink-0">
                    <div className="text-4xl mb-2">🔒</div>
                    <h2 className="text-xl font-black">
                        {activeLock ? `مرحباً بعودتك، ${activeLock.name || ''}` : 'من أنت؟'}
                    </h2>
                    <p className="text-xs text-blue-200 mt-1">
                        {activeLock ? 'أدخل رمزك الرباعي على هذا الجهاز' : 'اختر حسابك من المسجَّلين على هذا الجهاز'}
                    </p>
                </div>

                {!activeLock ? (
                    /* خطوة الاختيار: تظهر فقط حين يتشارك الجهاز أكثر من موظف */
                    <div className="p-6 space-y-2 overflow-y-auto min-h-0 flex-1">
                        {deviceLocks.map(l => (
                            <button
                                key={l.uid}
                                type="button"
                                onClick={() => { setSelectedPinUid(l.uid); setPinInput(''); setPinError(''); setPinAttempts(0); }}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition text-right cursor-pointer active:scale-95"
                            >
                                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-700 text-white flex items-center justify-center font-black">
                                    {(l.name || '؟').trim().charAt(0)}
                                </span>
                                <span className="font-bold text-sm text-slate-800">{l.name || 'حساب بلا اسم'}</span>
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={useAnotherAccount}
                            className="w-full text-center pt-2 text-xs text-slate-500 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                            + دخول بحساب آخر غير مسجَّل هنا
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={(e) => { e.preventDefault(); if (pinInput.length === 4 && !pendingTakeover) handlePinLogin(activeLock.uid); }}
                        className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1"
                    >
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            autoFocus
                            placeholder="••••"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-center text-3xl tracking-[0.5em] font-mono font-bold text-indigo-900 outline-none focus:border-indigo-600 transition shadow-inner"
                        />
                        {pinError && (
                            <div className="p-2.5 bg-red-50 border-2 border-red-300 text-red-700 text-xs font-bold rounded-xl text-center">
                                {pinError}
                            </div>
                        )}
                        {/* سؤال الاستبدال كان يُرسَم في نافذة الدخول بالبريد وحدها: الدخول بالرمز يحجب الحساب
                            المفتوح في جلسة أخرى ثم لا يظهر أي سؤال، فيعود الزر كأن شيئاً لم يحدث */}
                        {pendingTakeover && (
                            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl text-right shadow-sm space-y-3">
                                <div className="flex items-start gap-2">
                                    <span className="text-xl leading-none">⚠️</span>
                                    <div className="text-xs font-bold text-amber-900 leading-relaxed">
                                        <div className="font-black text-sm mb-1">هذا الحساب مفتوح على جهاز آخر</div>
                                        <div>آخر نشاط على ذلك الجهاز قبل {pendingTakeover.otherDeviceSeconds} ثانية.</div>
                                        <div className="mt-1">إن تابعت، سيُسجَّل خروج ذلك الجهاز تلقائياً وتظهر له رسالة توضّح السبب.</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={confirmSessionTakeover}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-black rounded-xl text-xs shadow transition active:scale-95 cursor-pointer"
                                    >
                                        متابعة وإنهاء الجلسة الأخرى
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelSessionTakeover}
                                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={pinInput.length !== 4 || isCheckingLogin || !!pendingTakeover}
                            className={`w-full py-3.5 text-white font-bold rounded-xl text-sm shadow-lg transition transform active:scale-95 ${
                                pinInput.length !== 4 || isCheckingLogin || pendingTakeover
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 hover:from-green-700 hover:to-teal-800 cursor-pointer'
                            }`}
                        >
                            {isCheckingLogin ? '⏳ جارٍ الدخول...' : '🔓 دخول'}
                        </button>
                        {deviceLocks.length > 1 && (
                            <button
                                type="button"
                                onClick={() => { setSelectedPinUid(null); setPinInput(''); setPinError(''); setPinAttempts(0); }}
                                className="w-full text-center text-xs text-indigo-700 hover:underline cursor-pointer"
                            >
                                ← لست {activeLock.name || ''}؟ اختر حساباً آخر
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={useAnotherAccount}
                            className="w-full text-center text-xs text-slate-500 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                            دخول بحساب آخر غير مسجَّل هنا
                        </button>
                    </form>
                )}
            </div>
        </div>
        );
    })()}
        </>
    );
};

// عرض تفعيل الرمز الرباعي لهذا الجهاز بعد أول دخول كامل ببريد وكلمة مرور.
export const SetPinOffer = ({ ctx }) => {
    const { showSetPinOffer, pendingPinOfferUser, setShowSetPinOffer, setPendingPinOfferUser, setDevicePinLock, safeStorage } = ctx;
    return (
        <>
    {/* عرض إتاحة رمز رباعي لهذا الجهاز بعد أول دخول كامل ببريد وكلمة مرور */}
    {showSetPinOffer && pendingPinOfferUser && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full max-h-[92vh] overflow-y-auto animate-fadeInUp p-6 text-center space-y-4">
                <div className="text-4xl">🔢</div>
                <h2 className="text-lg font-black text-slate-800">دخول أسرع في المرات القادمة؟</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                    اختر رمزاً رباعياً لهذا الجهاز فقط، بدل كتابة البريد وكلمة المرور كل مرة.
                    <br />تنبيه: الرمز يسرّع الدخول ولا يضيف حماية إضافية — من يملك هذا الجهاز يستطيع فتحه بالرمز.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={async () => {
                            const pin = prompt('أدخل رمزاً رباعياً (أرقام فقط):');
                            if (!pin) return;
                            if (!/^\d{4}$/.test(pin)) { alert('⚠️ يجب أن يتكون الرمز من 4 أرقام بالضبط.'); return; }
                            const confirmPin = prompt('أعد كتابة الرمز للتأكيد:');
                            if (confirmPin !== pin) { alert('⚠️ الرمزان غير متطابقين. حاول من جديد لاحقاً.'); return; }
                            const enrolled = await setDevicePinLock(pendingPinOfferUser.id, pin, pendingPinOfferUser.name);
                            setShowSetPinOffer(false);
                            setPendingPinOfferUser(null);
                            alert(enrolled
                                ? '✅ تم ضبط رمزك الرباعي على هذا الجهاز. يمكن لزملائك ضبط رموزهم عليه أيضاً بلا تعارض.'
                                : '⚠️ تعذّر ضبط الرمز: جلستك غير مكتملة على هذا الجهاز. سجّل الدخول من جديد ثم أعد المحاولة.');
                        }}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-black rounded-xl text-xs shadow transition active:scale-95 cursor-pointer"
                    >
                        نعم، رمز رباعي
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            safeStorage.setItem('pinOfferDeclined_' + pendingPinOfferUser.id, '1');
                            setShowSetPinOffer(false);
                            setPendingPinOfferUser(null);
                        }}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                        لا، تجاهل
                    </button>
                </div>
            </div>
        </div>
    )}
        </>
    );
};

// عناصر قائمة المستخدم في الشريط العلوي. الغلاف مشترك ويبقى في الجسم؛ المحتوى يختلف:
// السحابية تفصل صلاحية الأرشيف عن صلاحية الحسابات، وتضيف إلغاء الرمز الرباعي لهذا الجهاز.
export const UserMenuItems = ({ ctx }) => {
    const { currentUserRole, setShowUserMenu, handleOpenUserManagement, fetchAvailableSnapshots,
        setShowRestoreCenterModal, getDevicePinLockFor, currentUserIdRef, clearDevicePinLock } = ctx;
    return (
        <>
        {currentUserRole === 'admin' && (
            <button
                onClick={() => { setShowUserMenu(false); handleOpenUserManagement(); }}
                className="w-full text-right px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
                title="إدارة الحسابات والمستخدمين وربطها بحسابات Firebase وتعيين الصلاحيات"
            >
                <span>👥</span><span>الحسابات والصلاحيات</span>
            </button>
        )}
        {(currentUserRole === 'admin' || currentUserRole === 'manager') && (
            <button
                onClick={() => {
                    setShowUserMenu(false);
                    fetchAvailableSnapshots();
                    setShowRestoreCenterModal(true);
                }}
                className="w-full text-right px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
                title={currentUserRole === 'admin' ? "مركز الاستعادة والأرشيف الزمني للنسخ الاحتياطية اليومية" : "استعراض وتنزيل اللقطات اليومية (الاستعادة خاصة بمدير النظام)"}
            >
                <span>🛡️</span><span>{currentUserRole === 'admin' ? 'الأرشيف والاستعادة' : 'الأرشيف'}</span>
            </button>
        )}
        {getDevicePinLockFor(currentUserIdRef.current) && (
            <button
                onClick={() => {
                    setShowUserMenu(false);
                    if (!confirm('إلغاء رمزك الرباعي على هذا الجهاز؟\n\nستحتاج بريدك وكلمة مرورك عند دخولك القادم. رموز زملائك على هذا الجهاز لن تتأثر.')) return;
                    clearDevicePinLock(currentUserIdRef.current);
                    alert('✅ أُلغي رمزك الرباعي على هذا الجهاز.');
                }}
                className="w-full text-right px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
                title="إلغاء رمزك الرباعي على هذا الجهاز (لا يمسّ رموز الزملاء)"
            >
                <span>🔢</span><span>إلغاء رمزي على هذا الجهاز</span>
            </button>
        )}
        </>
    );
};

// وجهة المستخدم عند المضيّ من شاشة الترحيب. تختلف بالنسخة لا بالواجهة: السحابية
// تفتح شاشة الرمز الرباعي إن كان على الجهاز رمز محفوظ، وإلا نافذة الدخول.
// دالة مساعدة لا مكوّن (بحرف صغير) — تُرجع دالة لا عنصراً، فلا تُرسَم في الحارس.
export const makeWelcomeAction = (ctx) => () => {
    const { getDevicePinLocks, setShowLoginModal, setSelectedPinUid, setPinInput, setPinError,
        setPinAttempts, setShowPinScreen } = ctx;
    const locks = getDevicePinLocks().filter(l => l.session && l.session.refreshToken);
    if (locks.length === 0) {
        setShowLoginModal(true);
        return;
    }
    // حساب واحد على الجهاز: لا داعي لخطوة اختيار — تُفتح شاشة رمزه مباشرة
    setSelectedPinUid(locks.length === 1 ? locks[0].uid : null);
    setPinInput('');
    setPinError('');
    setPinAttempts(0);
    setShowPinScreen(true);
};

// حقول نافذة الدخول: بريد وكلمة مرور، وإظهار/إخفاء كلمة المرور، وصندوق تولّي الجلسة
// حين يفتح الحساب نفسه تبويباً ثانياً. الغلاف <form> مشترك ويبقى في الجسم.
export const LoginFields = ({ ctx }) => {
    const { loginEmail, setLoginEmail, loginPassword, setLoginPassword, showLoginPassword,
        setShowLoginPassword, loginError, isCheckingLogin, pendingTakeover, confirmSessionTakeover,
        cancelSessionTakeover, setShowLoginModal, setShowWelcome, setCurrentUserRole, safeStorage } = ctx;
    return (
        <>
        <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700">📧 البريد الإلكتروني:</label>
            <input
                type="email"
                id="loginEmailInput"
                name="username"
                autoComplete="username"
                autoFocus
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-center font-bold text-indigo-900 outline-none focus:border-indigo-600 transition shadow-inner"
            />
        </div>
        <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700">🔑 كلمة المرور:</label>
            <div className="relative">
                <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="loginPasswordInput"
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 pl-11 text-center font-bold text-indigo-900 outline-none focus:border-indigo-600 transition shadow-inner"
                />
                <button
                    type="button"
                    onClick={() => setShowLoginPassword(v => !v)}
                    tabIndex={-1}
                    title={showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-lg text-slate-400 hover:text-indigo-700 cursor-pointer px-1.5"
                >
                    {showLoginPassword ? '🙈' : '👁️'}
                </button>
            </div>
        </div>

        {pendingTakeover && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl text-right shadow-sm space-y-3">
                <div className="flex items-start gap-2">
                    <span className="text-xl leading-none">⚠️</span>
                    <div className="text-xs font-bold text-amber-900 leading-relaxed">
                        <div className="font-black text-sm mb-1">هذا الحساب مفتوح على جهاز آخر</div>
                        <div>آخر نشاط على ذلك الجهاز قبل {pendingTakeover.otherDeviceSeconds} ثانية.</div>
                        <div className="mt-1">إن تابعت، سيُسجَّل خروج ذلك الجهاز تلقائياً وتظهر له رسالة توضّح السبب.</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={confirmSessionTakeover}
                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-black rounded-xl text-xs shadow transition active:scale-95 cursor-pointer"
                    >
                        متابعة وإنهاء الجلسة الأخرى
                    </button>
                    <button
                        type="button"
                        onClick={cancelSessionTakeover}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        )}

        {loginError && !pendingTakeover && (
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

// حقول اعتماد المستخدم في نموذج الحسابات: معرّف Firebase أو بريد وكلمة مرور جديدة،
// وأولوية الجلسة عند دخول الحساب نفسه من جهازين. لا مقابل لها في الأوفلاين.
export const UserCredentialFields = ({ ctx }) => {
    const { editingUserId, userFormManualUid, setUserFormManualUid, userFormUid, setUserFormUid, userFormLocalPart, setUserFormLocalPart, userFormPassword, setUserFormPassword, userFormPriority, setUserFormPriority } = ctx;
    return (
        <>
        <div className="md:col-span-3 space-y-1">
            {(editingUserId || userFormManualUid) ? (
                <>
                    <label className="block text-[11px] font-black text-slate-700">🆔 معرّف حساب Firebase (UID):</label>
                    <input
                        id="userFormUidInput"
                        type="text"
                        value={userFormUid}
                        onChange={(e) => setUserFormUid(e.target.value)}
                        placeholder="UID من Firebase"
                        className="w-full bg-white border border-amber-400 focus:border-indigo-600 rounded-xl px-3 py-2 text-[11px] font-mono font-bold text-indigo-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                    />
                    {!editingUserId && (
                        <button type="button" onClick={() => { setUserFormManualUid(false); setUserFormUid(''); }} className="w-full text-center border-t border-dashed border-slate-300 pt-1 text-[10px] text-indigo-700 hover:underline cursor-pointer">
                            🔄 بدلاً من ذلك: إنشاء حساب جديد بكلمة مرور
                        </button>
                    )}
                </>
            ) : (
                <>
                    <label className="block text-[11px] font-black text-slate-700">🔤 اسم الدخول (أحرف إنجليزية):</label>
                    <input
                        type="text"
                        value={userFormLocalPart}
                        onChange={(e) => setUserFormLocalPart(e.target.value)}
                        placeholder="مثال: fatima"
                        dir="ltr"
                        className="w-full bg-white border border-amber-400 focus:border-indigo-600 rounded-xl px-3 py-2 text-[11px] font-mono font-bold text-indigo-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                    />
                    <label className="block text-[11px] font-black text-slate-700">🔑 كلمة مرور الحساب الجديد:</label>
                    <input
                        type="text"
                        value={userFormPassword}
                        onChange={(e) => setUserFormPassword(e.target.value)}
                        placeholder="6 أحرف على الأقل"
                        className="w-full bg-white border border-amber-400 focus:border-indigo-600 rounded-xl px-3 py-2 text-[11px] font-mono font-bold text-indigo-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                    />
                    <button type="button" onClick={() => setUserFormManualUid(true)} className="w-full text-center border-t border-dashed border-slate-300 pt-1 text-[10px] text-indigo-700 hover:underline cursor-pointer">
                        🔄 بدلاً من ذلك: ربط حساب Firebase موجود مسبقاً
                    </button>
                </>
            )}
        </div>
        <div className="md:col-span-2 space-y-1">
            <label className="block text-[11px] font-black text-slate-700">🥇 أولوية التحرير:</label>
            <input
                type="number"
                min="1"
                value={userFormPriority}
                onChange={(e) => setUserFormPriority(e.target.value)}
                title="الرقم الأصغر يفوز: عند دخول موظفَين بنفس الصلاحية معاً، يحتفظ صاحب الرقم الأصغر بالتعديل ويهبط الآخر للاطلاع. والرقم الافتراضي لأي حساب جديد هو 99."
                className="w-full bg-white border border-slate-300 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs font-mono font-black text-indigo-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
            />
        </div>
        </>
    );
};

// خانة الاعتماد في صف المستخدم: مقطع من معرّف Firebase، أو تنبيه أن الحساب غير مربوط.
export const UserRowCredentialCell = ({ ctx }) => {
    const { u } = ctx;
    return (
        <>
        {u.uid ? (
            <span
                className="px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-700 border-slate-200 font-mono inline-block text-[10px] font-black"
                title={u.uid}
            >
                {String(u.uid).slice(0, 10)}…
            </span>
        ) : (
            <span className="px-2.5 py-1 rounded-lg border bg-rose-50 text-rose-700 border-rose-200 inline-block text-[10px] font-black">
                ⚠️ غير مرتبط
            </span>
        )}
        </>
    );
};
