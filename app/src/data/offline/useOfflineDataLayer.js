// نُقل حرفياً من editions/offline/App.jsx بأداة extract-hook.mjs — راجع ذلك الملف قبل
// أي تعديل يدوي هنا لاحقاً؛ لا منطق جديد أُضيف أثناء النقل.

// .jsx عمداً لا .ts: هذا الكود لم يكن مفحوصاً بصرامة من قبل (checkJs: false في تصريحه
// الأصلي داخل App.jsx)، وإخضاعه لفحص tsc الآن يحتاج كتابة عشرات الأنواع على منطق مزامنة
// حسّاس أثبتته التجربة الفعلية لا الأنواع — تقويته بأنواع حقيقية عمل منفصل لاحق مقصود.
import React from 'react';

// قفل الأقسام ميزة سحابية: كائن فارغ ثابت هنا حتى لا يتغيّر مرجعه بين الرسمات.
const EMPTY_LOCKED_SECTIONS = {};

export function useOfflineDataLayer(deps) {
  const {
    anchorDate,
    dailyStatusOverrides,
    dataEntryOperator,
    hourlyLeaveRecords,
    officialHolidays,
    overtimeHoursRecords,
    overtimeIds,
    safeStorage,
    setAnchorDate,
    setDailyStatusOverrides,
    setDataEntryOperator,
    setHourlyLeaveRecords,
    setOfficialHolidays,
    setOvertimeHoursRecords,
    setOvertimeIds,
    setShowLoginModal,
    setShowWelcome,
    setStaff,
    setThreeShiftAnchorSquad,
    setTwoShiftAnchorSquad,
    showCustomAlert,
    staff,
    threeShiftAnchorSquad,
    twoShiftAnchorSquad,
    useState,
  } = deps;

            // ===== نظام إدارة المستخدمين والصلاحيات الديناميكي المخصص للتبويبات (Dynamic Users & Granular RBAC) =====
const defaultSystemUsers = [
    { 
        id: 'usr_1', 
        name: 'أسامة خليل (مدير النظام)', 
        role: 'admin', 
        active: true, 
        createdAt: '2026-01-01',
        permissions: { dailyReport: true, staffMaster: true, safety: true, evaluation: true }
    },
    { 
        id: 'usr_2', 
        name: 'قاسم صبري', 
        role: 'operator', 
        pin: '2023', 
        active: true, 
        createdAt: '2026-01-01',
        permissions: { dailyReport: true, staffMaster: false, safety: false, evaluation: false }
    },
    { 
        id: 'usr_3', 
        name: 'حيدر سعد', 
        role: 'operator', 
        pin: '2020', 
        active: true, 
        createdAt: '2026-01-01',
        permissions: { dailyReport: true, staffMaster: false, safety: false, evaluation: false }
    },
    { 
        id: 'usr_4', 
        name: 'مستعرض عام', 
        role: 'viewer', 
        pin: '1234', 
        active: true, 
        createdAt: '2026-01-01',
        permissions: { dailyReport: false, staffMaster: false, safety: false, evaluation: false }
    }
];

const [systemUsers, setSystemUsers] = useState(() => {
    const saved = safeStorage.getItem('systemUsersList');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map(u => {
                    const basePerms = u.permissions || (
                        u.role === 'admin' 
                            ? { dailyReport: true, staffMaster: true, safety: true, evaluation: true }
                            : u.role === 'operator'
                                ? { dailyReport: true, staffMaster: false, safety: false, evaluation: false }
                                : { dailyReport: false, staffMaster: false, safety: false, evaluation: false }
                    );
                    if (u.id === 'usr_2' && (u.pin === '2026' || u.name === 'إداري الشعبة 1')) {
                        return { ...u, name: 'قاسم صبري', pin: '2023', permissions: basePerms };
                    }
                    if (u.id === 'usr_3' && (u.pin === '11294' || u.name === 'إداري الشعبة 2')) {
                        return { ...u, name: 'حيدر سعد', pin: '2020', permissions: basePerms };
                    }
                    return { ...u, permissions: basePerms };
                });
            }
        } catch (e) {}
    }
    return defaultSystemUsers;
});

React.useEffect(() => {
    safeStorage.setItem('systemUsersList', JSON.stringify(systemUsers));
}, [systemUsers]);

const [currentUserName, setCurrentUserName] = useState(() => safeStorage.getItem('currentUserName') || '');
React.useEffect(() => {
    if (currentUserName) {
        safeStorage.setItem('currentUserName', currentUserName);
    } else {
        safeStorage.removeItem('currentUserName');
    }
}, [currentUserName]);

const [showUserManagementModal, setShowUserManagementModal] = useState(false);
const [editingUserId, setEditingUserId] = useState(null);
const [userFormName, setUserFormName] = useState('');
const [userFormRole, setUserFormRole] = useState('operator');
const [userFormPin, setUserFormPin] = useState('');
const [userFormPerms, setUserFormPerms] = useState({
    dailyReport: true,
    staffMaster: false,
    safety: false,
    evaluation: false
});
const [showUserPins, setShowUserPins] = useState(false);
const [revealedPinUsers, setRevealedPinUsers] = useState({});

// دالة التحقق من صلاحية التعديل والمزامنة لتبويب معين (Can Edit & Sync Guard)
const canEdit = (section) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole !== 'operator') return false;
    const userObj = systemUsers.find(u => u.name === currentUserName || (u.active !== false && String(u.pin).trim() === loginInputPin));
    if (!userObj || !userObj.permissions) {
        return section === 'dailyReport';
    }
    return !!userObj.permissions[section];
};

