// نُقل حرفياً من editions/cloud/App.jsx بأداة extract-hook.mjs — راجع ذلك الملف قبل
// أي تعديل يدوي هنا لاحقاً؛ لا منطق جديد أُضيف أثناء النقل.
// .jsx عمداً لا .ts: هذا الكود لم يكن مفحوصاً بصرامة من قبل (checkJs: false في تصريحه
// الأصلي داخل App.jsx)، وإخضاعه لفحص tsc الآن يحتاج كتابة عشرات الأنواع على منطق مزامنة
// حسّاس أثبتته التجربة الفعلية لا الأنواع — تقويته بأنواع حقيقية عمل منفصل لاحق مقصود.
import React from 'react';

export function useCloudDataLayer(deps) {
  const {
    anchorDate,
    dailyStatusOverrides,
    dataEntryOperator,
    hourlyLeaveRecords,
    officialHolidays,
    overtimeHoursRecords,
    overtimeIds,
    pinAttempts,
    pinInput,
    safeStorage,
    setAnchorDate,
    setDailyStatusOverrides,
    setDataEntryOperator,
    setHourlyLeaveRecords,
    setOfficialHolidays,
    setOvertimeHoursRecords,
    setOvertimeIds,
    setPendingPinOfferUser,
    setPinAttempts,
    setPinError,
    setPinInput,
    setSelectedPinUid,
    setShowLoginModal,
    setShowPinScreen,
    setShowSetPinOffer,
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
        active: true, 
        createdAt: '2026-01-01',
        permissions: { dailyReport: true, staffMaster: false, safety: false, evaluation: false }
    },
    { 
        id: 'usr_3', 
        name: 'حيدر سعد', 
        role: 'operator', 
        active: true, 
        createdAt: '2026-01-01',
        permissions: { dailyReport: true, staffMaster: false, safety: false, evaluation: false }
    },
    { 
        id: 'usr_4', 
        name: 'مستعرض عام', 
        role: 'viewer', 
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
                    if (u.id === 'usr_2' && u.name === 'إداري الشعبة 1') {
                        return { ...u, name: 'قاسم صبري', pin: undefined, permissions: basePerms };
                    }
                    if (u.id === 'usr_3' && u.name === 'إداري الشعبة 2') {
                        return { ...u, name: 'حيدر سعد', pin: undefined, permissions: basePerms };
                    }
                    // إسقاط أي كلمة مرور مخزّنة محلياً من الإصدارات السابقة
                    return { ...u, pin: undefined, permissions: basePerms };
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
const [userFormUid, setUserFormUid] = useState('');
const [userFormPassword, setUserFormPassword] = useState('');
const [userFormLocalPart, setUserFormLocalPart] = useState('');
const [userFormManualUid, setUserFormManualUid] = useState(false);
const [userFormPriority, setUserFormPriority] = useState('99');
const [userFormPerms, setUserFormPerms] = useState({
    dailyReport: true,
    staffMaster: false,
    safety: false,
    evaluation: false
});

// دالة التحقق من صلاحية التعديل والمزامنة لتبويب معين (Can Edit & Sync Guard)
// نبضة داخلية: تُبقي فحص قِدَم الجلسات حياً حتى لو تعثّر الاستطلاع، فلا يعلق القفل
const [peerLockTick, setPeerLockTick] = useState(0);
React.useEffect(() => {
    const t = setInterval(() => setPeerLockTick(v => v + 1), 5000);
    return () => clearInterval(t);
}, []);

const currentSessionIdRef = React.useRef(null);
const currentUserIdRef = React.useRef(null);
const currentUserPriorityRef = React.useRef(99);

// تُعلن قبل أي Hook يقرأها (مصفوفة اعتماديات useMemo تُقيَّم فوراً عند الاستدعاء)
const [currentUserRole, setCurrentUserRole] = useState(null);
const [currentUserPermissions, setCurrentUserPermissions] = useState({});
const [activeSessions, setActiveSessions] = useState({});

// قفل التحرير بين الأقران: من يحمل نفس الصلاحية وأولوية أصغر يحتفظ بالتعديل
// المشرفون (admin/manager) خارج المزاحمة — لا يُخفَّضون ولا يُخفِّضون غيرهم،
// وإلا لأقفل تبويبٌ مفتوح على مكتب المدير طوال اليوم عمل المُدخلين بلا سبب.
const lockedSections = React.useMemo(() => {
    const locked = {};
    if (currentUserRole !== 'operator') return locked;
    const myUid = currentUserIdRef.current;
    const myPriority = currentUserPriorityRef.current;
    Object.keys(activeSessions || {}).forEach(uid => {
        const sess = activeSessions[uid];
        if (!sess || uid === myUid) return;
        if (sess.role !== 'operator') return;
        if (!sess.lastSeen || (Date.now() - sess.lastSeen) >= 15000) return;
        const theirPriority = sess.editPriority || 99;
        if (theirPriority >= myPriority) return;
        // نفس احتياطي canEdit: حساب قديم بلا صلاحيات مخزّنة يملك الموقف اليومي ضمناً
        const theirPerms = (sess.permissions && Object.keys(sess.permissions).length > 0) ? sess.permissions : { dailyReport: true };
        const myPerms = (currentUserPermissions && Object.keys(currentUserPermissions).length > 0) ? currentUserPermissions : { dailyReport: true };
        Object.keys(theirPerms).forEach(section => {
            if (theirPerms[section] && myPerms[section]) {
                locked[section] = sess.name || 'زميل';
            }
        });
    });
    return locked;
}, [activeSessions, currentUserRole, currentUserPermissions, peerLockTick]);

const canEdit = (section) => {
    // الأدمن والإداري يملكان كل الأقسام؛ الفرق بينهما في الهوية والتعافي والتدمير لا في البيانات
    if (currentUserRole === 'admin' || currentUserRole === 'manager') return true;
    if (currentUserRole !== 'operator') return false;
    if (lockedSections[section]) return false;
    // الصلاحيات تأتي من عقدة roles/{uid} السحابية عند تسجيل الدخول (لا من قائمة PIN محلية)
    if (!currentUserPermissions || Object.keys(currentUserPermissions).length === 0) {
        return section === 'dailyReport';
    }
    return !!currentUserPermissions[section];
};

const handleOpenUserManagement = () => {
    if (currentUserRole === 'admin') {
        setShowUserManagementModal(true);
    } else {
        alert('❌ هذه النافذة متاحة فقط لمن سجّل دخوله كمدير للنظام.');
    }
};

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

const FIREBASE_DB_URL = "https://hr-cooling-default-rtdb.firebaseio.com/system_bundle.json";
const FIREBASE_BACKUPS_URL = "https://hr-cooling-default-rtdb.firebaseio.com/backups_history";
const FIREBASE_SESSIONS_URL = "https://hr-cooling-default-rtdb.firebaseio.com/active_sessions";

const FIREBASE_ROLES_URL = "https://hr-cooling-default-rtdb.firebaseio.com/roles";
const FIREBASE_AUDIT_LOG_URL = "https://hr-cooling-default-rtdb.firebaseio.com/audit_log";
const FIREBASE_WEB_API_KEY = "AIzaSyAUWG-kTjtwd9VyG6H9s4HueA3Xf1KQdu8";
const FIREBASE_AUTH_BASE = "https://identitytoolkit.googleapis.com/v1";
const FIREBASE_TOKEN_URL = "https://securetoken.googleapis.com/v1/token";

const getStoredAuth = () => {
    try {
        const raw = safeStorage.getItem('firebaseAuthSession');
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
};

const setStoredAuth = (session) => {
    if (session) {
        safeStorage.setItem('firebaseAuthSession', JSON.stringify(session));
    } else {
        safeStorage.removeItem('firebaseAuthSession');
    }
};

// رمز الدخول الرباعي: يفتح جلسة هذا الجهاز فقط — لا يُنشئ صلاحية جديدة ولا يتجاوز
// Firebase، بل يستبدل كتابة البريد وكلمة المرور بتجديد التوكن المخزَّن أصلاً (refreshToken).
// يُخزَّن تجزئة الرمز (SHA-256) لا الرمز نفسه، ومربوطاً بمعرّف الحساب الذي أنشأه — فرمز
// مضبوط لحساب لا يُقبل لحساب آخر يسجّل دخوله لاحقاً على الجهاز نفسه.
const hashDevicePin = async (pin) => {
    const bytes = new TextEncoder().encode('hr-cooling-device-pin:' + pin);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// الجهاز يحمل قائمة حسابات مسجَّلة لا حساباً واحداً: في شعبة تُستعمل فيها أجهزة مشتركة،
// خانة رمز واحدة تعني عملياً أن أول من يضبط رمزه يمنع بقية زملائه من الميزة كلياً.
// كل حساب يحمل تجزئة رمزه وجلسته المحفوظة معه، فلا يتداخل مع غيره ولا يمحوه.
const getDevicePinLocks = () => {
    try {
        const raw = safeStorage.getItem('devicePinLocks');
        if (raw) {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter(l => l && l.uid && l.hash) : [];
        }
        // ترحيل الصيغة القديمة (حساب واحد) تلقائياً حتى لا يفقد من ضبط رمزه سابقاً رمزه.
        // لا يُرحَّل إلا إن وُجدت جلسته فعلاً: تسجيل بلا جلسة لا يفتح شيئاً، ووجوده
        // يجعل عرض التفعيل بعد الدخول الكامل يظنّه مسجَّلاً فلا يعرضه — فيعلق بلا مخرج
        const legacyRaw = safeStorage.getItem('devicePinLock');
        if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw);
            const session = getStoredAuth();
            const usable = session && session.refreshToken && legacy && session.uid === legacy.uid;
            safeStorage.removeItem('devicePinLock');
            if (usable && legacy.hash) {
                const migrated = [{ uid: legacy.uid, hash: legacy.hash, name: legacy.name || '', session }];
                safeStorage.setItem('devicePinLocks', JSON.stringify(migrated));
                return migrated;
            }
        }
        return [];
    } catch (e) { return []; }
};

const getDevicePinLockFor = (uid) => getDevicePinLocks().find(l => l.uid === uid) || null;
// تسجيل صالح فعلاً = يحمل جلسة قابلة للتجديد؛ ما دونه لا يفتح شيئاً
const hasUsableDevicePinLock = (uid) => {
    const l = getDevicePinLockFor(uid);
    return !!(l && l.session && l.session.refreshToken);
};

// تعديل تسجيل واحد بعينه دون المساس ببقية الحسابات على الجهاز
const updateDevicePinLock = (uid, patch) => {
    const locks = getDevicePinLocks().map(l => l.uid === uid ? { ...l, ...patch } : l);
    safeStorage.setItem('devicePinLocks', JSON.stringify(locks));
};

const setDevicePinLock = async (uid, pin, name) => {
    const session = getStoredAuth();
    // الجلسة تُلتقط مرة واحدة ويُتحقق أنها لصاحب الرمز نفسه: لو التقطنا جلسة حساب آخر
    // (سباق مصادقة أو خطأ استدعاء) لارتبط رمز فلان بجلسة فلان، ولفشل فتحه دائماً
    if (!session || !session.refreshToken || session.uid !== uid) return false;
    const hash = await hashDevicePin(pin);
    const locks = getDevicePinLocks().filter(l => l.uid !== uid);
    locks.push({ uid, hash, name: name || '', session, lockedUntil: 0 });
    safeStorage.setItem('devicePinLocks', JSON.stringify(locks));
    return true;
};

// بلا uid تمسح الجهاز كله؛ مع uid تمسح صاحبه وحده وتترك بقية الزملاء كما هم
const clearDevicePinLock = (uid) => {
    if (!uid) {
        safeStorage.removeItem('devicePinLocks');
        safeStorage.removeItem('devicePinLock');
        return;
    }
    const remaining = getDevicePinLocks().filter(l => l.uid !== uid);
    if (remaining.length > 0) {
        safeStorage.setItem('devicePinLocks', JSON.stringify(remaining));
    } else {
        safeStorage.removeItem('devicePinLocks');
    }
    safeStorage.removeItem('devicePinLock');
};

// مؤهَّل للدخول السريع إن كان على الجهاز حساب واحد على الأقل يحمل رمزاً وجلسة محفوظة
const isPinEligibleNow = () => getDevicePinLocks().some(l => l.session && l.session.refreshToken);

const signInWithEmail = async (email, password) => {
    const res = await fetch(`${FIREBASE_AUTH_BASE}/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const data = await res.json();
    if (!res.ok) {
        const msg = (data.error && data.error.message) || 'AUTH_FAILED';
        throw new Error(msg);
    }
    const session = {
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        uid: data.localId,
        expiresAt: Date.now() + (parseInt(data.expiresIn, 10) * 1000)
    };
    setStoredAuth(session);
    return session;
};

// إنشاء حساب Firebase حقيقي مباشرة (بلا خادم خلفي — نفس مفتاح الويب المستخدم للدخول
// يكفي لهذا الاستدعاء، فهو إنشاء حساب جديد لا وصولاً لحساب طرف آخر). يعيد الـUID فوراً
// فلا حاجة لنسخه يدوياً من Firebase Console بعد الآن.
const signUpWithEmail = async (email, password) => {
    const res = await fetch(`${FIREBASE_AUTH_BASE}/accounts:signUp?key=${FIREBASE_WEB_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const data = await res.json();
    if (!res.ok) {
        const msg = (data.error && data.error.message) || 'SIGNUP_FAILED';
        throw new Error(msg);
    }
    return data.localId;
};

// عدّاد حقب المصادقة: كل خروج يبدأ حقبة جديدة، فتُهمَل نتيجة أي تجديد كان في الطريق
const authEpochRef = React.useRef(0);
// بوابة الرمز الرباعي: تبقى مغلقة طوال عرض شاشة الرمز فتمنع cloudFetch من استخدام
// الجلسة المخزَّنة قبل التحقق منه — دون هذا الحاجز، أي طلب مستقبلي يستدعي cloudFetch
// (حتى لو أُضيف لاحقاً بلا علاقة بتسجيل الدخول) يمرّ موثَّقاً بصمت بمجرد وجود جلسة
// محفوظة، بصرف النظر عن دخول الرمز نفسه. تُفتح فوراً بعد التحقق من الرمز داخل
// handlePinLogin نفسها (فهي بحاجة لـ cloudFetch لإكمال الدخول)، أو حين لا تُعرض
// شاشة الرمز أصلاً.
// القيمة الابتدائية تُحسب هنا مباشرة أثناء الرسم الأول، لا داخل useEffect — تأثيرات
// أخرى مسجَّلة قبل تأثير استعادة الجلسة يمكن أن تستدعي cloudFetch في اللحظة نفسها
// التي يُثبَّت فيها الرسم الأول، فلو انتظرت التأثير لإغلاق البوابة لوُجدت نافذة زمنية
// تمرّ خلالها طلبات موثَّقة قبل التحقق من الرمز.
const pinGateOpenRef = React.useRef(!isPinEligibleNow());

const refreshIdTokenIfNeeded = async () => {
    const session = getStoredAuth();
    if (!session) return null;
    if (Date.now() < session.expiresAt - 5 * 60 * 1000) {
        return session;
    }
    const epoch = authEpochRef.current;
    try {
        const res = await fetch(`${FIREBASE_TOKEN_URL}?key=${FIREBASE_WEB_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=refresh_token&refresh_token=${session.refreshToken}`
        });
        const data = await res.json();
        if (epoch !== authEpochRef.current) return null;
        if (!res.ok) {
            setStoredAuth(null);
            return null;
        }
        const refreshed = {
            idToken: data.id_token,
            refreshToken: data.refresh_token,
            uid: data.user_id,
            expiresAt: Date.now() + (parseInt(data.expires_in, 10) * 1000)
        };
        setStoredAuth(refreshed);
        return refreshed;
    } catch (e) {
        if (epoch !== authEpochRef.current) return null;
        return session;
    }
};

const signOutFirebase = () => {
    authEpochRef.current += 1;
    setStoredAuth(null);
};

const cloudFetch = async (url, options = {}) => {
    if (!pinGateOpenRef.current) {
        return new Response(null, { status: 401, statusText: 'device pin not yet verified' });
    }
    const session = await refreshIdTokenIfNeeded();
    const separator = url.includes('?') ? '&' : '?';
    const authedUrl = session ? `${url}${separator}auth=${session.idToken}` : url;
    return fetch(authedUrl, options);
};

const logAuditEvent = async (action, displayName) => {
    try {
        const session = getStoredAuth();
        if (!session) return;
        // المستعرض لا يكتب شيئاً، ومحاولة التسجيل ترتد بخطأ صلاحيات فيظهر إنذار كاذب دائم
        if (currentUserRole === 'viewer') return;
        const res = await cloudFetch(`${FIREBASE_AUDIT_LOG_URL}.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: session.uid,
                displayName: displayName || '',
                // الحقول الأربعة وأنواعها مقيّدة بشرط .validate على الخادم:
                // uid يجب أن يساوي auth.uid، والطابع الزمني رقم قريب من وقت الخادم
                action: String(action).slice(0, 200),
                timestamp: Date.now()
            })
        });
        // قيدٌ مرفوض بلا إشعار يعني سجل تدقيق يبدو سليماً وهو فارغ. الرسالة تسمّي
        // التدقيق صراحةً كي لا تُقرأ على أنها فشل حفظ بيانات، وتذكر ساعة الجهاز لأن
        // شرط الخادم يقارن الطابع الزمني بوقته.
        if (!res.ok) {
            setCloudSyncStatus(prev => ({ ...prev, error: `تعذّر تسجيل قيد التدقيق (رمز ${res.status}). بياناتك تُحفظ، لكن سجل التدقيق لا يستقبل القيود — تحقّق من ساعة الجهاز ومن صلاحية حسابك.` }));
        }
    } catch (e) {
        setCloudSyncStatus(prev => ({ ...prev, error: 'تعذّر تسجيل قيد التدقيق: لم يصل الطلب إلى السحابة. بياناتك تُحفظ، لكن سجل التدقيق ناقص.' }));
    }
};

const [isCheckingLogin, setIsCheckingLogin] = useState(false);

// حالات مركز الاستعادة والأرشيف الزمني السحابي (Time-Machine Restore Center)
const [showRestoreCenterModal, setShowRestoreCenterModal] = useState(false);
// الوضع الليلي محفوظ على <html> ويُطبَّق قبل تحميل React؛ هذه الحالة لأيقونة الزر فقط
const [isDarkTheme, setIsDarkTheme] = useState(() => {
    try { return document.documentElement.getAttribute('data-theme') === 'dark'; } catch (e) { return false; }
});
const [availableSnapshots, setAvailableSnapshots] = useState([]);
const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
const [snapshotsError, setSnapshotsError] = useState(null);
const [selectedSnapshotPreview, setSelectedSnapshotPreview] = useState(null);
const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);

const [loginInputRole, setLoginInputRole] = useState('operator');
// حين يكون الحساب مفتوحاً على جهاز آخر، نعرض الخيار بدل رسالة مسدودة
const [pendingTakeover, setPendingTakeover] = useState(null);
const [loginEmail, setLoginEmail] = useState('');
const [loginPassword, setLoginPassword] = useState('');
const [showLoginPassword, setShowLoginPassword] = useState(false);
const [loginError, setLoginError] = useState('');

const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    // التعبئة التلقائية من المتصفح قد لا تُطلق onChange، فنقرأ الحقل مباشرة عند الحاجة
    const emailEl = document.getElementById('loginEmailInput');
    const passwordEl = document.getElementById('loginPasswordInput');
    const email = (loginEmail || (emailEl && emailEl.value) || '').trim();
    const password = loginPassword || (passwordEl && passwordEl.value) || '';
    if (!email || !password) {
        setLoginError('⚠️ يرجى إدخال البريد الإلكتروني وكلمة المرور.');
        return;
    }

    setIsCheckingLogin(true);

    let session;
    try {
        session = await signInWithEmail(email, password);
    } catch (err) {
        setIsCheckingLogin(false);
        setLoginError('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة!');
        return;
    }

    let roleData = null;
    try {
        const roleRes = await cloudFetch(`${FIREBASE_ROLES_URL}/${session.uid}.json`);
        if (roleRes.ok) {
            roleData = await roleRes.json();
        }
    } catch (err) {
        console.warn("Role fetch error during login:", err);
    }

    if (!roleData || !roleData.role) {
        setIsCheckingLogin(false);
        signOutFirebase();
        setLoginError('❌ هذا الحساب غير مخوّل للدخول (لا يوجد دور مسند له). راجع مدير النظام.');
        return;
    }

    const targetUser = { id: session.uid, name: roleData.name || email, role: roleData.role, permissions: roleData.permissions || {} };
    const loggedIn = await proceedAfterAuth(targetUser, roleData);

    // بعد نجاح دخول كامل ببريد وكلمة مرور فعلياً (لا حين توقّف الأمر عند مطالبة
    // بإنهاء جلسة جهاز آخر) اعرض إتاحة رمز رباعي لهذا الجهاز — لا يُعرض بعد دخول
    // بالرمز نفسه (يملكه أصلاً)، ولا لحساب الاطلاع (بلا فائدة تُذكر)
    if (loggedIn && targetUser.role !== 'viewer' && !hasUsableDevicePinLock(targetUser.id) && !safeStorage.getItem('pinOfferDeclined_' + targetUser.id)) {
        setPendingPinOfferUser(targetUser);
        setShowSetPinOffer(true);
    }
};

// فحص هل الحساب مستخدم حالياً من جهاز آخر (قفل الجلسة الفردية)، ثم إتمام الدخول.
// مشتركة بين الدخول الكامل (بريد وكلمة مرور) والدخول السريع (الرمز الرباعي).
// تُعيد true إن أتمّت الدخول فعلياً، و false إن توقّفت عند مطالبة تولّي الجلسة —
// فارق يحتاجه استدعاء handleLogin ليعرف هل يعرض إتاحة الرمز الرباعي أم لا.
const proceedAfterAuth = async (targetUser, roleData) => {
    // لا يُطبَّق على حسابات الاطلاع: لا تكتب شيئاً، ويجوز استعمالها من عدة أجهزة معاً
    const enforcesSessionLock = targetUser.role !== 'viewer';
    if (enforcesSessionLock) try {
        const sessRes = await cloudFetch(`${FIREBASE_SESSIONS_URL}/${targetUser.id}.json?t=${Date.now()}`);
        if (sessRes.ok) {
            const sessData = await sessRes.json();
            if (sessData && sessData.sessionId && sessData.lastSeen) {
                const elapsed = Date.now() - sessData.lastSeen;
                if (elapsed < 15000 && sessData.sessionId !== currentSessionIdRef.current) {
                    // لا نسدّ الطريق: من وصل هو من يقرّر. القرار يُستأنف في completeLogin.
                    setIsCheckingLogin(false);
                    setPendingTakeover({
                        targetUser: targetUser,
                        roleData: roleData,
                        otherDeviceSeconds: Math.max(1, Math.round(elapsed / 1000))
                    });
                    return false;
                }
            }
        }
    } catch (err) {
        console.warn("Session check error:", err);
    }

    await completeLogin(targetUser, roleData);
    return true;
};

// إتمام الدخول بعد اجتياز فحص الجلسة — أو بعد أن يختار المستخدم إنهاء الجلسة الأخرى
const completeLogin = async (targetUser, roleData) => {
    const enforcesSessionLock = targetUser.role !== 'viewer';

    // حجز الجلسة الفردية للجهاز الحالي
    const newSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
    currentSessionIdRef.current = newSessionId;
    currentUserIdRef.current = targetUser.id;
    currentUserPriorityRef.current = roleData.editPriority || 99;

    if (enforcesSessionLock) try {
        await cloudFetch(`${FIREBASE_SESSIONS_URL}/${targetUser.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: newSessionId,
                userId: targetUser.id,
                name: targetUser.name,
                role: targetUser.role,
                permissions: targetUser.permissions || {},
                editPriority: roleData.editPriority || 99,
                lastSeen: Date.now()
            })
        });
    } catch (e) {}

    setCurrentUserRole(targetUser.role);
    setCurrentUserName(targetUser.name);
    setCurrentUserPermissions(targetUser.permissions);
    // ملاحظة: لا نُعيّن dataEntryOperator تلقائياً هنا — هذا الحقل سحابي مشترك بين
    // كل الأجهزة (حقل "اسم منظم الموقف" في شاشة الموقف اليومي)، لا حالة دخول شخصية.
    // كان يُستبدَل هنا باسم كل من يسجّل الدخول من أي جهاز، فيرى إداري آخر اسم زميله
    // يحل محل اسمه على شاشته خلال ثوانٍ (شكوى: "حساب قاسم يظهر اسم فاطمة") — ويُبعث
    // هذا التبديل للسحابة فيُصادم أي حفظ آخر جارٍ في تلك اللحظة (انظر ملاحظة حارس
    // التعارض في pushDataToCloud)، ما يفسّر أيضاً حاجة تكرار حفظ الموقف اليومي عدة
    // مرات. الحقل يبقى قابلاً للتعديل يدوياً من شاشته كما هو مصمَّم أصلاً.
    logAuditEvent('login', targetUser.name);
    setIsCheckingLogin(false);
    setPendingTakeover(null);
    setShowWelcome(false);
    setLoginEmail('');
    setLoginPassword('');
    setShowLoginPassword(false);
    setShowLoginModal(false);
    setShowPinScreen(false);
    setPinInput('');
    setPinError('');
    setPinAttempts(0);
    // بيانات الملاك لم تعد مقروءة بلا حساب، فجلبها عند فتح الصفحة (قبل الدخول) يُرفض.
    // نُعيد الجلب فور اكتمال الدخول بدل انتظار الدورة التالية للاستطلاع بعد خمس ثوانٍ
    fetchCloudData();
};

// الدخول السريع بالرمز الرباعي: يجدّد التوكن المخزَّن أصلاً (refreshToken) بدل طلب
// بريد وكلمة مرور من جديد، ثم يكمل بنفس مسار الدخول الكامل تماماً (فحص الجلسة،
// قراءة الدور والصلاحيات الحيّة من roles/{uid} — لا تُقرأ من تخزين محلي قديم قد يكون تغيّر)
// حارس تزامن: نقرة مزدوجة أو Enter مع نقرة الزر معاً قد يستدعيان هذه الدالة مرتين
// قبل أن يلتقط أيّهما تحديث pinAttempts من الآخر — فيُهدَر عدّ محاولة كاملة. المرجع
// (لا حالة React) يُقفَل فوراً ومتزامناً في أول سطر، فلا نافذة زمنية للتسابق.
const isPinSubmittingRef = React.useRef(false);

const handlePinLogin = async (uid) => {
    if (isPinSubmittingRef.current) return;
    isPinSubmittingRef.current = true;
    try {
        setPinError('');
        const lock = getDevicePinLockFor(uid);
        if (!lock || !lock.session || !lock.session.refreshToken) {
            clearDevicePinLock(uid);
            pinGateOpenRef.current = true;
            setShowPinScreen(false);
            setSelectedPinUid(null);
            setShowWelcome(true);
            return;
        }

        // تهدئة زمنية بدل الحذف: على جهاز مشترك، من يجرّب رموزاً على حساب زميله
        // (عن قصد أو خطأ) لا يجوز أن يُلغي تسجيله ويُجبره على دخول كامل — يُجمَّد مؤقتاً فقط
        if (lock.lockedUntil && Date.now() < lock.lockedUntil) {
            const mins = Math.max(1, Math.ceil((lock.lockedUntil - Date.now()) / 60000));
            setPinInput('');
            setPinError(`⏳ أُوقف إدخال الرمز لهذا الحساب مؤقتاً بعد محاولات خاطئة. أعد المحاولة بعد ${mins} دقيقة، أو ادخل بالبريد وكلمة المرور.`);
            return;
        }

        const enteredHash = await hashDevicePin(pinInput);
        if (enteredHash !== lock.hash) {
            const attempts = pinAttempts + 1;
            setPinInput('');
            if (attempts >= 5) {
                updateDevicePinLock(uid, { lockedUntil: Date.now() + 15 * 60 * 1000 });
                setPinAttempts(0);
                // يبقى على شاشة هذا الحساب ليقرأ سبب التوقف — إعادته لقائمة الاختيار
                // تُخفي الرسالة فيظنّ أن الزر معطّل بلا سبب
                setPinError('⛔ تجاوزت عدد المحاولات المسموح. أُوقف رمز هذا الحساب 15 دقيقة — تسجيله لم يُحذف، ويمكن لصاحبه الدخول بالبريد وكلمة المرور.');
                return;
            }
            setPinAttempts(attempts);
            setPinError(`❌ رمز غير صحيح (${5 - attempts} محاولات متبقية).`);
            return;
        }

        // الرمز صحيح: تُنصَّب جلسة صاحبه لتُستعمل في التجديد (تجديد التوكن يمرّ بـ fetch
        // مباشر لا بـ cloudFetch، فلا تحتاج فتح البوابة) — والبوابة تبقى مغلقة عمداً حتى
        // يثبت أن الجلسة المجدَّدة تخصّ فعلاً صاحب الرمز، فلا يُستعمل توكن غير مُتحقَّق منه
        setStoredAuth(lock.session);

        setIsCheckingLogin(true);
        const refreshed = await refreshIdTokenIfNeeded();
        // إعادة التحقق من الحساب بعد التجديد غير المتزامن: لو بدّل تبويب آخر الجلسة
        // المخزَّنة أثناء هذا الانتظار، لا نكمل الدخول بحساب غير الذي تحقّق منه الرمز
        if (!refreshed || refreshed.uid !== lock.uid) {
            // الجلسة غير موثوقة: تُمحى ولا تُترك منصَّبة، والتسجيل يبقى لصاحبه
            signOutFirebase();
            pinGateOpenRef.current = true;
            setIsCheckingLogin(false);
            setShowPinScreen(false);
            setSelectedPinUid(null);
            setShowWelcome(true);
            setShowLoginModal(true);
            setLoginError('⚠️ انتهت جلستك المحفوظة على هذا الجهاز. سجّل الدخول الكامل من جديد.');
            return;
        }

        // ثبتت هوية الجلسة الآن: تُفتح البوابة، ويُحدَّث التسجيل بالجلسة المجدَّدة حتى
        // لا يُعاد استعمال توكن قديم في المرات القادمة (رموز التجديد تُدوَّر أحياناً)
        pinGateOpenRef.current = true;
        updateDevicePinLock(uid, { session: refreshed, lockedUntil: 0 });

        // نميّز عطل الاتصال العابر (لا اتصال إنترنت لحظياً) عن رفض الخادم الصريح —
        // بلا هذا التمييز، رمز صحيح يُدخَل أثناء انقطاع شبكة وجيز كان يُفسَّر بالخطأ
        // كحساب فقد صلاحيته، فيُمحى الرمز والجلسة كلياً على جهاز يعمل بلا عطل حقيقي
        let roleData = null;
        let roleFetchFailed = false;
        try {
            const roleRes = await cloudFetch(`${FIREBASE_ROLES_URL}/${refreshed.uid}.json`);
            if (roleRes.ok) {
                roleData = await roleRes.json();
            } else {
                roleFetchFailed = true;
            }
        } catch (err) {
            console.warn("Role fetch error during PIN login:", err);
            roleFetchFailed = true;
        }

        if (roleFetchFailed) {
            setIsCheckingLogin(false);
            setPinError('⚠️ تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى — رمزك لم يُمحَ.');
            return;
        }

        if (!roleData || !roleData.role) {
            // هنا فقط الخادم ردّ فعلاً بعدم وجود صلاحية — رفض حقيقي، لا عطل شبكة
            clearDevicePinLock(uid);
            signOutFirebase();
            setIsCheckingLogin(false);
            setShowPinScreen(false);
            setSelectedPinUid(null);
            setShowWelcome(true);
            setShowLoginModal(true);
            setLoginError('❌ هذا الحساب لم يعد مخوّلاً للدخول. راجع مدير النظام.');
            return;
        }

        const targetUser = { id: refreshed.uid, name: roleData.name || '', role: roleData.role, permissions: roleData.permissions || {} };
        // اسم التسجيل المحلي على هذا الجهاز لقطة أُخذت عند ضبط الرمز — لو غيّر مدير
        // النظام اسم الحساب لاحقاً (مثلاً أُعيد إسناد الحساب لموظف آخر)، تبقى شاشة
        // "من أنت؟" على هذا الجهاز تعرض الاسم القديم حتى يُحدَّث هنا من مصدر الحقيقة
        if (roleData.name && roleData.name !== lock.name) {
            updateDevicePinLock(uid, { name: roleData.name });
        }
        await proceedAfterAuth(targetUser, roleData);
    } finally {
        isPinSubmittingRef.current = false;
    }
};

// «دخول بحساب آخر» لا يمحو أرصدة الزملاء على الجهاز — يفتح الدخول الكامل فقط،
// ومن يُتمّه يُضاف إلى قائمة الجهاز بجانبهم لا بدلاً منهم
const useAnotherAccount = () => {
    setStoredAuth(null);
    pinGateOpenRef.current = true;
    setShowPinScreen(false);
    setSelectedPinUid(null);
    setPinInput('');
    setPinError('');
    setPinAttempts(0);
    setShowWelcome(true);
    setShowLoginModal(true);
};

// المستخدم اختار المتابعة: نكتب معرّف جلسة جديداً، فيلتقطه نبض الجهاز الآخر
// خلال خمس ثوانٍ ويسجّل خروجه برسالة تشرح ما جرى.
const confirmSessionTakeover = async () => {
    if (!pendingTakeover) return;
    const { targetUser, roleData } = pendingTakeover;
    setPendingTakeover(null);
    setIsCheckingLogin(true);
    await completeLogin(targetUser, roleData);
};

const cancelSessionTakeover = () => {
    setPendingTakeover(null);
    signOutFirebase();
    setLoginPassword('');
    setShowLoginPassword(false);
};

const handleLogout = () => {
    if (currentUserIdRef.current) {
        const uid = currentUserIdRef.current;
        cloudFetch(`${FIREBASE_SESSIONS_URL}/${uid}.json`, { method: 'DELETE' }).catch(() => {});
    }
    // الخروج يُنهي الجلسة الفاعلة على الشاشة فقط، ولا يُلغي تسجيل الرمز: على جهاز
    // مشترك، خروج الموظف ليُسلّم الجهاز لزميله يجب ألا يُجبره على دخول كامل في دوره
    // القادم. جلسته محفوظة داخل تسجيله هو (لا في الجلسة الفاعلة التي تُمسح الآن)،
    // ومن أراد إلغاء وصوله السريع فعلاً فزرّ «إلغاء رمزي» موجود لذلك صراحةً.
    signOutFirebase();
    currentUserIdRef.current = null;
    currentSessionIdRef.current = null;
    setCurrentUserRole(null);
    setCurrentUserName('');
    setCurrentUserPermissions({});
    // الخروج يُعيد شاشة الترحيب: بدونها يبقى الخارج (أو زميله على جهاز مشترك) أمام
    // صفحة بلا أي مدخل للدخول من جديد إلا بإعادة تحميل الصفحة يدوياً
    setShowWelcome(true);
    setShowPinScreen(false);
    setSelectedPinUid(null);
    setPinInput('');
    setPinError('');
    setPinAttempts(0);
};

// فحص نبض الجلسة النشطة وطرد الجلسات في حال تسجيل الدخول من مكان آخر
React.useEffect(() => {
    if (!currentUserRole || !currentUserIdRef.current || !currentSessionIdRef.current || currentUserRole === 'viewer') return;
    const uid = currentUserIdRef.current;
    const sid = currentSessionIdRef.current;

    const heartbeat = async () => {
        try {
            const checkRes = await cloudFetch(`${FIREBASE_SESSIONS_URL}/${uid}.json?t=${Date.now()}`);
            if (checkRes.ok) {
                const sessData = await checkRes.json();
                if (sessData && sessData.sessionId && sessData.sessionId !== sid) {
                    alert('⚠️ تنبيه أمني: تم تسجيل الدخول إلى هذا الحساب من جهاز آخر أو تم فك القفل من قبل مدير النظام. تم إنهاء جلستك على هذا الجهاز.');
                    handleLogout();
                    return;
                }
            }
            await cloudFetch(`${FIREBASE_SESSIONS_URL}/${uid}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sid,
                    userId: uid,
                    name: currentUserName,
                    role: currentUserRole,
                    permissions: currentUserPermissions || {},
                    editPriority: currentUserPriorityRef.current,
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
            // لا يمكن انتظار تجديد التوكن هنا (await يُبطل keepalive)، فنستعمل التوكن المخزَّن مباشرةً
            const unloadSession = getStoredAuth();
            const unloadUrl = `${FIREBASE_SESSIONS_URL}/${currentUserIdRef.current}.json` + (unloadSession ? `?auth=${unloadSession.idToken}` : '');
            fetch(unloadUrl, {
                method: 'DELETE',
                keepalive: true
            });
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);

// استطلاع الجلسات النشطة — يغذّي قفل التحرير بين الأقران ومؤشرات الاتصال في جدول المستخدمين
React.useEffect(() => {
    if (!currentUserRole || currentUserRole === 'viewer') return;
    const fetchSessions = async () => {
        try {
            const res = await cloudFetch(`${FIREBASE_SESSIONS_URL}.json?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setActiveSessions(data || {});
            }
        } catch (e) {}
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
}, [currentUserRole]);

const handleForceEvictSession = async (userId, userName) => {
    if (!userId) {
        alert('⛔ لا يمكن فك القفل: هذا الحساب غير مربوط بمعرّف Firebase (UID) بعد.');
        return;
    }
    if (!confirm(`⚠️ هل أنت متأكد من فك قفل وإنهاء جلسة المستخدم (${userName})؟\nسيتم تحرير الحساب فوراً ليتمكن من تسجيل الدخول من أي جهاز جديد.`)) return;
    try {
        await cloudFetch(`${FIREBASE_SESSIONS_URL}/${userId}.json`, { method: 'DELETE' });
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

// حذف آخر مدير أو تنزيل رتبته يقفل إدارة الحسابات نهائياً — لا مخرج إلا يدوياً من لوحة Firebase
const isLastActiveAdmin = (userId) => {
    const activeAdmins = systemUsers.filter(u => u.role === 'admin' && u.active !== false);
    return activeAdmins.length === 1 && activeAdmins[0].id === userId;
};

const handleSaveUser = async (e) => {
    if (e) e.preventDefault();
    const name = userFormName.trim();
    if (!name) {
        alert('⚠️ يرجى إدخال اسم المستخدم!');
        return;
    }

    let targetUid = userFormUid.trim();
    // مستخدم جديد بلا UID مُلصَق يدوياً: يُنشأ له حساب Firebase حقيقي هنا مباشرة —
    // بريد تقني تلقائي (لا يحتاج المدير كتابته)، وكلمة مرور يختارها هو فقط.
    if (!editingUserId && !targetUid) {
        const password = userFormPassword.trim();
        if (!password || password.length < 6) {
            alert('⚠️ يرجى إدخال كلمة مرور من 6 أحرف على الأقل لإنشاء حساب هذا المستخدم!');
            return;
        }
        const localPart = userFormLocalPart.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
        if (!localPart) {
            alert('⚠️ يرجى إدخال اسم الدخول بأحرف إنجليزية (مثال: fatima) — يُستخدم بريداً تقنياً للحساب، لذا يجب أن يكون سهل الحفظ والكتابة.');
            return;
        }
        const autoEmail = localPart + '@hr-cooling.local';
        try {
            targetUid = await signUpWithEmail(autoEmail, password);
        } catch (err) {
            const isDuplicate = err && String(err.message || '').includes('EMAIL_EXISTS');
            alert(isDuplicate
                ? ('⛔ اسم الدخول "' + localPart + '" مُستخدَم بالفعل لحساب آخر. جرّب اسماً مختلفاً (مثلاً بإضافة الاسم الثاني).')
                : ('⛔ تعذّر إنشاء حساب Firebase لهذا المستخدم:' + String.fromCharCode(10,10) + ((err && err.message) || 'خطأ غير معروف')));
            return;
        }
        alert('✅ أُنشئ حساب الدخول بنجاح:' + String.fromCharCode(10,10) + 'البريد: ' + autoEmail + String.fromCharCode(10) + 'كلمة المرور: (كما أدخلتها الآن)' + String.fromCharCode(10,10) + 'سلّم هذين للمستخدم — لن يظهر البريد مرة أخرى تلقائياً.');
    }
    // UID مطلوب فقط عند إنشاء حساب جديد (والحساب الجديد يحصل عليه تلقائياً أعلاه
    // عبر التسجيل، أو يُلصَق يدوياً). تعديل حساب قائم لم يُربَط بـUID من قبل
    // (حسابات PIN فقط — الوضع المعتاد لمعظم حسابات النظام) يبقى ممكناً بلا UID،
    // كما كان يعمل دائماً قبل إضافة ميزة الربط (ملاحظة المستخدم 2026-09-18).
    if (!editingUserId && !targetUid) {
        alert('⚠️ يرجى إدخال معرّف حساب Firebase (UID) الخاص بهذا المستخدم! تنسخه من Firebase Console ← Authentication ← Users.');
        return;
    }

    const existingWithUid = targetUid && systemUsers.find(u => String(u.uid || '').trim() === targetUid && u.id !== editingUserId);
    if (existingWithUid) {
        alert(`⚠️ هذا المعرّف (UID) مسند بالفعل للمستخدم (${existingWithUid.name})! كل حساب Firebase يُسند لمستخدم واحد فقط.`);
        return;
    }

    if (editingUserId && userFormRole !== 'admin' && isLastActiveAdmin(editingUserId)) {
        alert('⛔ لا يمكن تنزيل رتبة آخر مدير نظام نشط.\n\nلو فقد هذا الحساب صفة المدير، لن يستطيع أحد إسناد الأدوار بعدها، ولن يُفتح النظام إلا بتدخل يدوي من لوحة Firebase.\n\nعيّن مديراً آخر أولاً، ثم أعد المحاولة.');
        return;
    }

    const parsedPriority = parseInt(userFormPriority, 10);
    const priorityToSave = (isNaN(parsedPriority) || parsedPriority < 1) ? 99 : parsedPriority;

    let updatedUsers;
    const permsToSave = (userFormRole === 'admin' || userFormRole === 'manager')
        ? { dailyReport: true, staffMaster: true, safety: true, evaluation: true }
        : userFormRole === 'viewer'
            ? { dailyReport: false, staffMaster: false, safety: false, evaluation: false }
            : userFormPerms;

    if (editingUserId) {
        updatedUsers = systemUsers.map(u => u.id === editingUserId ? { ...u, name, role: userFormRole, uid: targetUid, editPriority: priorityToSave, permissions: permsToSave } : u);
        alert(`✅ تم تحديث بيانات وصلاحيات المستخدم (${name}) بنجاح!`);
    } else {
        const newUser = {
            id: 'usr_' + Date.now(),
            name,
            role: userFormRole,
            uid: targetUid,
            editPriority: priorityToSave,
            permissions: permsToSave,
            active: true,
            createdAt: new Date().toLocaleDateString('ar-IQ')
        };
        updatedUsers = [...systemUsers, newUser];
        alert(`✅ تم إضافة المستخدم الجديد (${name}) بالصلاحيات المحددة بنجاح!`);
    }

    setSystemUsers(updatedUsers);
    safeStorage.setItem('systemUsersList', JSON.stringify(updatedUsers));

    // مصدر الحقيقة للصلاحيات هو عقدة roles/{uid} السحابية — تُقرأ عند كل تسجيل دخول
    cloudFetch(`${FIREBASE_ROLES_URL}/${targetUid}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role: userFormRole, editPriority: priorityToSave, permissions: permsToSave })
    }).then(res => {
        if (res.ok) {
            logAuditEvent(`update_role:${targetUid}`, currentUserName);
        } else {
            alert('⚠️ حُفظت البيانات محلياً، لكن الدور لم يصل إلى Firebase (رمز ' + res.status + ').' + String.fromCharCode(10,10) + 'لن يستطيع هذا المستخدم الدخول حتى ينجح الحفظ. راجع قواعد الأمان: عقدة roles تحتاج صلاحية كتابة للمدير.');
        }
    }).catch(err => {
        alert('⚠️ حُفظت البيانات محلياً، لكن تعذّر الوصول إلى Firebase لحفظ الدور:' + String.fromCharCode(10,10) + (err && err.message ? err.message : 'خطأ في الشبكة'));
    });
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
    setUserFormUid('');
    setUserFormPassword('');
    setUserFormLocalPart('');
    setUserFormManualUid(false);
    setUserFormPriority('99');
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
    setUserFormUid(u.uid || '');
    setUserFormPassword('');
    setUserFormLocalPart('');
    setUserFormManualUid(true);
    setUserFormPriority(String(u.editPriority || 99));
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
        const uidInput = document.getElementById('userFormUidInput');
        if (uidInput) {
            uidInput.focus();
            uidInput.select();
        }
    }, 40);
};

const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setUserFormName('');
    setUserFormRole('operator');
    setUserFormUid('');
    setUserFormPassword('');
    setUserFormLocalPart('');
    setUserFormManualUid(false);
    setUserFormPriority('99');
    setUserFormPerms({
        dailyReport: true,
        staffMaster: false,
        safety: false,
        evaluation: false
    });
};

const handleDeleteUser = (userId) => {
    if (isLastActiveAdmin(userId)) {
        alert('⛔ لا يمكن حذف آخر مدير نظام نشط.\n\nعيّن مديراً آخر أولاً، ثم أعد المحاولة.');
        return;
    }
    const userToDelete = systemUsers.find(u => u.id === userId);
    if (!userToDelete) return;
    if (!confirm(`⚠️ هل أنت متأكد من حذف المستخدم (${userToDelete.name}) نهائياً؟`)) return;

    // الدخول يُصرَّح من عقدة roles/{uid} وحدها: حذف السطر محلياً لا يسحب الوصول
    if (userToDelete.uid) {
        cloudFetch(`${FIREBASE_ROLES_URL}/${userToDelete.uid}.json`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) {
                    alert('⚠️ حُذف المستخدم محلياً، لكن لم يُحذف دوره من Firebase (رمز ' + res.status + ').' + String.fromCharCode(10,10) + 'سيبقى قادراً على الدخول حتى يُحذف سجله. راجع عقدة roles في لوحة Firebase.');
                }
            })
            .catch(() => {
                alert('⚠️ حُذف المستخدم محلياً، لكن تعذّر الوصول إلى Firebase لحذف دوره. سيبقى قادراً على الدخول حتى ينجح الحذف.');
            });
        logAuditEvent('revoke_role:' + userToDelete.uid, currentUserName);
    }

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
    if (isLastActiveAdmin(userId)) {
        alert('⛔ لا يمكن تعطيل آخر مدير نظام نشط.\n\nعيّن مديراً آخر أولاً، ثم أعد المحاولة.');
        return;
    }
    const userToToggle = systemUsers.find(u => u.id === userId);
    if (!userToToggle) return;
    const willBeActive = !(userToToggle.active !== false);
    // «تعطيل الحساب» يجب أن يسحب الوصول فعلاً: الدخول يقرأ roles/{uid} ولا يعرف شيئاً
    // عن العلم المحلي active، فبدون حذف العقدة يبقى الحساب المعطَّل قادراً على الدخول.
    if (userToToggle.uid) {
        const revokeOrRestore = willBeActive
            ? cloudFetch(`${FIREBASE_ROLES_URL}/${userToToggle.uid}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userToToggle.name,
                    role: userToToggle.role,
                    editPriority: userToToggle.editPriority || 99,
                    permissions: userToToggle.permissions || {}
                })
            })
            : cloudFetch(`${FIREBASE_ROLES_URL}/${userToToggle.uid}.json`, { method: 'DELETE' });
        revokeOrRestore
            .then(res => {
                if (!res.ok) {
                    alert((willBeActive
                        ? '⚠️ فُعّل الحساب محلياً، لكن لم يُستعد دوره في Firebase (رمز ' + res.status + ').' + String.fromCharCode(10,10) + 'لن يستطيع الدخول حتى ينجح الحفظ.'
                        : '⚠️ عُطّل الحساب محلياً، لكن لم يُحذف دوره من Firebase (رمز ' + res.status + ').' + String.fromCharCode(10,10) + 'سيبقى قادراً على الدخول حتى ينجح الحذف.'));
                }
            })
            .catch(() => {
                alert(willBeActive
                    ? '⚠️ فُعّل الحساب محلياً، لكن تعذّر الوصول إلى Firebase لاستعادة دوره. لن يستطيع الدخول حتى ينجح الحفظ.'
                    : '⚠️ عُطّل الحساب محلياً، لكن تعذّر الوصول إلى Firebase لحذف دوره. سيبقى قادراً على الدخول حتى ينجح الحذف.');
            });
        logAuditEvent((willBeActive ? 'enable_account:' : 'disable_account:') + userToToggle.uid, currentUserName);
    }
    const updatedUsers = systemUsers.map(u => u.id === userId ? { ...u, active: willBeActive } : u);
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
const [cloudSyncStatus, setCloudSyncStatus] = useState({ connected: true, syncing: false, lastSync: null, error: null });
// آخر lastCloudUpdate رآه هذا الجهاز من الخادم — يُقارَن قبل كل حفظ لمنع محو عمل زميل
const knownServerUpdateRef = React.useRef(null);
const lastCloudTimeRef = React.useRef(null);
const isInitialCloudLoadCompleteRef = React.useRef(false);
// حارس عدم التداخل: فعلٌ واحد قد يغيّر حالتين فيُطلق دفعتين متزامنتين
const isPushingRef = React.useRef(false);
const pendingPushRef = React.useRef(false);
// الحزمة الصريحة (إن وُجدت) المؤجَّلة أثناء انشغال الدفع — تُستخدَم عند إعادة المحاولة
// بدل حالة عامة قد تكون التُقطت قبل أن يُطبِّق React تحديث الحالة الذي استدعى هذه الدفعة
// أصلاً، فتُفقَد البيانات المحفوظة للتو صمتاً (وليس فقط UID المستخدم — أي حفظة بحزمة
// صريحة تتزامن مع دفعة أخرى قيد التنفيذ).
const pendingBundleRef = React.useRef(null);
// بصمة آخر حمولة نعلم أنها على الخادم — تمنع إعادة بثّ ما استقبلناه للتو
const lastSyncedSignatureRef = React.useRef(null);
const CLOUD_SIGNATURE_KEYS = ['staffData', 'systemUsersList', 'officialHolidaysList', 'hourlyLeaveRecords', 'overtimeHoursRecords', 'dailyStatusOverrides', 'shiftAnchorDate', 'threeShiftAnchorSquad', 'twoShiftAnchorSquad', 'dataEntryOperator', 'overtimeSelectedIds', 'pendingDeletionRequest'];
const cloudPayloadSignature = (obj) => {
    try {
        return JSON.stringify(CLOUD_SIGNATURE_KEYS.map(k => (obj && obj[k] !== undefined) ? obj[k] : null));
    } catch (e) { return null; }
};

// حارس عدم تداخل جلبات السحابة: الاستطلاع الدوري (كل 5 ثوانٍ) وجلبات تصحيحية فورية
// (بعد الدخول، أو بعد تعارض حفظ) قد تتقاطع زمنياً على اتصال بطيء — جلبتان متزامنتان
// تتنافسان على applyDataBundleToState بلا ترتيب مضمون فتُطبَّق الأحدث ثم الأقدم فوقها
const isFetchingCloudRef = React.useRef(false);
// جلب البيانات السحابية الحية فورياً وتحديث كافة الأجهزة
const fetchCloudData = async () => {
    if (window.location.protocol === 'file:' || !FIREBASE_DB_URL) {
        setCloudSyncStatus({ connected: false, syncing: false, lastSync: 'أوفلاين محلي مستقل' });
        isInitialCloudLoadCompleteRef.current = true;
        return;
    }
    if (isFetchingCloudRef.current) return;
    isFetchingCloudRef.current = true;
    try {
        setCloudSyncStatus(prev => ({ ...prev, syncing: true }));
        // موثَّق عمداً: بيانات الملاك (أسماء وهواتف وعناوين) لم تعد مقروءة للعموم،
        // فقراءتها تحتاج توكن حساب له دور مسند — لذا cloudFetch لا fetch عارياً
        const res = await cloudFetch(FIREBASE_DB_URL + '?t=' + Date.now(), {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
            const cloudData = await res.json();
            if (cloudData && typeof cloudData === 'object') {
                if (cloudData.lastCloudUpdate) {
                    const cloudTime = new Date(cloudData.lastCloudUpdate).getTime();
                    const localTime = lastCloudTimeRef.current ? new Date(lastCloudTimeRef.current).getTime() : 0;
                    // ختم غير صالح (تلف بيانات، أو حقل بصيغة غير متوقعة) يُنتج NaN —
                    // وNaN لا يقارَن أكبر من شيء أبداً، فبلا هذا الفحص يُخزَّن ختماً
                    // فاسداً يُجمِّد المزامنة نهائياً (كل مقارنة لاحقة تفشل بصمت، ملاحظة Codex)
                    if (Number.isFinite(cloudTime) && (!lastCloudTimeRef.current || cloudTime > localTime)) {
                        // الختم يتقدّم فقط حين تُطبَّق اللقطة فعلاً بنجاح — لا مجرد رؤيتها
                        // ولا قبل التأكد من نجاح التطبيق. كان يتقدّم دائماً هنا حتى لو
                        // جاءت staffData فارغة أو غائبة (قراءة عابرة وقت كتابة جهاز آخر
                        // لحزمته الكاملة، أو عطل شبكة جزئي)، فيَظن الجهاز أنه استوعب
                        // أحدث نسخة بينما حالته المحلية (staff، systemUsers،
                        // dailyStatusOverrides...) بقيت كما هي — ثم يُبثّ هذا القِدَم
                        // لاحقاً عند أي حفظ تالٍ من هذا الجهاز فيمحو بصمت ما لا يملكه
                        // محلياً (هكذا اختفى حسابا مستخدمين فعلياً — ليس حذفاً متعمَّداً
                        // بل لقطة قديمة أُعيد بثّها). الآن: لا يتقدّم الختم إلا بعد
                        // applyDataBundleToState فعلاً بلا استثناء، فتُعاد المحاولة
                        // تلقائياً في الاستطلاع التالي (كل 5 ثوانٍ) حتى تصل لقطة سليمة
                        if (cloudData.staffData && Array.isArray(cloudData.staffData) && cloudData.staffData.length > 0) {
                            try {
                                applyDataBundleToState(cloudData);
                                lastCloudTimeRef.current = cloudData.lastCloudUpdate;
                            } catch (applyErr) {
                                console.warn('applyDataBundleToState failed — watermark not advanced, will retry next poll:', applyErr);
                            }
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
        isFetchingCloudRef.current = false;
    }
};

// حزمة المزامنة مبنيّة بدالة لا مقروءة داخل pushDataToCloud مباشرة: الدفع يُستدعى في
// نفس معالِج الحدث بعد setStaff، وإغلاق ذلك العرض يحمل الحالة «قبل» التعديل — فكانت
// الحمولة الضمنية تحمل الملاك القديم وتُعيده إلى السحابة، فيظهر التعديل على الشاشة ثم
// يعود الموقف القديم عند أول مزامنة تالية. كل موضع يعدّل الملاك يمرّر الجديد صراحةً.
const buildCloudBundle = (overrides = {}) => ({
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
    pendingDeletionRequest: pendingDeletionRequest,
    ...overrides
});
// إغلاق آخر عرض «مُثبَّت»: الدفعة المؤجَّلة (أثناء انشغال دفعة أخرى) تُنفَّذ بعد أن
// يطبّق React التحديث، فتُبنى حمولتها من حالة ما بعده لا من إغلاق الدفعة التي أجّلتها.
// التحديث داخل useEffect لا أثناء الرسم: الرسم قد يُلغى فلا تُبثّ حالة لم تُثبَّت أصلاً
const buildCloudBundleRef = React.useRef(null);
React.useEffect(() => { buildCloudBundleRef.current = buildCloudBundle; });

// بث التعديلات مباشرة إلى السحابة الحية لتنعكس لدى الجميع في نفس اللحظة
const pushDataToCloud = async (bundle = null) => {
    // 1. حظر تام وقاطع لأي مزامنة سحابية إذا كان الملف يعمل كـ أوفلاين محلي (file://) أو تم إلغاء رابط السحابة
    if (window.location.protocol === 'file:' || !FIREBASE_DB_URL) {
        return;
    }
    // المستعرض والزائر لا يكتبان شيئاً: الحارس هنا يمنع دورة رفض/خروج لا معنى لها
    if (!currentUserRole || currentUserRole === 'viewer') {
        return;
    }
    // 2. منع رفع الكاش المحلي القديم إلى السحابة قبل إتمام الجلب الأولي للبيانات السحابية
    if (!isInitialCloudLoadCompleteRef.current && !bundle) {
        return;
    }
    // 3. حارس عدم التداخل: دفعتان متزامنتان تُكدّسان نافذتي تحذير وتُطفئان مؤشر المزامنة قبل الأوان.
    // الحزمة الصريحة (إن وُجدت) تُحفَظ لإعادة المحاولة بها بعينها — لا بحالة عامة قد تكون
    // أقدم من التعديل الذي استدعى هذه الدفعة أصلاً.
    if (isPushingRef.current) {
        pendingPushRef.current = true;
        // آخر نداء هو الأحدث نيّةً: دفعة ضمنية تالية تمسح حزمةً صريحة مؤجَّلة قبلها
        // (وإلا أُعيد بثّ لقطتها الأقدم فوق تعديل أحدث منها)، وتُعاد البناء من حالة
        // ما بعد التثبيت عند التنفيذ
        pendingBundleRef.current = bundle;
        return;
    }
    isPushingRef.current = true;
    try {
        setCloudSyncStatus(prev => ({ ...prev, syncing: true }));
        const nowIso = (bundle && bundle.lastCloudUpdate) ? bundle.lastCloudUpdate : new Date().toISOString();
        const dataPayload = { ...(bundle || (buildCloudBundleRef.current || buildCloudBundle)()), lastCloudUpdate: nowIso };
        // عقدة القفل writeClaim ليست حقلاً من حزمة البيانات (لا تدخل بصمة التكرار
        // أدناه)، لكن هذه الكتابة الكاملة تستبدل الجذر بأكمله — فبلا إدراجها هنا
        // صراحة كانت ستُمحى من كل حفظة ناجحة. تُدرَج بنفس ختم هذه الحفظة تحديداً حتى
        // تبقى العقدة موجودة لقراءة إيتاغ الحفظة التالية عليها
        dataPayload.writeClaim = nowIso;

        // لا نُعيد بثّ ما استقبلناه للتو من جهاز آخر: لو كانت الحمولة مطابقة تماماً
        // لآخر ما نعلم أنه على الخادم فليس فيها ما يُحفظ، وبثّها يُنتج قيد تدقيق ولقطة
        // أرشيفية لكل جهاز متصل عن كل حفظة واحدة.
        const payloadSignature = cloudPayloadSignature(dataPayload);
        if (!bundle && payloadSignature !== null && payloadSignature === lastSyncedSignatureRef.current) {
            setCloudSyncStatus(prev => ({ ...prev, syncing: false }));
            return;
        }

        // قراءة تسبق الحفظ: هل كتب زميل شيئاً بعد آخر ما رآه هذا الجهاز؟ وتعذّرها يوقف
        // الحفظ الآن — لا يسمح به صامتاً كما كان، فتعذّر التحقق ليس دليل أمان
        try {
            const stampRes = await cloudFetch(FIREBASE_DB_URL.replace('.json', '/lastCloudUpdate.json') + '?t=' + Date.now());
            if (!stampRes.ok) {
                setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: `تعذّر التحقق من حالة السحابة قبل الحفظ (رمز ${stampRes.status}). لم يصل آخر تعديل — أعد المحاولة.` });
                return;
            }
            const serverStamp = await stampRes.json();
            if (serverStamp && knownServerUpdateRef.current && serverStamp > knownServerUpdateRef.current) {
                setCloudSyncStatus(prev => ({ ...prev, connected: true, syncing: false, error: 'حفظ مستخدم آخر تعديلات بعد آخر تحديث لديك. أعد تحميل الصفحة قبل الحفظ.' }));
                alert('⚠️ حفظ مستخدم آخر تعديلات بعد آخر تحديث وصل إلى جهازك.\n\nلو حفظت الآن ستمحو عمله.\n\nأعد تحميل الصفحة (Ctrl+F5) ثم أعد إدخال تعديلك.');
                return;
            }
        } catch (e) {
            setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: 'تعذّر الاتصال بالسحابة قبل الحفظ. لم يصل آخر تعديل — أعد المحاولة عند عودة الاتصال.' });
            return;
        }

        // مطالبة ذرّية بعقدة قفل مستقلة (writeClaim) — لا بـ lastCloudUpdate نفسها
        // كما كان سابقاً. السبب (ملاحظة Codex بعد حادثة فعلية: اختفاء حسابي مستخدمين):
        // الكتابة على lastCloudUpdate مباشرة هنا كانت تُقدِّم ختمها خطوة كاملة قبل
        // وصول الحزمة الكاملة (المكتوبة لاحقاً أدناه بطلب منفصل) — فأي جهاز يسحب في
        // هذه الثغرة الزمنية الضيقة يرى ختماً جديداً مع staffData/systemUsersList
        // القديمين معاً، ويظنّ أنه استوعب أحدث نسخة فيتوقف عن إعادة السحب لاحقاً رغم
        // أن ما لديه فعلياً قديم — ثم يُعاد بثّ هذا القِدَم عند أول تعديل تالٍ من ذلك
        // الجهاز فيمحو صمتاً ما لا يملكه محلياً. عقدة writeClaim لا يقرأها أحد لغرض
        // التحديث، فتغيّرها المؤقت بمعزل عن باقي الحزمة لا يضرّ أحداً؛ lastCloudUpdate
        // نفسها لا تتغيّر الآن إلا مع الحزمة الكاملة في كتابة واحدة أدناه.
        let claimEtag = null;
        try {
            const claimStampRes = await cloudFetch(FIREBASE_DB_URL.replace('.json', '/writeClaim.json') + '?t=' + Date.now(), {
                headers: { 'X-Firebase-ETag': 'true' }
            });
            if (claimStampRes.ok) {
                // إيتاغ عقدة القفل الحالية: أساس المطالبة الذرّية أدناه (C1)
                claimEtag = claimStampRes.headers.get('ETag');
            }
            // تشخيص مقصور على المدير: هل يُظهر المتصفح فعلاً ترويسة ETag عبر CORS، أم يحجبها
            // ويستأنف الكود الفحص القديم وحده صامتاً؟ سؤال لم يحسمه بحث نظري — يحسمه أول حفظ حقيقي.
            if (window.__IS_ADMIN_DEV_UNLOCKED) {
                console.log(claimEtag
                    ? '[حارس الحفظ] المطالبة الذرّية فعّالة — إيتاغ الخادم: ' + claimEtag
                    : '[حارس الحفظ] لا إيتاغ من الخادم (المتصفح يحجبه أو الخادم لا يُرسله) — يُستأنف الفحص وحده بلا حماية ذرّية.');
            }
        } catch (e) {
            setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: 'تعذّر الاتصال بالسحابة أثناء المطالبة بالحفظ. لم يصل آخر تعديل — أعد المحاولة عند عودة الاتصال.' });
            return;
        }

        // كتابة شرطية (if-match) على عقدة القفل وحدها: الخادم نفسه يقبل واحدة من
        // دفعتين متزامنتين ويرفض الأخرى (412) — لا فحصنا من طرف واحد. خادم لا يُرجع
        // إيتاغ: يُتجاوَز هذا الجزء ويُستأنف بالفحص وحده كما كان سابقاً.
        if (claimEtag) {
            try {
                const claimRes = await cloudFetch(FIREBASE_DB_URL.replace('.json', '/writeClaim.json'), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'if-match': claimEtag },
                    body: JSON.stringify(nowIso)
                });
                if (claimRes.status === 412) {
                    setCloudSyncStatus(prev => ({ ...prev, connected: true, syncing: false, error: 'حفظ مستخدم آخر تعديلات في اللحظة نفسها. أعد تحميل الصفحة قبل الحفظ.' }));
                    alert('⚠️ حفظ مستخدم آخر تعديلات في اللحظة نفسها بالضبط.\n\nلو حفظت الآن ستمحو عمله.\n\nأعد تحميل الصفحة (Ctrl+F5) ثم أعد إدخال تعديلك.');
                    return;
                }
                if (!claimRes.ok) {
                    setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: `تعذّرت المطالبة بختم السحابة (رمز ${claimRes.status}). لم يصل آخر تعديل — أعد المحاولة.` });
                    return;
                }
            } catch (e) {
                setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: 'تعذّر الاتصال بالسحابة أثناء المطالبة بالحفظ. لم يصل آخر تعديل — أعد المحاولة عند عودة الاتصال.' });
                return;
            }
        }

        // بث سريع مباشر عبر fetch بدون keepalive (لتفادي حظر المتصفح للحزم الأكبر من 64KB)
        const res = await cloudFetch(FIREBASE_DB_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataPayload)
        });
        if (res.ok) {
            // الختم المحلي يتقدّم بعد نجاح الكتابة لا قبلها — وإلا ظنّ الجهاز خطأً أن
            // لديه الأحدث بينما حفظه لم يصل، فيتوقف عن سحب تحديثات الزملاء لاحقاً
            lastCloudTimeRef.current = nowIso;
            knownServerUpdateRef.current = nowIso;
            lastSyncedSignatureRef.current = payloadSignature;
            setCloudSyncStatus({ connected: true, syncing: false, lastSync: new Date().toLocaleTimeString('ar-IQ'), error: null });
            logAuditEvent('save_system_bundle', currentUserName);

            // 3. حفظ لقطة أرشيفية تلقائية يومية غير قابلة للإلغاء في الأرشيف السحابي (Immutable Daily
            // Snapshot) — هنا وحده، لا خارج الفرع: لقطة لحفظ لم يصل السحابة فعلاً كانت تُكتب سابقاً
            // فتحمل الأرشيف حالة وهمية وتُفسد لقطة سليمة سابقة لليوم نفسه (ملاحظة Codex)
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
                cloudFetch(`${FIREBASE_BACKUPS_URL}/${todayKey}.json`, {
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
        } else if (res.status === 401 && getStoredAuth()) {
            // التوكن منتهٍ وتعذّر تجديده — الاستمرار يعني العمل على نسخة لا تُحفظ
            setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: 'انتهت جلستك ولم يُحفظ آخر تعديل. يرجى تسجيل الدخول من جديد.' });
            signOutFirebase();
            setCurrentUserRole(null);
            setShowLoginModal(true);
            alert('⛔ انتهت صلاحية جلستك ولم يصل آخر حفظ إلى السحابة.\n\nسجّل الدخول من جديد ثم أعد التعديل.');
        } else {
            setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: `لم يصل آخر حفظ إلى السحابة (رمز ${res.status}). تعديلاتك محفوظة على هذا الجهاز فقط.` });
        }
    } catch (err) {
        console.warn("Could not push to Firebase Cloud:", err);
        setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: 'تعذّر الوصول إلى السحابة. تعديلاتك محفوظة على هذا الجهاز فقط وستُرفع عند عودة الاتصال.' });
    } finally {
        isPushingRef.current = false;
        if (pendingPushRef.current) {
            pendingPushRef.current = false;
            const queuedBundle = pendingBundleRef.current;
            pendingBundleRef.current = null;
            setTimeout(() => pushDataToCloud(queuedBundle), 0);
        }
    }
};

