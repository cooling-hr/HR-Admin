import React from 'react';

// نافذة إدارة المستخدمين والصلاحيات. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const UserManagementModal = ({ ctx }) => {
    const { AuthViews, activeSessions, currentUserRole, editingUserId, getLocalOfflineAdminPin, handleCancelUserEdit, handleDeleteUser, handleEditUserClick, handleForceEvictSession, handleSaveUser, handleToggleUserActive, isSelfUser, revealedPinUsers, sessionKeyFor, setRevealedPinUsers, setShowUserManagementModal, setShowUserPins, setUserFormLocalPart, setUserFormManualUid, setUserFormName, setUserFormPassword, setUserFormPerms, setUserFormPin, setUserFormPriority, setUserFormRole, setUserFormUid, showUserPins, systemUsers, updateLocalOfflineAdminPin, userFormLocalPart, userFormManualUid, userFormName, userFormPassword, userFormPerms, userFormPin, userFormPriority, userFormRole, userFormUid } = ctx;
    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[120] flex items-center justify-center p-3 md:p-6 overflow-y-auto no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-fadeInUp my-auto">
                {/* ترويسة النافذة */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex justify-between items-center border-b border-indigo-900/50">
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl text-2xl">👥</span>
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                                <span>إدارة الحسابات وصلاحيات المستخدمين</span>
                                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">خاص بالمدير 👑</span>
                            </h3>
                            <p className="text-xs text-slate-300 mt-0.5">{AuthViews.editionTexts.userManagementSubtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            handleCancelUserEdit();
                            setShowUserManagementModal(false);
                        }}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div id="userModalScrollBody" className="p-5 md:p-6 space-y-6 max-h-[80vh] overflow-y-auto scroll-smooth">
                    <AuthViews.DeviceAdminPinPanel ctx={{ currentUserRole, getLocalOfflineAdminPin, updateLocalOfflineAdminPin }} />
                    {/* نموذج إضافة / تعديل مستخدم */}
                    <form
                        id="userEditFormSection"
                        onSubmit={handleSaveUser}
                        className={`p-4 md:p-5 rounded-2xl border transition-all duration-300 ${
                            editingUserId 
                                ? 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-400 shadow-md ring-2 ring-amber-400/50' 
                                : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3 border-b border-slate-200/80 pb-2">
                            <span className="text-xs md:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <span>{editingUserId ? '✏️ تعديل بيانات وكلمة مرور المستخدم المحدد:' : '➕ إضافة مستخدم جديد للنظام:'}</span>
                                {editingUserId && (
                                    <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                                        وضع التعديل النشط ⚡
                                    </span>
                                )}
                            </span>
                            {editingUserId && (
                                <button
                                    type="button"
                                    onClick={handleCancelUserEdit}
                                    className="text-xs font-bold text-slate-500 hover:text-red-600 underline cursor-pointer flex items-center gap-1"
                                >
                                    <span>✕</span>
                                    <span>إلغاء وضع التعديل</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-5 space-y-1">
                                <label className="block text-[11px] font-black text-slate-700">👤 اسم المستخدم / اللقب:</label>
                                <input
                                    type="text"
                                    value={userFormName}
                                    onChange={(e) => setUserFormName(e.target.value)}
                                    placeholder="مثال: أحمد علي (إداري المركز)"
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm"
                                />
                            </div>

                            <div className="md:col-span-4 space-y-1">
                                <label className="block text-[11px] font-black text-slate-700">🛡️ نوع الصلاحية الممنوحة:</label>
                                <select
                                    value={userFormRole}
                                    onChange={(e) => setUserFormRole(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm cursor-pointer"
                                >
                                    <AuthViews.RoleOptions />
                                </select>
                            </div>

                            <AuthViews.UserCredentialFields ctx={{ editingUserId, userFormPin, setUserFormPin, userFormManualUid, setUserFormManualUid, userFormUid, setUserFormUid, userFormLocalPart, setUserFormLocalPart, userFormPassword, setUserFormPassword, userFormPriority, setUserFormPriority }} />

                            {/* مربعات اختيار صلاحيات التعديل للتبويبات (Granular Tab Permissions) */}
                            {userFormRole === 'operator' && (
                                <div className="md:col-span-12 p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                                            <span>🛡️ تحديد صلاحيات التعديل والمزامنة الممنوحة لهذا الإداري:</span>
                                        </span>
                                        <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                                            👁️ الاطلاع والطباعة متاح لكافة التبويبات تلقائياً
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                                        <label className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${userFormPerms.dailyReport ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={userFormPerms.dailyReport}
                                                onChange={(e) => setUserFormPerms({ ...userFormPerms, dailyReport: e.target.checked })}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold">📅 الموقف اليومي</span>
                                        </label>
                                        <label className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${userFormPerms.staffMaster ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={userFormPerms.staffMaster}
                                                onChange={(e) => setUserFormPerms({ ...userFormPerms, staffMaster: e.target.checked })}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold">👥 الملاك والمنتسبين</span>
                                        </label>
                                        <label className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${userFormPerms.safety ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={userFormPerms.safety}
                                                onChange={(e) => setUserFormPerms({ ...userFormPerms, safety: e.target.checked })}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold">🦺 تجهيزات السلامة</span>
                                        </label>
                                        <label className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${userFormPerms.evaluation ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={userFormPerms.evaluation}
                                                onChange={(e) => setUserFormPerms({ ...userFormPerms, evaluation: e.target.checked })}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold">⭐ التقييم السنوي</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-12 flex justify-end gap-2 pt-2">
                                {editingUserId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelUserEdit}
                                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                        إلغاء
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className={`px-5 py-2 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                        editingUserId 
                                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700' 
                                            : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
                                    }`}
                                >
                                    <span>{editingUserId ? '💾 حفظ تعديل المستخدم' : '➕ إضافة المستخدم للنظام'}</span>
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* جدول قائمة المستخدمين */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs md:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <span>📋 قائمة المستخدمين المعرفين بالنظام:</span>
                                <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">{systemUsers.length} مستخدم</span>
                            </span>
                            <AuthViews.RevealPinsToggle ctx={{ showUserPins, setShowUserPins }} />
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                                            <th className="p-3 font-black text-center w-10">ت</th>
                                            <th className="p-3 font-black">اسم المستخدم</th>
                                            <th className="p-3 font-black text-center">الصلاحية</th>
                                            <th className="p-3 font-black text-center">{AuthViews.editionTexts.credentialColumn}</th>
                                            <th className="p-3 font-black text-center">الحساب</th>
                                            <th className="p-3 font-black text-center">الجلسة النشطة</th>
                                            <th className="p-3 font-black text-center w-28">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {systemUsers.map((u, idx) => {
                                            const isActive = u.active !== false;
                                            const perms = u.permissions || {};
                                            let roleBadge = (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">✍️ إداري مُدخل</span>
                                                    <div className="flex flex-wrap items-center justify-center gap-0.5 max-w-[140px]">
                                                        {perms.dailyReport && <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded border border-indigo-100 font-bold">📅 موقف</span>}
                                                        {perms.staffMaster && <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded border border-emerald-100 font-bold">👥 ملاك</span>}
                                                        {perms.safety && <span className="text-[8px] bg-amber-50 text-amber-800 px-1 py-0.2 rounded border border-amber-100 font-bold">🦺 سلامة</span>}
                                                        {perms.evaluation && <span className="text-[8px] bg-purple-50 text-purple-700 px-1 py-0.2 rounded border border-purple-100 font-bold">⭐ تقييم</span>}
                                                    </div>
                                                </div>
                                            );
                                            if (u.role === 'admin') roleBadge = <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300">👑 مدير النظام</span>;
                                            else if (u.role === 'manager') roleBadge = <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-50 text-teal-900 border border-teal-300">🛡️ إداري</span>;
                                            else if (u.role === 'viewer') roleBadge = <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">👁️ مستعرض (اطلاع فقط)</span>;

                                            // مفتاح الجلسة يأتي من الطبقة: المعرّف المحلي أوفلاين، ومعرّف الحساب الموثّق سحابياً
                                            const userSess = (sessionKeyFor(u) && activeSessions) ? activeSessions[sessionKeyFor(u)] : null;
                                            const isOnline = userSess && userSess.lastSeen && (Date.now() - userSess.lastSeen < 15000);

                                            const isCurrentlyEditing = editingUserId === u.id;

                                            return (
                                                <tr 
                                                    key={u.id} 
                                                    className={`transition-all ${
                                                        isCurrentlyEditing 
                                                            ? 'bg-amber-100/80 ring-2 ring-amber-400 border-amber-300 font-black' 
                                                            : (isActive ? 'hover:bg-slate-50/80' : 'opacity-50 bg-slate-50')
                                                    }`}
                                                >
                                                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                                    <td className="p-3 font-black text-slate-900">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{u.name}</span>
                                                            {u.id === 'usr_1' && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100 font-bold">الماستر</span>}
                                                            {isCurrentlyEditing && (
                                                                <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                                                                    ✏️ قيد التعديل
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">{roleBadge}</td>
                                                    <td className="p-3 text-center font-mono font-black text-slate-700">
                                                        <AuthViews.UserRowCredentialCell ctx={{ u, showUserPins, revealedPinUsers, setRevealedPinUsers }} />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleUserActive(u.id)}
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black transition cursor-pointer ${
                                                                isActive 
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                                            }`}
                                                            title="انقر لتبديل حالة التفعيل"
                                                        >
                                                            {isActive ? '🟢 مفعل' : '🔴 معطل'}
                                                        </button>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {isOnline ? (
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                                                    <span>🟢</span>
                                                                    <span>متصل الآن</span>
                                                                </span>
                                                                {isSelfUser(u) ? (
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                                                                        أنت
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleForceEvictSession(sessionKeyFor(u), u.name)}
                                                                        title="إنهاء الجلسة وفك القفل"
                                                                        className="px-1.5 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-black transition cursor-pointer border border-rose-300"
                                                                    >
                                                                        🔓 فك القفل
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                                                ⚪ غير متصل
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditUserClick(u)}
                                                                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                                                                    isCurrentlyEditing 
                                                                        ? 'bg-amber-500 text-white shadow-sm' 
                                                                        : 'text-blue-600 hover:bg-blue-50'
                                                                }`}
                                                                title="تعديل المستخدم (تمرير تلقائي فوري للأعلى)"
                                                            >
                                                                <span>✏️</span>
                                                                <span>تعديل</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                                title="حذف المستخدم"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* تذييل النافذة */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <span>☁️</span>
                        <span>المزامنة السحابية نشطة: تنعكس الإضافات والتعديلات فورياً على كافة الأجهزة والموبايلات.</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            handleCancelUserEdit();
                            setShowUserManagementModal(false);
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