// رمز مدير محلي خاص بهذا الجهاز وحده — لا يوجد رمز مشترك بين النسخ (النسخة الأوفلاين معزولة تماماً)
// رمز مدير ثابت افتراضياً (1975) بدل التوليد العشوائي لكل جهاز، لكنه قابل للتغيير من
// نافذة إدارة الحسابات (وليس مكتوباً حرفياً في كود الصفحة كسرّ دائم) — يُحفظ محلياً.
const getLocalOfflineAdminPin = () => {
    return safeStorage.getItem('localOfflineAdminPin') || '1975';
};

const updateLocalOfflineAdminPin = (newPin) => {
    const p = String(newPin || '').trim();
    if (!/^\d{4}$/.test(p)) {
        alert('⛔ يجب أن يتكوّن الرمز من 4 أرقام بالضبط.');
        return;
    }
    safeStorage.setItem('localOfflineAdminPin', p);
    alert('✅ تم تحديث رمز مدير هذا الجهاز.');
};

const isAdminPin = (pin) => {
    if (!pin) return false;
    const p = String(pin).trim();
    const matchedUser = systemUsers.find(u => u.active !== false && u.pin && String(u.pin).trim() === p && u.role === 'admin');
    if (matchedUser) return true;
    return p === getLocalOfflineAdminPin();
};

const isOperatorPin = (pin) => {
    if (!pin) return false;
    const p = String(pin).trim();
    const matchedUser = systemUsers.find(u => u.active !== false && String(u.pin).trim() === p && (u.role === 'operator' || u.role === 'admin'));
    return !!matchedUser;
};

const handleOpenUserManagement = () => {
    if (currentUserRole === 'admin') {
        setShowUserManagementModal(true);
    } else {
        const pin = prompt('🔐 فتح إدارة الحسابات والصلاحيات:\\n\\nيرجى إدخال كلمة المرور (PIN) الخاصة بمدير النظام:');
        if (isAdminPin(pin)) {
            setCurrentUserRole('admin');
            const adminUser = systemUsers.find(u => u.role === 'admin') || { name: 'أسامة خليل (مدير النظام)' };
            setCurrentUserName(adminUser.name);
            setShowUserManagementModal(true);
        } else if (pin !== null) {
            alert('❌ كلمة المرور غير صحيحة!');
        }
    }
};

const [currentUserRole, setCurrentUserRole] = useState(null);
const [pendingDeletionRequest, setPendingDeletionRequest] = useState(() => {
    const saved = safeStorage.getItem('pendingDeletionRequest');
    return saved ? JSON.parse(saved) : null;
});
React.useEffect(() => {
    if (pendingDeletionRequest) {
        safeStorage.setItem('pendingDeletionRequest', JSON.stringify(pendingDeletionRequest));
    } else {
        safeStorage.removeItem('pendingDeletionRequest');
    }
}, [pendingDeletionRequest]);

const FIREBASE_DB_URL = "";
const FIREBASE_BACKUPS_URL = "";
const FIREBASE_SESSIONS_URL = "";
const currentSessionIdRef = React.useRef(null);
const currentUserIdRef = React.useRef(null);
const [activeSessions, setActiveSessions] = useState({});
const [isCheckingLogin, setIsCheckingLogin] = useState(false);

// حالات مركز الاستعادة والأرشيف الزمني السحابي (Time-Machine Restore Center)
const [showRestoreCenterModal, setShowRestoreCenterModal] = useState(false);
const [availableSnapshots, setAvailableSnapshots] = useState([]);
const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
const [selectedSnapshotPreview, setSelectedSnapshotPreview] = useState(null);
const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);

const [loginInputRole, setLoginInputRole] = useState('operator');
const [loginInputPin, setLoginInputPin] = useState('');
const [loginError, setLoginError] = useState('');
// الوضع الليلي محفوظ على <html> ويُطبَّق قبل تحميل React؛ هذه الحالة لأيقونة الزر فقط
const [isDarkTheme, setIsDarkTheme] = useState(() => {
    try { return document.documentElement.getAttribute('data-theme') === 'dark'; } catch (e) { return false; }
});