// جلب قائمة اللقطات والنسخ الاحتياطية السحابية والمحلية المتاحة (Time-Machine Snapshots Fetcher)
const fetchAvailableSnapshots = async () => {
    setIsLoadingSnapshots(true);
    setSnapshotsError(null);
    let list = [];
    try {
        if (FIREBASE_BACKUPS_URL && window.location.protocol !== 'file:') {
            // الأرشيف لم يعد مقروءاً بلا توكن: القواعد تشترط حساباً بدور admin أو manager
            const res = await cloudFetch(`${FIREBASE_BACKUPS_URL}.json?t=${Date.now()}`);
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
            } else {
                console.warn('Could not fetch cloud backups: HTTP ' + res.status);
                setSnapshotsError(res.status === 401 || res.status === 403
                    ? `تعذّرت قراءة الأرشيف السحابي: حسابك غير مخوّل أو انتهت جلسته (رمز ${res.status}). المعروض أدناه نسخ هذا الجهاز المحلية فقط.`
                    : `تعذّرت قراءة الأرشيف السحابي (رمز ${res.status}). المعروض أدناه نسخ هذا الجهاز المحلية فقط.`);
            }
        }
    } catch (err) {
        console.warn("Could not fetch cloud backups:", err);
        setSnapshotsError('تعذّر الوصول إلى الأرشيف السحابي. المعروض أدناه نسخ هذا الجهاز المحلية فقط.');
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
        alert('⛔ الاستعادة مخصصة حصرياً لمدير النظام 👑\n\nيمكنك استعراض اللقطات وتنزيلها كملف JSON، أما اعتماد لقطة كقاعدة حية فيبدّل بيانات الشعبة كلها ويبقى بيد المدير.');
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

// المتصفحات تُبطئ مؤقتات التبويب المتوقف في الخلفية (أحياناً لدقيقة كاملة أو أكثر) —
// تبويب تُرك مفتوحاً في الخلفية طويلاً يحمل حالة محلية قديمة (قد لا تشمل مستخدماً أو
// موقفاً أُضيف من جهاز آخر أثناء غيابه)، وأول تعديل عليه فور العودة إليه يُبثّ بحزمة
// كاملة مبنية على هذه الحالة القديمة، فيمحو بصمت ما لا يملكه محلياً. استطلاع فوري عند
// عودة التبويب للظهور يُقلّص هذه الفجوة قبل أن يتاح للمستخدم فرصة التعديل
React.useEffect(() => {
    const onVisible = () => {
        if (document.visibilityState === 'visible') fetchCloudData();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
}, []);
const [showSyncModal, setShowSyncModal] = useState(false);
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
    // فحص وجود الحقل لا صدقه: الآن وقد صار تعديله يدوياً حصرياً (بعد إزالة تعيينه
    // التلقائي عند الدخول)، تفريغه عمداً إلى نص فارغ تعديل شرعي يجب أن يصل لبقية
    // الأجهزة أيضاً — والشرط القديم `if (bundle.dataEntryOperator)` كان يتجاهل
    // النص الفارغ فيُبقي الاسم القديم ظاهراً على الأجهزة الأخرى رغم تفريغه (ملاحظة Codex)
    if (typeof bundle.dataEntryOperator === 'string') {
        setDataEntryOperator(bundle.dataEntryOperator);
        safeStorage.setItem('dataEntryOperator', bundle.dataEntryOperator);
    }
    if (bundle.lastCloudUpdate) {
        knownServerUpdateRef.current = bundle.lastCloudUpdate;
    }
    // حالتنا صارت هي هذه الحزمة، فبصمتها هي آخر ما نعلم أنه على الخادم:
    // أي دفعة تالية مطابقة لها هي صدى لما استقبلناه، لا تعديلاً يستحق البثّ.
    lastSyncedSignatureRef.current = cloudPayloadSignature(bundle);
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


// ===== بوابات الإجراءات الحسّاسة ===== (انظر التعليق المقابل في طبقة الأوفلاين)
const authorizeEmployeeDelete = () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'manager') {
        alert('⛔ حذف منتسب من الملاك مخصص لمدير النظام والإداري.');
        return false;
    }
    return true;
};
const authorizeDirectWipe = () => {
    if (currentUserRole !== 'admin') {
        alert('❌ الرمز السري غير صحيح! تم إلغاء العملية للحماية والأمان.');
        return false;
    }
    return true;
};
const authorizeWipeApproval = () => confirm('⚠️ هل توافق رسمياً على تنفيذ طلب الحذف ومسح كافة البيانات سحابياً؟\n\nهذا الإجراء لا يمكن التراجع عنه.');

// مفتاح جلسة المستخدم في activeSessions: معرّف الحساب الموثّق لا المعرّف المحلي usr_<وقت>.
// صف بلا uid (أُنشئ قبل ميزة الربط) يُطابَق بالجلسة التي تحمل اسمه نفسه، إن كانت واحدة
// فقط — وإلا فصاحبه الداخل فعلاً يظهر «غير متصل» ولا يعمل له «فك القفل». عرض فقط بلا
// أي كتابة: ربطٌ يُكتب في السحابة يتصادم مع الحفظ الكامل للأجهزة الأخرى (ملاحظة Codex).
const sessionKeyFor = (u) => {
    if (u.uid) return u.uid;
    const name = String(u.name || '').trim();
    if (!name) return undefined;
    // الصف الوحيد بلا uid بهذا الاسم في الجدول، والجلسة الوحيدة بالاسم والدور نفسيهما
    const sameNameRows = systemUsers.filter(o => !String(o.uid || '').trim() && String(o.name || '').trim() === name);
    if (sameNameRows.length !== 1) return undefined;
    const keys = Object.keys(activeSessions || {}).filter(k =>
        String((activeSessions[k] || {}).name || '').trim() === name &&
        (activeSessions[k] || {}).role === u.role &&
        !systemUsers.some(o => String(o.uid || '').trim() === k));
    return keys.length === 1 ? keys[0] : undefined;
};
// صاحب الجلسة الحالية: صفّه يُظهر «أنت» بدل زر فك القفل.
const isSelfUser = (u) => { const key = sessionKeyFor(u); return !!key && key === currentUserIdRef.current; };

  return {
    activeSessions,
    authorizeDirectWipe,
    authorizeEmployeeDelete,
    authorizeWipeApproval,
    availableSnapshots,
    buildCloudBundle,
    cancelSessionTakeover,
    canEdit,
    clearDevicePinLock,
    cloudFetch,
    cloudSyncStatus,
    confirmSessionTakeover,
    currentUserIdRef,
    currentUserName,
    currentUserPermissions,
    currentUserRole,
    editingUserId,
    fb_DB_URL: FIREBASE_DB_URL,
    fetchAvailableSnapshots,
    getDevicePinLockFor,
    getDevicePinLocks,
    handleCancelUserEdit,
    handleDeleteUser,
    handleDownloadSnapshot,
    handleEditUserClick,
    handleForceEvictSession,
    handleLogin,
    handleLogout,
    handleOpenUserManagement,
    handlePinLogin,
    handleRestoreSnapshot,
    handleSaveUser,
    handleToggleUserActive,
    isCheckingLogin,
    isDarkTheme,
    isInitialCloudLoadCompleteRef,
    isLoadingSnapshots,
    isSyncingRef,
    isSelfUser,
    knownServerUpdateRef,
    lockedSections,
    logAuditEvent,
    loginEmail,
    loginError,
    loginPassword,
    pendingDeletionRequest,
    pendingTakeover,
    pushDataToCloud,
    pushDataToServer,
    selectedSnapshotPreview,
    sessionKeyFor,
    setCurrentUserRole,
    setDevicePinLock,
    setIsDarkTheme,
    setLoginEmail,
    setLoginPassword,
    setPendingDeletionRequest,
    setSelectedSnapshotPreview,
    setShowLoginPassword,
    setShowRestoreCenterModal,
    setShowSyncModal,
    setShowUserManagementModal,
    setUserFormLocalPart,
    setUserFormManualUid,
    setUserFormName,
    setUserFormPassword,
    setUserFormPerms,
    setUserFormPriority,
    setUserFormRole,
    setUserFormUid,
    showLoginPassword,
    showRestoreCenterModal,
    showSyncModal,
    showUserManagementModal,
    snapshotsError,
    syncStatus,
    systemUsers,
    useAnotherAccount,
    userFormLocalPart,
    userFormManualUid,
    userFormName,
    userFormPassword,
    userFormPerms,
    userFormPriority,
    userFormRole,
    userFormUid,
  };
}