const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    const inputPin = loginInputPin.trim();
    if (inputPin === undefined || inputPin === null) return;

    setIsCheckingLogin(true);

    // جلب أحدث قائمة مستخدمين مباشرة من السحابة لضمان الدقة وتفادي أي كاش محلي
    let currentUsers = systemUsers;
    try {
        const freshRes = await fetch(FIREBASE_DB_URL + '?t=' + Date.now(), {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (freshRes.ok) {
            const freshBundle = await freshRes.json();
            if (freshBundle && freshBundle.systemUsersList && Array.isArray(freshBundle.systemUsersList) && freshBundle.systemUsersList.length > 0) {
                currentUsers = freshBundle.systemUsersList;
                setSystemUsers(freshBundle.systemUsersList);
                safeStorage.setItem('systemUsersList', JSON.stringify(freshBundle.systemUsersList));
                if (freshBundle.staffData) {
                    applyDataBundleToState(freshBundle);
                }
            }
        }
    } catch (err) {
        console.warn("Live user fetch error during login:", err);
    }

    // 1. تحديد المستخدم المستهدف من القائمة السحابية الحية
    let targetUser = currentUsers.find(u => u.active !== false && String(u.pin).trim() === inputPin);
    if (!targetUser) {
        if (inputPin === getLocalOfflineAdminPin()) {
            targetUser = currentUsers.find(u => u.role === 'admin') || { id: 'usr_1', name: 'أسامة خليل (مدير النظام)', role: 'admin' };
        } else if (inputPin === '' || inputPin === '1234') {
            targetUser = { id: 'usr_viewer', name: 'مستعرض عام', role: 'viewer' };
        }
    }

    if (!targetUser) {
        setIsCheckingLogin(false);
        setLoginError('❌ كلمة المرور غير صحيحة!');
        return;
    }

    // 2. فحص هل الحساب مستخدم حالياً من جهاز آخر (قفل الجلسة الفردية لمنع التزامن)
    if (targetUser.role !== 'viewer') {
        try {
            const sessRes = await fetch(`${FIREBASE_SESSIONS_URL}/${targetUser.id}.json?t=${Date.now()}`);
            if (sessRes.ok) {
                const sessData = await sessRes.json();
                if (sessData && sessData.sessionId && sessData.lastSeen) {
                    const elapsed = Date.now() - sessData.lastSeen;
                    // إذا كانت الجلسة نشطة (خلال آخر 15 ثانية) ومن جلسة مختلفة
                    if (elapsed < 15000 && sessData.sessionId !== currentSessionIdRef.current) {
                        setIsCheckingLogin(false);
                        setLoginError(`⛔ هذا الحساب (${targetUser.name}) قيد الاستخدام حالياً من جهاز آخر!\nلا يمكن لشخصين تسجيل الدخول بنفس كلمة المرور في آن واحد.\n(يرجى تسجيل الخروج من الجهاز الآخر أولاً، أو الانتظار 15 ثانية في حال إغلاق المتصفح).`);
                        return;
                    }
                }
            }
        } catch (err) {
            console.warn("Session check error:", err);
        }
    }

    // 3. حجز الجلسة الفردية للجهاز الحالي
    const newSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
    currentSessionIdRef.current = newSessionId;
    currentUserIdRef.current = targetUser.id;

    if (targetUser.role !== 'viewer') {
        try {
            await fetch(`${FIREBASE_SESSIONS_URL}/${targetUser.id}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: newSessionId,
                    userId: targetUser.id,
                    name: targetUser.name,
                    role: targetUser.role,
                    lastSeen: Date.now()
                })
            });
        } catch (e) {}
    }

    setCurrentUserRole(targetUser.role);
    setCurrentUserName(targetUser.name);
    // لا نُعيّن dataEntryOperator تلقائياً هنا — حقل "اسم منظم الموقف" مشترك بين كل
    // الأجهزة على الشبكة المحلية، لا حالة دخول شخصية. كان يُستبدَل باسم كل من يسجّل
    // الدخول من أي جهاز فيُبعث للجميع، فيرى إداري اسم زميله يحل محل اسمه على شاشته
    // (نُقل نفس الإصلاح من index.html — انظر التعليق المقابل هناك).
    setIsCheckingLogin(false);
    setShowWelcome(false);
    setLoginInputPin('');
    setShowLoginModal(false);
};

const handleLogout = () => {
    if (currentUserIdRef.current) {
        const uid = currentUserIdRef.current;
        try {
            fetch(`${FIREBASE_SESSIONS_URL}/${uid}.json`, { method: 'DELETE' });
        } catch (e) {}
    }
    currentUserIdRef.current = null;
    currentSessionIdRef.current = null;
    setCurrentUserRole(null);
    setCurrentUserName('');
};

// فحص نبض الجلسة النشطة وطرد الجلسات في حال تسجيل الدخول من مكان آخر
React.useEffect(() => {
    if (!currentUserRole || !currentUserIdRef.current || !currentSessionIdRef.current || currentUserRole === 'viewer') return;
    const uid = currentUserIdRef.current;
    const sid = currentSessionIdRef.current;

    const heartbeat = async () => {
        try {
            const checkRes = await fetch(`${FIREBASE_SESSIONS_URL}/${uid}.json?t=${Date.now()}`);
            if (checkRes.ok) {
                const sessData = await checkRes.json();
                if (sessData && sessData.sessionId && sessData.sessionId !== sid) {
                    alert('⚠️ تنبيه أمني: تم تسجيل الدخول إلى هذا الحساب من جهاز آخر أو تم فك القفل من قبل مدير النظام. تم إنهاء جلستك على هذا الجهاز.');
                    handleLogout();
                    return;
                }
            }
            await fetch(`${FIREBASE_SESSIONS_URL}/${uid}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sid,
                    userId: uid,
                    name: currentUserName,
                    role: currentUserRole,
                    lastSeen: Date.now()
                })
            });
        } catch (e) {}
    };

    const interval = setInterval(heartbeat, 5000);
    return () => clearInterval(interval);
}, [currentUserRole, currentUserName]);

// تحرير الجلسة عند إغلاق المتصفح أو التبويب
React.useEffect(() => {
    const handleBeforeUnload = () => {
        if (currentUserIdRef.current) {
            fetch(`${FIREBASE_SESSIONS_URL}/${currentUserIdRef.current}.json`, {
                method: 'DELETE',
                keepalive: true
            });
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);

// جلب حالة الجلسات النشطة للمستخدمين عند فتح شاشة إدارة المستخدمين
React.useEffect(() => {
    if (!showUserManagementModal) return;
    const fetchSessions = async () => {
        try {
            const res = await fetch(`${FIREBASE_SESSIONS_URL}.json?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setActiveSessions(data || {});
            }
        } catch (e) {}
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
}, [showUserManagementModal]);

const handleForceEvictSession = async (userId, userName) => {
    if (!confirm(`⚠️ هل أنت متأكد من فك قفل وإنهاء جلسة المستخدم (${userName})؟\nسيتم تحرير الحساب فوراً ليتمكن من تسجيل الدخول من أي جهاز جديد.`)) return;
    try {
        await fetch(`${FIREBASE_SESSIONS_URL}/${userId}.json`, { method: 'DELETE' });
        setActiveSessions(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
        });
        showCustomAlert(`✅ تم فك قفل جلسة (${userName}) بنجاح!`, 'success');
    } catch (err) {
        alert('❌ خطأ في فك القفل: ' + err.message);
    }
};

const handleSaveUser = (e) => {
    if (e) e.preventDefault();
    const name = userFormName.trim();
    const pin = userFormPin.trim();
    if (!name) {
        alert('⚠️ يرجى إدخال اسم المستخدم!');
        return;
    }
    if (!pin) {
        alert('⚠️ يرجى إدخال كلمة المرور / رمز الدخول!');
        return;
    }

    const existingWithPin = systemUsers.find(u => String(u.pin).trim() === pin && u.id !== editingUserId);
    if (existingWithPin) {
        alert(`⚠️ كلمة المرور (${pin}) مستخدمة بالفعل للمستخدم (${existingWithPin.name})!\nيرجى اختيار كلمة مرور فريدة.`);
        return;
    }

    let updatedUsers;
    const permsToSave = userFormRole === 'admin' 
        ? { dailyReport: true, staffMaster: true, safety: true, evaluation: true }
        : userFormRole === 'viewer'
            ? { dailyReport: false, staffMaster: false, safety: false, evaluation: false }
            : userFormPerms;

    if (editingUserId) {
        updatedUsers = systemUsers.map(u => u.id === editingUserId ? { ...u, name, role: userFormRole, pin, permissions: permsToSave } : u);
        alert(`✅ تم تحديث بيانات وصلاحيات المستخدم (${name}) بنجاح!`);
    } else {
        const newUser = {
            id: 'usr_' + Date.now(),
            name,
            role: userFormRole,
            pin,
            permissions: permsToSave,
            active: true,
            createdAt: new Date().toLocaleDateString('ar-IQ')
        };
        updatedUsers = [...systemUsers, newUser];
        alert(`✅ تم إضافة المستخدم الجديد (${name}) بالصلاحيات المحددة بنجاح!`);
    }

    setSystemUsers(updatedUsers);
    safeStorage.setItem('systemUsersList', JSON.stringify(updatedUsers));
    pushDataToCloud({
        staffData: staff,
        systemUsersList: updatedUsers,
        officialHolidaysList: officialHolidays,
        hourlyLeaveRecords: hourlyLeaveRecords,
        overtimeHoursRecords: overtimeHoursRecords,
        dailyStatusOverrides: dailyStatusOverrides,
        shiftAnchorDate: anchorDate,
        threeShiftAnchorSquad: threeShiftAnchorSquad,
        twoShiftAnchorSquad: twoShiftAnchorSquad,
        dataEntryOperator: dataEntryOperator,
        overtimeSelectedIds: overtimeIds,
        lastCloudUpdate: new Date().toISOString(),
        pendingDeletionRequest: pendingDeletionRequest
    });

    setEditingUserId(null);
    setUserFormName('');
    setUserFormRole('operator');
    setUserFormPin('');
    setUserFormPerms({
        dailyReport: true,
        staffMaster: false,
        safety: false,
        evaluation: false
    });
};

const handleEditUserClick = (u) => {
    setEditingUserId(u.id);
    setUserFormName(u.name);
    setUserFormRole(u.role);
    setUserFormPin(u.pin);
    setUserFormPerms(u.permissions || {
        dailyReport: true,
        staffMaster: u.role === 'admin',
        safety: u.role === 'admin',
        evaluation: u.role === 'admin'
    });
    // تمرير الشاشة فورياً وسلساً للأعلى إلى حقول التعديل والتركيز عليها تلقائياً
    setTimeout(() => {
        const scrollContainer = document.getElementById('userModalScrollBody');
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
        const pinInput = document.getElementById('userFormPinInput');
        if (pinInput) {
            pinInput.focus();
            pinInput.select();
        }
    }, 40);
};

const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setUserFormName('');
    setUserFormRole('operator');
    setUserFormPin('');
    setUserFormPerms({
        dailyReport: true,
        staffMaster: false,
        safety: false,
        evaluation: false
    });
};

const handleDeleteUser = (userId) => {
    const userToDelete = systemUsers.find(u => u.id === userId);
    if (!userToDelete) return;
    if (systemUsers.filter(u => u.role === 'admin' && u.active !== false).length <= 1 && userToDelete.role === 'admin') {
        alert('⛔ لا يمكن حذف مدير النظام الوحيد في النظام!');
        return;
    }
    if (!confirm(`⚠️ هل أنت متأكد من حذف المستخدم (${userToDelete.name}) نهائياً؟`)) return;

    const updatedUsers = systemUsers.filter(u => u.id !== userId);
    setSystemUsers(updatedUsers);
    safeStorage.setItem('systemUsersList', JSON.stringify(updatedUsers));
    pushDataToCloud({
        staffData: staff,
        systemUsersList: updatedUsers,
        officialHolidaysList: officialHolidays,
        hourlyLeaveRecords: hourlyLeaveRecords,
        overtimeHoursRecords: overtimeHoursRecords,
        dailyStatusOverrides: dailyStatusOverrides,
        shiftAnchorDate: anchorDate,
        threeShiftAnchorSquad: threeShiftAnchorSquad,
        twoShiftAnchorSquad: twoShiftAnchorSquad,
        dataEntryOperator: dataEntryOperator,
        overtimeSelectedIds: overtimeIds,
        lastCloudUpdate: new Date().toISOString(),
        pendingDeletionRequest: pendingDeletionRequest
    });
    if (editingUserId === userId) handleCancelUserEdit();
    alert(`✅ تم حذف المستخدم (${userToDelete.name}) بنجاح.`);
};

const handleToggleUserActive = (userId) => {
    const userToToggle = systemUsers.find(u => u.id === userId);
    if (!userToToggle) return;
    if (userToToggle.role === 'admin' && userToToggle.active !== false && systemUsers.filter(u => u.role === 'admin' && u.active !== false).length <= 1) {
        alert('⛔ لا يمكن تعطيل حساب مدير النظام الفعال الوحيد!');
        return;
    }
    const updatedUsers = systemUsers.map(u => u.id === userId ? { ...u, active: !(u.active !== false) } : u);
    setSystemUsers(updatedUsers);
    safeStorage.setItem('systemUsersList', JSON.stringify(updatedUsers));
    pushDataToCloud({
        staffData: staff,
        systemUsersList: updatedUsers,
        officialHolidaysList: officialHolidays,
        hourlyLeaveRecords: hourlyLeaveRecords,
        overtimeHoursRecords: overtimeHoursRecords,
        dailyStatusOverrides: dailyStatusOverrides,
        shiftAnchorDate: anchorDate,
        threeShiftAnchorSquad: threeShiftAnchorSquad,
        twoShiftAnchorSquad: twoShiftAnchorSquad,
        dataEntryOperator: dataEntryOperator,
        overtimeSelectedIds: overtimeIds,
        lastCloudUpdate: new Date().toISOString(),
        pendingDeletionRequest: pendingDeletionRequest
    });
};

const isViewer = currentUserRole === 'viewer';

const [syncStatus, setSyncStatus] = useState({
    connected: false,
    ip: '',
    port: 8000,
    version: 0,
    lastUpdated: '',
    isSyncing: false
});
                        // ===== محرك المزامنة السحابية الحية الرسمي (Google Firebase Realtime DB) =====
const [cloudSyncStatus, setCloudSyncStatus] = useState({ connected: true, syncing: false, lastSync: null });
const lastCloudTimeRef = React.useRef(null);
const isInitialCloudLoadCompleteRef = React.useRef(false);

// جلب البيانات السحابية الحية فورياً وتحديث كافة الأجهزة
const fetchCloudData = async () => {
    if (window.location.protocol === 'file:' || !FIREBASE_DB_URL) {
        setCloudSyncStatus({ connected: false, syncing: false, lastSync: 'أوفلاين محلي مستقل' });
        isInitialCloudLoadCompleteRef.current = true;
        return;
    }
    try {
        setCloudSyncStatus(prev => ({ ...prev, syncing: true }));
        const res = await fetch(FIREBASE_DB_URL + '?t=' + Date.now(), {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
            const cloudData = await res.json();
            if (cloudData && typeof cloudData === 'object') {
                if (cloudData.lastCloudUpdate) {
                    const cloudTime = new Date(cloudData.lastCloudUpdate).getTime();
                    const localTime = lastCloudTimeRef.current ? new Date(lastCloudTimeRef.current).getTime() : 0;
                    // تحديث الحالة فقط إذا كانت البيانات السحابية أحدث من آخر تعديل محلي
                    if (!lastCloudTimeRef.current || cloudTime > localTime) {
                        // الختم يتقدّم فقط مع تطبيق ناجح فعلي — لا مجرد رؤيته (نُقل نفس
                        // الإصلاح من index.html؛ انظر التعليق المقابل هناك)
                        if (cloudData.staffData && Array.isArray(cloudData.staffData) && cloudData.staffData.length > 0) {
                            lastCloudTimeRef.current = cloudData.lastCloudUpdate;
                            applyDataBundleToState(cloudData);
                        }
                    }
                }
                setCloudSyncStatus({ connected: true, syncing: false, lastSync: new Date().toLocaleTimeString('ar-IQ') });
            }
        } else {
            setCloudSyncStatus(prev => ({ ...prev, connected: true, syncing: false }));
        }
    } catch (err) {
        setCloudSyncStatus(prev => ({ ...prev, connected: true, syncing: false }));
    } finally {
        isInitialCloudLoadCompleteRef.current = true;
    }
};

// بث التعديلات مباشرة إلى السحابة الحية لتنعكس لدى الجميع في نفس اللحظة
const pushDataToCloud = async (bundle = null) => {
    // 1. حظر تام وقاطع لأي مزامنة سحابية إذا كان الملف يعمل كـ أوفلاين محلي (file://) أو تم إلغاء رابط السحابة
    if (window.location.protocol === 'file:' || !FIREBASE_DB_URL) {
        return;
    }
    // 2. منع رفع الكاش المحلي القديم إلى السحابة قبل إتمام الجلب الأولي للبيانات السحابية
    if (!isInitialCloudLoadCompleteRef.current && !bundle) {
        return;
    }
    try {
        setCloudSyncStatus(prev => ({ ...prev, syncing: true }));
        const nowIso = (bundle && bundle.lastCloudUpdate) ? bundle.lastCloudUpdate : new Date().toISOString();
        lastCloudTimeRef.current = nowIso;
        const dataPayload = bundle ? { ...bundle, lastCloudUpdate: nowIso } : {
            staffData: staff,
            systemUsersList: systemUsers,
            officialHolidaysList: officialHolidays,
            hourlyLeaveRecords: hourlyLeaveRecords,
            overtimeHoursRecords: overtimeHoursRecords,
            dailyStatusOverrides: dailyStatusOverrides,
            shiftAnchorDate: anchorDate,
            threeShiftAnchorSquad: threeShiftAnchorSquad,
            twoShiftAnchorSquad: twoShiftAnchorSquad,
            dataEntryOperator: dataEntryOperator,
            overtimeSelectedIds: overtimeIds,
            lastCloudUpdate: nowIso,
            pendingDeletionRequest: pendingDeletionRequest
        };

        // بث سريع مباشر عبر fetch بدون keepalive (لتفادي حظر المتصفح للحزم الأكبر من 64KB)
        const res = await fetch(FIREBASE_DB_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataPayload)
        });
        if (res.ok) {
            setCloudSyncStatus({ connected: true, syncing: false, lastSync: new Date().toLocaleTimeString('ar-IQ') });
        }

        // 3. حفظ لقطة أرشيفية تلقائية يومية غير قابلة للإلغاء في الأرشيف السحابي (Immutable Daily Snapshot)
        try {
            const todayKey = nowIso.split('T')[0];
            const snapshotPayload = {
                date: todayKey,
                timestamp: nowIso,
                savedBy: currentUserName || (currentUserRole === 'admin' ? 'مدير النظام' : 'إداري الشعبة'),
                staffCount: (dataPayload.staffData || []).length,
                overridesCount: Object.keys(dataPayload.dailyStatusOverrides || {}).length,
                bundle: dataPayload
            };
            fetch(`${FIREBASE_BACKUPS_URL}/${todayKey}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(snapshotPayload)
            }).catch(() => {});

            // حفظ لقطة دورية في المتصفح المحلي
            try {
                const localSnapshots = JSON.parse(safeStorage.getItem('localDailySnapshots') || '{}');
                localSnapshots[todayKey] = snapshotPayload;
                const keys = Object.keys(localSnapshots).sort();
                if (keys.length > 20) {
                    keys.slice(0, keys.length - 20).forEach(k => delete localSnapshots[k]);
                }
                safeStorage.setItem('localDailySnapshots', JSON.stringify(localSnapshots));
            } catch(e) {}
        } catch(snapErr) {}
    } catch (err) {
        console.warn("Could not push to Firebase Cloud:", err);
    }
};

// جلب قائمة اللقطات والنسخ الاحتياطية السحابية والمحلية المتاحة (Time-Machine Snapshots Fetcher)
const fetchAvailableSnapshots = async () => {
    setIsLoadingSnapshots(true);
    let list = [];
    try {
        if (FIREBASE_BACKUPS_URL && window.location.protocol !== 'file:') {
            const res = await fetch(`${FIREBASE_BACKUPS_URL}.json?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data && typeof data === 'object') {
                    list = Object.keys(data).map(k => ({
                        date: k,
                        timestamp: data[k].timestamp || k,
                        savedBy: data[k].savedBy || 'إداري النظام',
                        staffCount: data[k].staffCount || (data[k].bundle && data[k].bundle.staffData ? data[k].bundle.staffData.length : 0),
                        overridesCount: data[k].overridesCount || (data[k].bundle && data[k].bundle.dailyStatusOverrides ? Object.keys(data[k].bundle.dailyStatusOverrides).length : 0),
                        bundle: data[k].bundle || data[k]
                    }));
                }
            }
        }
    } catch (err) {
        console.warn("Could not fetch cloud backups:", err);
    }

    // دمج النسخ الاحتياطية المحلية
    try {
        const localSnapshots = JSON.parse(safeStorage.getItem('localDailySnapshots') || '{}');
        Object.keys(localSnapshots).forEach(k => {
            if (!list.some(s => s.date === k)) {
                list.push({
                    date: k,
                    timestamp: localSnapshots[k].timestamp || k,
                    savedBy: localSnapshots[k].savedBy || 'محلي',
                    staffCount: localSnapshots[k].staffCount || 0,
                    overridesCount: localSnapshots[k].overridesCount || 0,
                    bundle: localSnapshots[k].bundle || localSnapshots[k]
                });
            }
        });
    } catch(e) {}

    list.sort((a, b) => b.date.localeCompare(a.date));
    setAvailableSnapshots(list);
    setIsLoadingSnapshots(false);
};

// استعادة وتثبيت لقطة تاريخية معتمدة (Point-in-Time Restore)
const handleRestoreSnapshot = async (snapshot) => {
    if (currentUserRole !== 'admin') {
        alert('⛔ عذراً، ميزة استعادة البيانات مخصصة حصرياً لمدير النظام 👑');
        return;
    }
    const adminPin = prompt(`🔐 يتطلب استرجاع نسخة يوم [${snapshot.date}] إدخال رمز مدير النظام للتأكيد:`);
    if (!isAdminPin(adminPin)) {
        alert('❌ رمز الدخول غير صحيح! تم إلغاء عملية الاستعادة للأمان.');
        return;
    }
    const confirmMsg = `⚠️ تأكيد نهائي لاستعادة بيانات يوم: ${snapshot.date}\n\nسيتم تطبيق نسخة هذا اليوم (التي تحتوي على ${snapshot.staffCount} موظف و ${snapshot.overridesCount} أيام مواقف) واعتمادها كقاعدة حية.\n\nهل تريد المتابعة؟`;
    if (!confirm(confirmMsg)) return;

    setIsRestoringSnapshot(true);
    try {
        const bundle = snapshot.bundle;
        applyDataBundleToState(bundle);
        // اللقطات القديمة (قبل إصلاح 2026-09-18) لا تحوي حسابات المستخدمين أصلاً؛
        // بثّ bundle كما هو كان يمحو حسابات النظام الحية سحابياً. الحسابات الحالية
        // تبقى كما هي دائماً هنا — الاستعادة تخص بيانات الملاك والمواقف لا الحسابات.
        await pushDataToCloud({ ...bundle, systemUsersList: systemUsers, lastCloudUpdate: new Date().toISOString() });
        alert(`✅ تم بنجاح استعادة وتثبيت نسخة يوم [${snapshot.date}] وتعميمها على السحابة!`);
        setShowRestoreCenterModal(false);
    } catch (err) {
        alert(`❌ حدث خطأ أثناء الاستعادة: ${err.message}`);
    } finally {
        setIsRestoringSnapshot(false);
    }
};

// تنزيل ملف لقطة احتياطية بصيغة JSON
const handleDownloadSnapshot = (snapshot) => {
    const jsonStr = JSON.stringify(snapshot.bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_احتياطية_ملاك_${snapshot.date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

React.useEffect(() => {
    // السماح بأدوات المطورين F12 وفحص النظام حصرياً لمدير النظام (Admin)
    if (currentUserRole === 'admin') {
        window.__IS_ADMIN_DEV_UNLOCKED = true;
    } else {
        window.__IS_ADMIN_DEV_UNLOCKED = false;
    }
}, [currentUserRole]);

// بدء المزامنة السحابية الحية فور فتح التطبيق
React.useEffect(() => {
    fetchCloudData();
    const interval = setInterval(fetchCloudData, 5000);
    return () => clearInterval(interval);
}, []);

// استطلاع فوري عند عودة التبويب للظهور بعد إبطاء المتصفح لمؤقتاته في الخلفية
// (نُقل نفس الإصلاح من index.html؛ انظر التعليق المقابل هناك)
React.useEffect(() => {
    const onVisible = () => {
        if (document.visibilityState === 'visible') fetchCloudData();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
}, []);
const serverVersionRef = React.useRef(0);
const isSyncingRef = React.useRef(false);

// بث التحديثات إلى السيرفر المحلي والسحابة الحية
const pushDataToServer = async (customBundle = null) => {
    const bundle = customBundle || {
        staffData: staff,
        systemUsersList: systemUsers,
        officialHolidaysList: officialHolidays,
        hourlyLeaveRecords: hourlyLeaveRecords,
        overtimeHoursRecords: overtimeHoursRecords,
        dailyStatusOverrides: dailyStatusOverrides,
        shiftAnchorDate: anchorDate,
        threeShiftAnchorSquad: threeShiftAnchorSquad,
        twoShiftAnchorSquad: twoShiftAnchorSquad,
        dataEntryOperator: dataEntryOperator,
        overtimeSelectedIds: overtimeIds,
        lastCloudUpdate: new Date().toISOString()
    };

    // بث إلى السحابة الحية دائماً فوراً وبشكل أولي (Firebase Cloud DB)
    try {
        await pushDataToCloud(bundle);
    } catch (cErr) {
        console.warn("Cloud push error:", cErr);
    }

    // بث إلى السيرفر المحلي فقط في حال التشغيل على الشبكة المحلية
    if (!window.location.hostname.includes('github.io') && window.location.protocol !== 'file:') {
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: bundle })
            });
            if (res.ok) {
                const resData = await res.json();
                if (resData.success) {
                    serverVersionRef.current = resData.version;
                    setSyncStatus(prev => ({
                        ...prev,
                        connected: true,
                        version: resData.version,
                        lastUpdated: resData.last_updated
                    }));
                }
            }
        } catch (err) {
            setSyncStatus(prev => ({ ...prev, connected: false }));
        }
    }
};

// تطبيق حزمة البيانات المجلوبة من السيرفر على React State
const applyDataBundleToState = (bundle) => {
    if (!bundle || typeof bundle !== 'object') return;
    isSyncingRef.current = true;
    if (bundle.staffData && Array.isArray(bundle.staffData)) {
        setStaff(bundle.staffData);
        safeStorage.setItem('staffData', JSON.stringify(bundle.staffData));
    }
    if (bundle.systemUsersList && Array.isArray(bundle.systemUsersList) && bundle.systemUsersList.length > 0) {
        setSystemUsers(bundle.systemUsersList);
        safeStorage.setItem('systemUsersList', JSON.stringify(bundle.systemUsersList));
    }
    if (bundle.officialHolidaysList && Array.isArray(bundle.officialHolidaysList)) {
        let holidays = [...bundle.officialHolidaysList];
        if (!holidays.includes('2026-08-25')) {
            holidays.push('2026-08-25');
        }
        setOfficialHolidays(holidays);
        safeStorage.setItem('officialHolidaysList', JSON.stringify(holidays));
    }
    if (bundle.hourlyLeaveRecords) {
        setHourlyLeaveRecords(bundle.hourlyLeaveRecords);
        safeStorage.setItem('hourlyLeaveRecords', JSON.stringify(bundle.hourlyLeaveRecords));
    }
    if (bundle.overtimeHoursRecords) {
        setOvertimeHoursRecords(bundle.overtimeHoursRecords);
        safeStorage.setItem('overtimeHoursRecords', JSON.stringify(bundle.overtimeHoursRecords));
    }
    if (bundle.dailyStatusOverrides && typeof bundle.dailyStatusOverrides === 'object') {
        setDailyStatusOverrides(prev => {
            const merged = { ...(prev || {}), ...bundle.dailyStatusOverrides };
            safeStorage.setItem('dailyStatusOverrides', JSON.stringify(merged));
            return merged;
        });
    }
    if (bundle.shiftAnchorDate) {
        setAnchorDate(bundle.shiftAnchorDate);
        safeStorage.setItem('shiftAnchorDate', bundle.shiftAnchorDate);
    }
    if (bundle.threeShiftAnchorSquad) {
        setThreeShiftAnchorSquad(bundle.threeShiftAnchorSquad);
        safeStorage.setItem('threeShiftAnchorSquad', bundle.threeShiftAnchorSquad);
    }
    if (bundle.twoShiftAnchorSquad) {
        setTwoShiftAnchorSquad(bundle.twoShiftAnchorSquad);
        safeStorage.setItem('twoShiftAnchorSquad', bundle.twoShiftAnchorSquad);
    }
    if (bundle.dataEntryOperator) {
        setDataEntryOperator(bundle.dataEntryOperator);
        safeStorage.setItem('dataEntryOperator', bundle.dataEntryOperator);
    }
    if (bundle.pendingDeletionRequest !== undefined) {
        setPendingDeletionRequest(bundle.pendingDeletionRequest);
        if (bundle.pendingDeletionRequest) {
            safeStorage.setItem('pendingDeletionRequest', JSON.stringify(bundle.pendingDeletionRequest));
        } else {
            safeStorage.removeItem('pendingDeletionRequest');
        }
    }
    if (bundle.overtimeSelectedIds) {
        setOvertimeIds(bundle.overtimeSelectedIds);
        safeStorage.setItem('overtimeSelectedIds', JSON.stringify(bundle.overtimeSelectedIds));
    }
    setTimeout(() => { isSyncingRef.current = false; }, 500);
};

// المزامنة التلقائية والفحص الدوري (Polling) كل 3 ثوانٍ
React.useEffect(() => {
    let isMounted = true;
    const checkServerAndSync = async () => {
        if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:') {
            return; // لا تبحث عن /api/status عندما تكون على استضافة GitHub Pages
        }
        try {
            const statusRes = await fetch('/api/status?t=' + Date.now());
            if (statusRes.ok) {
                const statusJson = await statusRes.json();
                if (!isMounted) return;
                
                setSyncStatus(prev => ({
                    ...prev,
                    connected: true,
                    ip: statusJson.ip,
                    port: statusJson.port,
                    version: statusJson.version,
                    lastUpdated: statusJson.last_updated
                }));

                if (statusJson.version > serverVersionRef.current) {
                    const syncRes = await fetch('/api/sync?t=' + Date.now());
                    if (syncRes.ok) {
                        const syncJson = await syncRes.json();
                        serverVersionRef.current = syncJson.version;
                        if (syncJson.data && Object.keys(syncJson.data).length > 0) {
                            applyDataBundleToState(syncJson.data);
                        } else {
                            pushDataToServer();
                        }
                    }
                }
            } else {
                if (isMounted) setSyncStatus(prev => ({ ...prev, connected: false }));
            }
        } catch (e) {
            if (isMounted) setSyncStatus(prev => ({ ...prev, connected: false }));
        }
    };

    checkServerAndSync();
    const interval = setInterval(checkServerAndSync, 3000);
    return () => {
        isMounted = false;
        clearInterval(interval);
    };
}, []);

// بث التغييرات عند تعديل أي بيانات في النظام
React.useEffect(() => {
    if (!isSyncingRef.current && syncStatus.connected) {
        pushDataToServer();
    }
}, [staff, officialHolidays, hourlyLeaveRecords, overtimeHoursRecords, dailyStatusOverrides, anchorDate, dataEntryOperator]);


// ===== بوابات الإجراءات الحسّاسة =====
// نصّ الجسم المشترك واحد: `if (!authorizeX()) return;`. صيغة الإذن تختلف بالنسخة فتبقى
// هنا في طبقة كل نسخة: الأوفلاين ترمز مدير محلي من أربعة أرقام، والسحابية دور الحساب
// الموثّق. الرسائل والسلوك منقولة حرفياً كما كانت في الجسم قبل الدمج.
const authorizeEmployeeDelete = () => {
    const adminPin = prompt('🔐 يتطلب حذف الموظف إدخال الرمز السري للإداري:');
    if (!isAdminPin(adminPin)) {
        alert('❌ الرمز السري غير صحيح! تم إلغاء عملية الحذف للحماية.');
        return false;
    }
    return true;
};
const authorizeDirectWipe = () => {
    const adminPin = prompt('🔐 تأكيد الحذف المباشر: يرجى إدخال الرمز السري لمدير النظام:');
    if (!isAdminPin(adminPin)) {
        alert('❌ الرمز السري غير صحيح! تم إلغاء العملية للحماية والأمان.');
        return false;
    }
    return true;
};
const authorizeWipeApproval = () => {
    const pin = prompt('🔐 تأكيد الموافقة على الحذف: أدخل الرمز السري لمدير النظام:');
    if (!isAdminPin(pin)) {
        alert('❌ الرمز السري غير صحيح!');
        return false;
    }
    return confirm('⚠️ هل توافق رسمياً على تنفيذ طلب الحذف ومسح كافة البيانات سحابياً؟');
};

// مفتاح جلسة المستخدم في activeSessions: المعرّف المحلي هنا، ومعرّف الحساب الموثّق سحابياً.
const sessionKeyFor = (u) => u.id;
// لا تمييز لصاحب الجلسة في جدول المستخدمين هنا: زر فك القفل يظهر لكل صف كما كان.
const isSelfUser = () => false;

// لا سجل تدقيق ولا قفل أقسام ولا حزمة سحابية في هذه النسخة. قيم خاملة تُبقي نصّ الجسم
// المشترك واحداً بلا شرط، وسلوك الأوفلاين كما هو: pushDataToCloud يعود فوراً هنا أصلاً.
const logAuditEvent = () => {};
const buildCloudBundle = (partial) => partial;
const lockedSections = EMPTY_LOCKED_SECTIONS;
const showSyncModal = false;
const setShowSyncModal = () => {};

  return {
    activeSessions,
    authorizeDirectWipe,
    authorizeEmployeeDelete,
    authorizeWipeApproval,
    availableSnapshots,
    buildCloudBundle,
    canEdit,
    currentUserIdRef,
    currentUserName,
    currentUserRole,
    editingUserId,
    fb_DB_URL: FIREBASE_DB_URL,
    fetchAvailableSnapshots,
    getLocalOfflineAdminPin,
    handleCancelUserEdit,
    handleDeleteUser,
    handleDownloadSnapshot,
    handleEditUserClick,
    handleForceEvictSession,
    handleLogin,
    handleLogout,
    handleOpenUserManagement,
    handleRestoreSnapshot,
    handleSaveUser,
    handleToggleUserActive,
    isAdminPin,
    isCheckingLogin,
    isDarkTheme,
    isInitialCloudLoadCompleteRef,
    isLoadingSnapshots,
    isSyncingRef,
    isSelfUser,
    lockedSections,
    logAuditEvent,
    loginError,
    loginInputPin,
    pendingDeletionRequest,
    pushDataToCloud,
    revealedPinUsers,
    selectedSnapshotPreview,
    sessionKeyFor,
    setCurrentUserRole,
    setIsDarkTheme,
    setLoginInputPin,
    setPendingDeletionRequest,
    setRevealedPinUsers,
    setSelectedSnapshotPreview,
    setShowRestoreCenterModal,
    setShowSyncModal,
    setShowUserManagementModal,
    setShowUserPins,
    setUserFormName,
    setUserFormPerms,
    setUserFormPin,
    setUserFormRole,
    showRestoreCenterModal,
    showSyncModal,
    showUserManagementModal,
    showUserPins,
    systemUsers,
    updateLocalOfflineAdminPin,
    userFormName,
    userFormPerms,
    userFormPin,
    userFormRole,
  };
}
