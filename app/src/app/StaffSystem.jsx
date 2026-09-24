import React from 'react';
import ReactDOM from 'react-dom';   // لـcreatePortal في بطاقة الموظف، لا للتركيب (التركيب في ملف المدخل)
import { FIELD_NAMES_AR, mergeKeyOf, ownKey, ATTENDANCE_PARTS, isValidAttendanceValue, analyzeMergePeriods, analyzeMergeAttendance, analyzeMerge } from '../domain/merge';
import { getJobRank, sortByJobNumber, sortByJobTitleHierarchy, ensureTopTwo, sortByUnit } from '../domain/sorting';
import { CONTRACT_TITLES, isContractEmployee, contractTypeOf, getMissingFields } from '../domain/employees';
import { getWaterSeasonalRate, WATER_LEAVE_TALLY_TYPES, isShiftOnDutyStatus } from '../domain/water';
import { getSafetyStatus, isInSafetyRoster, safetyFilterGroup } from '../domain/safety';
import { PERIOD_TYPES, OPEN_ENDED_PERIOD_TYPES, QUICK_STATUS_OPTIONS, periodsOf, getActivePeriod, periodEndOf, periodsOverlap, periodIdentityOf, periodMergeKeyOf, samePeriodDates, samePeriodExtras, periodPhaseOf, quickPeriodEnd, isLongOrMaternityLeave } from '../domain/periods';
import { ARABIC_INDIC_DIGITS, EXTENDED_ARABIC_INDIC_DIGITS, normalizeArabic, normalizeArabicForSearch, normalizeJobNumber, matchesStaffSearch, guessGender, normalizeGender, getThreeName, getTripleName, normalizeArabicText, ARABIC_ONES, ARABIC_TEENS, ARABIC_TENS, ARABIC_HUNDREDS, numberChunkToArabicWords, arabicManualDaysCount, arabicHoursCount, formatMobileNumber, fixPhoneNumber, expandAbbrev } from '../core/arabic';
import { localDateStr, daysInMonth, getDaysBetweenDates, getArabicDayName, ARABIC_MONTH_NAMES, getArabicMonthLabel, addMonthsClamped, formatDateToString, parseExcelDate, calculateYearsOfService, ISO_DAY } from '../core/dates';
import { SearchCircularProgress } from '../ui/SearchCircularProgress';
import { ICON_PATHS, Icon, SAFETY_VEST_IMG, SAFETY_BOOT_IMG } from '../ui/Icon';
import { Segmented } from '../ui/Segmented';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { PageHeader } from '../ui/PageHeader';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { UnitsScreen } from '../features/units/UnitsScreen';
import { LoginModal } from '../features/auth/LoginModal';
import { EditEmployeeModal } from '../features/employees/EditEmployeeModal';
import { EmployeeCardModal } from '../features/employees/EmployeeCardModal';
import { NewEmployeeFormPrint } from '../features/employees/NewEmployeeFormPrint';
import { HolidaysModal } from '../features/holidays/HolidaysModal';
import { PeriodHistoryModal } from '../features/periods/PeriodHistoryModal';
import { QuickPeriodModal } from '../features/periods/QuickPeriodModal';
import { ReturnPromptModal } from '../features/periods/ReturnPromptModal';
import { RestoreCenterModal } from '../features/restore/RestoreCenterModal';
import { StaffListScreen } from '../features/staffList/StaffListScreen';
import { ShiftConfirmModal } from '../features/shifts/ShiftConfirmModal';
import { HourlyLeaveModal } from '../features/units/HourlyLeaveModal';
import { SquadScheduleModal } from '../features/shifts/SquadScheduleModal';
import { UserManagementModal } from '../features/users/UserManagementModal';
import { WaterMemoModal } from '../features/water/WaterMemoModal';
import { WelcomeSplash } from '../features/auth/WelcomeSplash';
import { PeriodAlerts } from '../features/periods/PeriodAlerts';
import { AppHeader } from '../features/shell/AppHeader';
import { AppNav } from '../features/shell/AppNav';
import { DeletionRequestBanner } from '../features/shell/DeletionRequestBanner';
import { PasteJsonModal } from '../features/backup/PasteJsonModal';
import { MergeModal } from '../features/merge/MergeModal';
import { PreviewModal } from '../features/preview/PreviewModal';
import { DayMatrixPrint } from '../features/units/DayMatrixPrint';
import { safeStorage } from '../core/safeStorage';
import { ensureLibs } from '../core/lazyLibs';
import { buildDatePicker } from '../ui/datePicker';

            // يمنع المتصفح من إعادة موضع التمرير القديم عند إقلاع النظام (فتح الملف أو تحديث
            // الصفحة) — بلا هذا، إعادة تحميل الصفحة وأنت في وسط الجدول تُبقيك هناك بدل بداية الصفحة.
            try { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'; } catch (e) {}

        const { useState, useMemo, useRef } = React;
        
        const LOCATION_REASONS = {
  "نهر بن عمر": "صيانة وتصليح وتنصيب اجهزة التبريد المنفصلة في قسم المختبرات والسيطرة النوعية ومحطة عزل نهر بن عمر واليمامة الرئيسية والحقلية",
  "باب الزبير": "صيانة اجهزة التبريد في موقع باب الزبير ومواقع مراكز البصرة",
  "المركز الثقافي النفطي": "نصب وصيانة وتشغيل اجهزة التبريد المركزي في المركز الثقافي النفطي والمشروع السكني",
  "المكينة": "تشغيل اجهزة التبريد المركزي ومراقبة اجهزة تبريد صالة الهيأة المالية التي تحتوي على اجهزة الصرافات الالية"
};
        const LOCATION_ORDER = ['نهر بن عمر', 'باب الزبير', 'المركز الثقافي النفطي', 'المكينة'];
        const INITIAL_DATA = [];

        // المصنع: يُستدعى مرة واحدة في ملف مدخل كل نسخة بطبقة بياناتها ومكوّنات AuthViews الخاصة
        // بها. هذا الملف لا يستورد أي طبقة بيانات — العزل بين النسختين يقوم على هذا وحده، ويُفحص
        // على الناتج المبني (scripts/check-shell.mjs). الربط مرة واحدة عند التحميل لا كـprop يعني
        // أن الـhook الذي يُستدعى داخل المكوّن ثابت الهوية أبداً، فلا يتبدّل ترتيب الـhooks.
        export function createStaffSystem({ useDataLayer, AuthViews }) {
        function StaffSystem() {
            const [staff, setStaff] = useState(() => {
                const saved = safeStorage.getItem('staffData');
                let parsed = saved ? JSON.parse(saved) : INITIAL_DATA;
                // إصلاح تلقائي لمعالجة المعرّفات المكررة أو المفقودة لتفادي مشاكل Reconciler في React
                if (parsed && parsed.length > 0) {
                    const ids = new Set();
                    let hasDuplicates = false;
                    for (const emp of parsed) {
                        if (!emp.id || ids.has(emp.id)) {
                            hasDuplicates = true;
                            break;
                        }
                        ids.add(emp.id);
                    }
                    if (hasDuplicates) {
                        parsed = parsed.map((emp, index) => ({
                            ...emp,
                            id: 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + index
                        }));
                        safeStorage.setItem('staffData', JSON.stringify(parsed));
                    }
                }
                return parsed;
            });
            
            // حفظ تلقائي عند تغيير البيانات وبثها للسحابة الحية
            React.useEffect(() => {
                if (staff.length > 1 && !isSyncingRef.current && isInitialCloudLoadCompleteRef.current) {
                    safeStorage.setItem('staffData', JSON.stringify(staff));
                    pushDataToCloud();
                }
            }, [staff]);
            const [view, setView] = useState('dashboard');

            // حركة فتح التبويب: تُعاد بضبط الصنف يدوياً لا بـ key={view}.
            // key كان سيُجبر React على إعادة تركيب الشجرة كاملة عند كل تنقّل،
            // فيُفقد حالة أي مكوّن مشترك بين تبويبين (بحث مفتوح، فرز، تمرير).
            //
            // تحذير بنيوي — سبب كل قيد هنا:
            // نوافذ النظام (الدخول، المزامنة، الدمج) مرسومة داخل <main> بـ z-50،
            // وتعلو شاشة الترحيب (z-50 أيضاً، خارج main) بترتيب DOM وحده لا بالرقم.
            // وأي حركة CSS تُنشئ «سياق تكديس» (stacking context) على حاويتها، فيصير
            // z-50 الداخلي نسبياً إليها وتُحبس النوافذ تحت شاشة الترحيب. لذلك:
            //   • لا حركة عند أول رسم — وقتها شاشة الترحيب ونافذة الدخول فوق المحتوى.
            //   • يُنزع الصنف فور انتهاء الحركة، فلا يبقى العنصر سياق تكديس بعدها.
            // كسرَ إغفالُ هذا تسجيلَ الدخول كلياً قبل أن يلتقطه اختبار المتصفح.
            const mainContentRef = React.useRef(null);
            const tableWrapperRef = React.useRef(null);
            const isFirstViewRenderRef = React.useRef(true);
            // طبقة تمرير منفصلة بـuseLayoutEffect لا useEffect: التمرير نافذة (window) لا حاوية
            // داخلية، والتبديل بين التبويبات لم يكن يُعيده للأعلى تلقائياً — فمن كان قد مرّر لأسفل
            // في تبويب يرى التالي يبدأ من منتصفه أو نهايته. useEffect العادي ينفّذ بعد الرسم على
            // الشاشة فيظهر القفز للأعلى كوميض ملحوظ؛ useLayoutEffect ينفّذه قبل الرسم فلا وميض.
            // بلا حراسة أول رسم أو نافذة مفتوحة (خلافاً لتأثير حركة التبويب تحته): التمرير للأعلى
            // غير ضارّ في الحالتين، ولا يمسّ تمرير أي حاوية داخلية فرعية بتمريرها الخاص.
            React.useLayoutEffect(() => {
                window.scrollTo({ top: 0, behavior: 'auto' });
            }, [view]);
            React.useEffect(() => {
                const el = mainContentRef.current;
                if (!el) return;
                if (isFirstViewRenderRef.current) { isFirstViewRenderRef.current = false; return; }
                // نافذة مفتوحة داخل الحاوية لحظة التبديل: تُترك بلا حركة بدل حبسها في سياق تكديس.
                // هذه الحالة الوحيدة القابلة للحدوث فعلاً — بقية النوافذ تُفتح بنقرة المستخدم،
                // ولا نقرة ممكنة خلال 170ms التي تلي نقرته على التبويب.
                if (el.querySelector('.fixed.inset-0')) return;

                el.classList.remove('tab-enter');
                void el.offsetWidth; // قراءة إجبارية تُنهي الحركة السابقة، وبدونها لا تُعاد
                el.classList.add('tab-enter');

                // اسم الحركة مفحوص: أحداث حركات الأبناء تصعد إلى هنا أيضاً
                const onEnd = (e) => { if (e.animationName === 'tabEnter') el.classList.remove('tab-enter'); };
                el.addEventListener('animationend', onEnd);
                // احتياط: مع «تقليل الحركة» لا يقع حدث انتهاء أصلاً
                const t = setTimeout(() => el.classList.remove('tab-enter'), 400);
                return () => { clearTimeout(t); el.removeEventListener('animationend', onEnd); };
            }, [view]);
            // آخر شريحة زارها المستخدم في كل قسم — العودة إلى «الملاك» تعيده إلى شريحته
            // لا إلى «الكل» دائماً، وهو ما يتوقّعه من يعمل على «المناوبين» طوال اليوم
            const [sectionMemory, setSectionMemory] = useState({});
            const [showUserMenu, setShowUserMenu] = useState(false);
            // ارتفاع الشريط الملتصق الحيّ في متغيّر CSS على <html> (--nav-h). يتغيّر بين سطر وسطرين
            // (صفّ شرائح الملاك أو شاشات الدوام) ويلتفّ على الشاشات الضيّقة، فكل ما يلتصق تحته أو
            // يقفز مراعياً له يقرؤه من هنا لا من رقم ثابت. رقمان ثابتان (68px للوحة الوحدات و150px
            // للقفز إلى وحدة) دفنا 37px من اللوحة و20px من عنوان الوحدة حين صار الشريط سطرين — مقيس.
            const navHeightObserverRef = React.useRef(null);
            const observeNavHeight = React.useCallback((el) => {
                if (navHeightObserverRef.current) {
                    navHeightObserverRef.current.disconnect();
                    navHeightObserverRef.current = null;
                }
                if (!el) return;
                const publish = () => document.documentElement.style.setProperty(
                    '--nav-h', Math.round(el.getBoundingClientRect().height) + 'px');
                publish();
                if (typeof ResizeObserver !== 'undefined') {
                    navHeightObserverRef.current = new ResizeObserver(publish);
                    navHeightObserverRef.current.observe(el);
                }
            }, []);

            const [selectedUnit, setSelectedUnit] = useState(null);
            const [selectedSafetyIds, setSelectedSafetyIds] = useState([]);
            const [bulkSafetyDate, setBulkSafetyDate] = useState('');
            // آخر تحديث جماعي لتاريخ التجهيز، للتراجع عنه: { prev: {id: التاريخ السابق}, applied, count }
            const [safetyUndo, setSafetyUndo] = useState(null);
            const [overtimeIds, setOvertimeIds] = useState(() => {
                const saved = safeStorage.getItem('overtimeSelectedIds');
                return saved ? JSON.parse(saved) : [];
            });
            // شهر كشف الساعات الإضافية الموحد (YYYY-MM): يظهر في عنوانه، ولا يُحفظ (الشهر الحالي عند كل فتح)
            const [overtimeListMonth, setOvertimeListMonth] = useState(() => localDateStr().slice(0, 7));
            const [previewTitle, setPreviewTitle] = useState('');

            // دالة الإشعارات المخصصة للتنبيهات السريعة
            const showCustomAlert = (msg, type = 'success') => {
                alert(msg);
            };

            // ===== الموقف اليومي والمطابقة للوجبات =====
            const [unitsSubView, setUnitsSubView] = useState('roster'); // 'roster' (ملاك الوحدات) or 'dailyStatus' (الموقف اليومي)
            const [selectedDailyUnitTab, setSelectedDailyUnitTab] = useState('all');
            const [pendingShiftConfirm, setPendingShiftConfirm] = useState(null);
            
            // ===== منظم الموقف ومدخل البيانات =====
            // ===== قائمة وتاريخ العطل الرسمية المعرفة =====
            

            const [officialHolidays, setOfficialHolidays] = useState(() => {
                const saved = safeStorage.getItem('officialHolidaysList');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed)) {
                            if (!parsed.includes('2026-08-25')) parsed.push('2026-08-25');
                            return parsed;
                        }
                    } catch(e) {}
                }
                return ['2026-08-03', '2026-08-04', '2026-08-25'];
            });
            React.useEffect(() => {
                safeStorage.setItem('officialHolidaysList', JSON.stringify(officialHolidays));
            }, [officialHolidays]);

            // حالات نافذة العطل الرسمية والأعياد المتعددة الأيام
            const [showHolidaysModal, setShowHolidaysModal] = useState(false);
            const [holidayRangeStart, setHolidayRangeStart] = useState('');
            const [holidayRangeEnd, setHolidayRangeEnd] = useState('');

            // ===== سجل الإجازات الزمنية بالساعات وساعات الإضافي =====
            const [hourlyLeaveRecords, setHourlyLeaveRecords] = useState(() => {
                const saved = safeStorage.getItem('hourlyLeaveRecords');
                return saved ? JSON.parse(saved) : {};
            });
            const [overtimeHoursRecords, setOvertimeHoursRecords] = useState(() => {
                const saved = safeStorage.getItem('overtimeHoursRecords');
                return saved ? JSON.parse(saved) : {};
            });
            // توقيت الإجازة الزمنية (بداية/أثناء/نهاية الدوام) بجانب ساعاتها — انظر domain/hourlyLeave
            const [hourlyLeaveTimings, setHourlyLeaveTimings] = useState(() => {
                try {
                    const saved = JSON.parse(safeStorage.getItem('hourlyLeaveTimings') || '{}');
                    return saved && typeof saved === 'object' ? saved : {};
                } catch (e) { return {}; }
            });
            // الإجازة الزمنية قيد الإدخال في نافذتها: { empId, dateStr, empName, hours, timing }
            const [pendingHourlyLeave, setPendingHourlyLeave] = useState(null);

            React.useEffect(() => {
                safeStorage.setItem('hourlyLeaveRecords', JSON.stringify(hourlyLeaveRecords));
            }, [hourlyLeaveRecords]);
            React.useEffect(() => {
                safeStorage.setItem('overtimeHoursRecords', JSON.stringify(overtimeHoursRecords));
            }, [overtimeHoursRecords]);
            // ===== سجلّ المحذوفات (tombstones) =====
            // ما يحذفه المستخدم من جهازه يُسجَّل: الفترة المؤرخة بهويتها، والموقف اليومي بـ«تاريخ::رقم وظيفي» (المعرّفات
            // الداخلية تختلف بين الأجهزة). يُحفظ ويُصدَّر مع النسخة الاحتياطية، وفي الدمج لا يُؤشَّر المحذوف إن عاد في ملف
            // أقدم ويُنبَّه إليه. بدونه يعود يوم حُذف عمداً مؤشَّراً، فإن طُبِّق ورُفعت القاعدة صار متطابقاً في كل النسخ ولا يُعرض أبداً.
            const [mergeTombstones, setMergeTombstones] = useState(() => {
                try {
                    const saved = JSON.parse(safeStorage.getItem('mergeTombstones') || 'null');
                    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
                        return { periods: saved.periods || {}, dailyStatus: saved.dailyStatus || {}, employees: saved.employees || {} };
                    }
                } catch (e) {}
                return { periods: {}, dailyStatus: {}, employees: {} };
            });
            React.useEffect(() => {
                safeStorage.setItem('mergeTombstones', JSON.stringify(mergeTombstones));
            }, [mergeTombstones]);
            const tombstoneKeyOfDay = (date, jobNumber) => {
                const job = normalizeJobNumber(jobNumber);
                return job && date ? `${date}::${job}` : '';
            };
            // إضافة تذاكر وإزالتها دفعة واحدة — تُستدعى من معالجات الأحداث وحدها، لا أثناء الرسم
            const updateTombstones = ({ addPeriods = [], addDays = [], removePeriods = [], removeDays = [], addEmployees = [], removeEmployees = [] }) => {
                const clean = (list) => list.filter(Boolean);
                const ap = clean(addPeriods), ad = clean(addDays), rp = clean(removePeriods), rd = clean(removeDays);
                // الموظف يُسجَّل برقمه الوظيفي (المعرّفات الداخلية تختلف بين الأجهزة) ومعه اسمه:
                // بعد اختفائه من القاعدة لم يبقَ مكان تُقرأ منه هويته لعرضها في نافذة المزامنة
                const ae = addEmployees.filter(x => x && String(x.job || '').trim());
                const re = clean(removeEmployees.map(x => String(x || '').trim()));
                if (ap.length + ad.length + rp.length + rd.length + ae.length + re.length === 0) return;
                const at = new Date().toISOString();
                setMergeTombstones(prev => {
                    const next = { periods: { ...(prev.periods || {}) }, dailyStatus: { ...(prev.dailyStatus || {}) }, employees: { ...(prev.employees || {}) } };
                    ap.forEach(k => { next.periods[k] = { at }; });
                    ad.forEach(k => { next.dailyStatus[k] = { at }; });
                    rp.forEach(k => { delete next.periods[k]; });
                    rd.forEach(k => { delete next.dailyStatus[k]; });
                    ae.forEach(x => { next.employees[String(x.job).trim()] = { at, name: x.name || '' }; });
                    re.forEach(k => { delete next.employees[k]; });
                    return next;
                });
            };

            const toggleOfficialHolidayDate = (dateStr) => {
                setOfficialHolidays(prev => {
                    const next = prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr];
                    safeStorage.setItem('officialHolidaysList', JSON.stringify(next));
                    pushDataToCloud({
                        staffData: staff,
                        systemUsersList: systemUsers,
                        officialHolidaysList: next,
                        hourlyLeaveRecords: hourlyLeaveRecords,
                        hourlyLeaveTimings: hourlyLeaveTimings,
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
                    return next;
                });
            };

            // إضافة نطاق عطل رسمية متعددة الأيام (مثل عطلة العيد)
            const addOfficialHolidayRange = (startStr, endStr) => {
                if (!startStr || !endStr) {
                    alert('⚠️ يرجى تحديد تاريخ البداية وتاريخ النهاية أولاً.');
                    return;
                }
                const start = new Date(startStr);
                const end = new Date(endStr);
                if (start > end) {
                    alert('⚠️ تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية.');
                    return;
                }

                const newDates = [];
                let cur = new Date(start);
                while (cur <= end) {
                    const y = cur.getFullYear();
                    const m = String(cur.getMonth() + 1).padStart(2, '0');
                    const d = String(cur.getDate()).padStart(2, '0');
                    newDates.push(`${y}-${m}-${d}`);
                    cur.setDate(cur.getDate() + 1);
                }

                setOfficialHolidays(prev => {
                    const next = Array.from(new Set([...prev, ...newDates]));
                    safeStorage.setItem('officialHolidaysList', JSON.stringify(next));
                    pushDataToCloud({
                        staffData: staff,
                        systemUsersList: systemUsers,
                        officialHolidaysList: next,
                        hourlyLeaveRecords: hourlyLeaveRecords,
                        hourlyLeaveTimings: hourlyLeaveTimings,
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
                    return next;
                });
                alert(`✅ تم إضافة ${newDates.length} أيام كـ عطل رسمية بنجاح!`);
                setHolidayRangeStart('');
                setHolidayRangeEnd('');
            };

            const setEmployeeHourlyLeave = (empId, dateStr, hours, timing) => {
                // التوقيت يتبع الساعات: يُحذف معها، ويُستبدل إن مُرِّر، ويبقى كما هو إن لم يُمرَّر
                setHourlyLeaveTimings(prev => {
                    const cur = prev[dateStr] && prev[dateStr][empId];
                    const want = !(hours > 0) ? undefined : (timing === undefined ? cur : (timing || undefined));
                    if (cur === want) return prev;
                    const next = { ...prev, [dateStr]: { ...(prev[dateStr] || {}) } };
                    if (want) next[dateStr][empId] = want;
                    else {
                        delete next[dateStr][empId];
                        if (Object.keys(next[dateStr]).length === 0) delete next[dateStr];
                    }
                    return next;
                });
                setHourlyLeaveRecords(prev => {
                    const next = { ...prev };
                    if (!next[dateStr]) next[dateStr] = {};
                    if (!hours || hours <= 0) {
                        delete next[dateStr][empId];
                        if (Object.keys(next[dateStr]).length === 0) delete next[dateStr];
                    } else {
                        next[dateStr][empId] = hours;
                    }
                    return next;
                });
            };

            const setEmployeeOvertimeHours = (empId, dateStr, hours) => {
                setOvertimeHoursRecords(prev => {
                    const next = { ...prev };
                    if (!next[dateStr]) next[dateStr] = {};
                    if (!hours || hours <= 0) {
                        delete next[dateStr][empId];
                        if (Object.keys(next[dateStr]).length === 0) delete next[dateStr];
                    } else {
                        next[dateStr][empId] = hours;
                    }
                    return next;
                });
            };

            const [dataEntryOperator, setDataEntryOperator] = useState(() => {
                return safeStorage.getItem('dataEntryOperator') || 'م. أسامة خليل هاشم';
            });
            React.useEffect(() => {
                safeStorage.setItem('dataEntryOperator', dataEntryOperator);
            }, [dataEntryOperator]);

            // ===== موقف الفترة (من - إلى) =====
            const [periodStartDate, setPeriodStartDate] = useState(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                return `${year}-${month}-01`;
            });
            const [periodEndDate, setPeriodEndDate] = useState(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth() + 1;
                const lastDay = new Date(year, month, 0).getDate();
                return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            });
            const [periodUnitFilter, setPeriodUnitFilter] = useState('all');
            const [periodWorkTypeFilter, setPeriodWorkTypeFilter] = useState('all');
            const [periodShowMatrix, setPeriodShowMatrix] = useState(false);
            const [showSquadSchedule, setShowSquadSchedule] = useState(false);
            const [periodSearchQuery, setPeriodSearchQuery] = useState('');
            const [expandedEmpPeriod, setExpandedEmpPeriod] = useState(null);

            const setPeriodPreset = (preset) => {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                
                if (preset === 'currentMonth') {
                    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                    const lastDay = new Date(year, month + 1, 0).getDate();
                    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                    setPeriodStartDate(start);
                    setPeriodEndDate(end);
                } else if (preset === 'prevMonth') {
                    const pDate = new Date(year, month - 1, 1);
                    const pYear = pDate.getFullYear();
                    const pMonth = pDate.getMonth();
                    const start = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-01`;
                    const lastDay = new Date(pYear, pMonth + 1, 0).getDate();
                    const end = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                    setPeriodStartDate(start);
                    setPeriodEndDate(end);
                } else if (preset === 'last7') {
                    const endD = new Date();
                    const startD = new Date();
                    startD.setDate(endD.getDate() - 6);
                    setPeriodStartDate(`${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`);
                    setPeriodEndDate(`${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`);
                } else if (preset === 'last30') {
                    const endD = new Date();
                    const startD = new Date();
                    startD.setDate(endD.getDate() - 29);
                    setPeriodStartDate(`${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`);
                    setPeriodEndDate(`${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`);
                }
            };
            const changeReportDateByDays = (days) => {
                if (!dailyReportDate) return;
                const parts = dailyReportDate.split('-');
                if (parts.length !== 3) return;
                const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                d.setDate(d.getDate() + days);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setDailyReportDate(`${yyyy}-${mm}-${dd}`);
            };
            const [dailyStatusOverrides, setDailyStatusOverrides] = useState(() => {
                const saved = safeStorage.getItem('dailyStatusOverrides');
                return saved ? JSON.parse(saved) : {};
            });
            const [anchorDate, setAnchorDate] = useState(() => {
                return safeStorage.getItem('shiftAnchorDate') || '2026-07-05';
            });
            const [threeShiftAnchorSquad, setThreeShiftAnchorSquad] = useState(() => {
                return safeStorage.getItem('threeShiftAnchorSquad') || 'A';
            });
            const [twoShiftAnchorSquad, setTwoShiftAnchorSquad] = useState(() => {
                return safeStorage.getItem('twoShiftAnchorSquad') || 'A';
            });
            const [dailyReportDate, setDailyReportDate] = useState(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            });

            // حفظ وبث الموقف اليومي تلقائياً للسحابة الحية لتعميمه على كافة أجهزة وموبايلات الشعبة فورياً
            React.useEffect(() => {
                safeStorage.setItem('dailyStatusOverrides', JSON.stringify(dailyStatusOverrides));
                if (!isSyncingRef.current && isInitialCloudLoadCompleteRef.current && (Object.keys(dailyStatusOverrides).length > 0 || staff.length > 0)) {
                    pushDataToCloud();
                }
            }, [dailyStatusOverrides]);

            // حفظ وبث الساعات الإضافية والإجازات الزمنية والعطل للسحابة فورياً
            React.useEffect(() => {
                safeStorage.setItem('officialHolidaysList', JSON.stringify(officialHolidays));
                safeStorage.setItem('hourlyLeaveRecords', JSON.stringify(hourlyLeaveRecords));
                safeStorage.setItem('hourlyLeaveTimings', JSON.stringify(hourlyLeaveTimings));
                safeStorage.setItem('overtimeHoursRecords', JSON.stringify(overtimeHoursRecords));
                if (!isSyncingRef.current && isInitialCloudLoadCompleteRef.current && staff.length > 0) {
                    pushDataToCloud();
                }
            }, [officialHolidays, hourlyLeaveRecords, hourlyLeaveTimings, overtimeHoursRecords]);

            React.useEffect(() => {
                safeStorage.setItem('shiftAnchorDate', anchorDate);
                safeStorage.setItem('threeShiftAnchorSquad', threeShiftAnchorSquad);
                safeStorage.setItem('twoShiftAnchorSquad', twoShiftAnchorSquad);
                if (!isSyncingRef.current && isInitialCloudLoadCompleteRef.current && staff.length > 0) {
                    pushDataToCloud();
                }
            }, [anchorDate, threeShiftAnchorSquad, twoShiftAnchorSquad]);

            // ----------------------------------------------------
            // محرك المزامنة حياً مع السيرفر المحلي للشعبة (Local Live Sync Engine)
            // ----------------------------------------------------
            
            // @data-layer:start

            // @data-layer:end




            React.useEffect(() => {
                setSelectedSafetyIds([]);
                setBulkSafetyDate('');
                if (view !== 'units') {
                    setUnitsSubView('roster');
                }
            }, [view]);
            const [search, setSearch] = useState('');
            const [statsQuery, setStatsQuery] = useState('');
            const [advancedSearch, setAdvancedSearch] = useState({ jobTitle:'', location:'', unit:'', yearsOfService:'' });
            const [advancedResults, setAdvancedResults] = useState([]);
            const [eduSearch, setEduSearch] = useState({ education:'', graduationYear:'', hireYear:'' });
            const [eduResults, setEduResults] = useState([]);

            // ===== البحث الموحد =====
            const [unifiedQuery, setUnifiedQuery] = useState('');
            const [unifiedFilters, setUnifiedFilters] = useState({ location:'', unit:'', selectedUnits:[], workType:'', education:'', yearsOfService:'', graduationYear:'', hireYear:'', gender:'', hasMissingInfo:'' });
            const [showUnitDropdown, setShowUnitDropdown] = useState(false);
            // نتائج البحث والاستعلام تُحسب مرة واحدة عند الضغط على "بحث" وتُخزَّن كلقطة.
            // لكن الحفظ يُنشئ كائناً جديداً للموظف داخل staff، فتبقى اللقطة ممسكة بالكائن القديم
            // وتعرض بياناته السابقة حتى إعادة تحميل الصفحة. لذا تُخزَّن اللقطة خاماً، ويُعاد
            // ربطها بأحدث نسخة من كل موظف عند كل رسم، مع إسقاط من حُذف من الملاك.
            const [unifiedResultsRaw, setUnifiedResults] = useState(null);
            const unifiedResults = useMemo(() => {
                if (unifiedResultsRaw === null) return null;
                const byId = new Map(staff.map(s => [s.id, s]));
                return unifiedResultsRaw.map(r => (r && r.id) ? byId.get(r.id) : r).filter(Boolean);
            }, [unifiedResultsRaw, staff]);
            const [editingEmployee, setEditingEmployee] = useState(null);
            const [selectedEmployeeCard, setSelectedEmployeeCard] = useState(null);
            // صنف عزل طباعة البطاقة لا يبقى بعد إغلاقها: لو بقي (متصفح لم يُطلق afterprint)
            // لطبّق عزله على أي طباعة تالية — المصفوفة مثلاً — فأخرجها بيضاء.
            React.useEffect(() => {
                if (!selectedEmployeeCard) document.body.classList.remove('printing-card');
            }, [selectedEmployeeCard]);
            
    
            const [cardFieldsVisibility, setCardFieldsVisibility] = useState({
                mobile: true,
                jobNumber: true,
                workType: true,
                education: true,
                bloodType: true,
                safetySizes: true
            });
            const [showFieldCustomizer, setShowFieldCustomizer] = useState(false);
            const [showEditModal, setShowEditModal] = useState(false);
            const [showWelcome, setShowWelcome] = useState(true);
            const [showLoginModal, setShowLoginModal] = useState(false);

            // رمز الدخول الرباعي — حالات شاشة الدخول السريع وعرض إتاحته بعد أول دخول كامل
            // الأوفلاين لا يستعمل شيئاً من حالات الرمز أدناه (مكوّناتها المقابلة في AuthViews
            // تُعيد null)، وتبقى معلنة هنا بلا شرط حتى يظل نصّ الجسم واحداً في النسختين.
            const [showPinScreen, setShowPinScreen] = useState(false);
            // الحساب المختار من قائمة الجهاز؛ يُملأ تلقائياً حين يكون على الجهاز حساب واحد فقط
            const [selectedPinUid, setSelectedPinUid] = useState(null);
            const [pinInput, setPinInput] = useState('');
            const [pinError, setPinError] = useState('');
            const [pinAttempts, setPinAttempts] = useState(0);
            const [showSetPinOffer, setShowSetPinOffer] = useState(false);
            const [pendingPinOfferUser, setPendingPinOfferUser] = useState(null);

            // طبقة البيانات: كل نسخة تستوردها في أعلى ملفها باسم useDataLayer، فيبقى نصّ الاستدعاء
            // هنا واحداً. ما لا تُوفّره نسخة يأتي undefined ولا يقرؤه إلا مكوّن AuthViews الخاص
            // بالنسخة الأخرى، وهو لا يُركَّب فيها أصلاً.
            const {
                fb_DB_URL: FIREBASE_DB_URL,
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
                fetchAvailableSnapshots,
                getDevicePinLockFor,
                getDevicePinLocks,
                getLocalOfflineAdminPin,
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
                isSelfUser,
                isSyncingRef,
                knownServerUpdateRef,
                lockedSections,
                logAuditEvent,
                loginEmail,
                loginError,
                loginInputPin,
                loginPassword,
                pendingDeletionRequest,
                pendingTakeover,
                pushDataToCloud,
                pushDataToServer,
                revealedPinUsers,
                selectedSnapshotPreview,
                sessionKeyFor,
                setCurrentUserRole,
                setDevicePinLock,
                setIsDarkTheme,
                setLoginEmail,
                setLoginInputPin,
                setLoginPassword,
                setPendingDeletionRequest,
                setRevealedPinUsers,
                setSelectedSnapshotPreview,
                setShowLoginPassword,
                setShowRestoreCenterModal,
                setShowSyncModal,
                setShowUserManagementModal,
                setShowUserPins,
                setUserFormLocalPart,
                setUserFormManualUid,
                setUserFormName,
                setUserFormPassword,
                setUserFormPerms,
                setUserFormPin,
                setUserFormPriority,
                setUserFormRole,
                setUserFormUid,
                showLoginPassword,
                showRestoreCenterModal,
                showSyncModal,
                showUserManagementModal,
                showUserPins,
                snapshotsError,
                syncStatus,
                systemUsers,
                updateLocalOfflineAdminPin,
                useAnotherAccount,
                userFormLocalPart,
                userFormManualUid,
                userFormName,
                userFormPassword,
                userFormPerms,
                userFormPin,
                userFormPriority,
                userFormRole,
                userFormUid,
            } = useDataLayer({
                anchorDate,
                dailyStatusOverrides,
                dataEntryOperator,
                hourlyLeaveRecords,
                hourlyLeaveTimings,
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
                setHourlyLeaveTimings,
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
            });


            // شاشة الترحيب (الشعار واسم الشعبة) تبقى الأولى دائماً كالمعتاد، وبعدها فقط تُقرَّر
            // الوجهة: جلسة محفوظة ورمز مضبوط لصاحبها ⇒ شاشة الرمز السريع، وإلا الدخول الكامل.
            // ملاحظة: pinGateOpenRef يُغلَق أصلاً منذ الرسم الأول (أعلاه)، فلا فرق أمنياً بين
            // إظهار شاشة الرمز فوراً أو بعد ضغطة — الغلق لا يعتمد على أي منهما.
            const proceedFromWelcome = AuthViews.makeWelcomeAction({ getDevicePinLocks, setShowLoginModal, setSelectedPinUid, setPinInput, setPinError, setPinAttempts, setShowPinScreen });

            // شاشة الترحيب: Enter يفتح الوجهة المناسبة كما لو ضُغط الزر — نافذة الدخول الكامل
            // نموذج (form) فيُرسله Enter تلقائياً بلا حاجة لمعالجة إضافية هناك؛ شاشة الرمز ليست
            // كذلك (زر عادي) فتحتاج هذا المعالج ليعمل فيها Enter أيضاً
            React.useEffect(() => {
                if (!showWelcome || showLoginModal || showPinScreen) return;
                const onKeyDown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        proceedFromWelcome();
                    }
                };
                window.addEventListener('keydown', onKeyDown);
                return () => window.removeEventListener('keydown', onKeyDown);
            }, [showWelcome, showLoginModal, showPinScreen]);
            const [showPreview, setShowPreview] = useState(false);
            const [showPrintForm, setShowPrintForm] = useState(false);
            const [previewData, setPreviewData] = useState([]);
            const [visiblePreviewColumns, setVisiblePreviewColumns] = useState(['الرقم الوظيفي', 'العنوان الوظيفي']);
            const [exporting, setExporting] = useState(false);

            const ALL_CUSTOM_COLUMNS = [
                'الرقم الوظيفي', 'العنوان الوظيفي', 'القسم', 'الشعبة', 'الموقع', 
                'الوحدة', 'طبيعة العمل', 'الوجبة', 'هاتف العمل', 'التولد', 'رقم العمل', 
                'تاريخ التعيين', 'التحصيل الدراسي', 'سنة التخرج', 'الاختصاص', 
                'الجنس', 'التوطين', 'النقال', 'الحالة', 'أيام الإجازة', 
                'قياس البدلة', 'قياس حذاء السلامة', 'تاريخ آخر تجهيز', 'البريد الإلكتروني', 'هاتف احد ذوي الموظف', 'عنوان السكن'
            ];
            const fileInputRef = useRef(null);
            const isCustomizable = ['all', 'units', 'dashboard'].includes(view);


            // الوجبات المستلمة في يوم ما من دورة المناوبة المعتمدة وحدها — بلا إجازات ولا تعديلات فردية.
            // مطابقة حرفياً للدورة في getEmployeeDefaultNaturalStatus: الثلاثية وجبة واحدة 24 ساعة،
            // والثنائية صباحي + مسائي بالتسلسل A/B ثم C/A ثم D/C ثم B/D.
            const getSquadsOnDuty = (dateStr) => {
                const diffDays = getDaysBetweenDates(dateStr, anchorDate);
                const squads = ['A', 'B', 'C', 'D'];
                const idxAnchor = squads.indexOf(threeShiftAnchorSquad);
                const triple = idxAnchor === -1 ? '' : squads[(idxAnchor + (diffDays % 4) + 4) % 4];
                const squadToDayMap = { 'A': 1, 'C': 2, 'D': 3, 'B': 4 };
                const anchorDay = squadToDayMap[twoShiftAnchorSquad] || 1;
                const cycleDay = ((anchorDay - 1 + diffDays) % 4 + 4) % 4 + 1;
                const doubleByDay = { 1: ['A', 'B'], 2: ['C', 'A'], 3: ['D', 'C'], 4: ['B', 'D'] };
                return { triple, morning: doubleByDay[cycleDay][0], evening: doubleByDay[cycleDay][1] };
            };

            // ورقة تعريفية بأفراد كل وجبة — من هم بالاسم، اليوم، لا مرتبطة بفترة معينة. الوجبة A في
            // نهر بن عمر (ثلاثية) مجموعة أشخاص مختلفة تماماً عن الوجبة A في بقية الوحدات (ثنائية)،
            // فتُحسَب المجموعتان منفصلتين رغم تطابق حرف الوجبة.
            // المناوبة الثنائية تجمع أكثر من وحدة تنظيمية (باب الزبير، المركز الثقافي، المكينة)،
            // فتُقسَّم أسماء كل وجبة داخلها حسب الوحدة — نفس ترتيب الوحدات المعتمد في مذكرة الماء (سطر 5889).
            const DOUBLE_DUTY_UNIT_ORDER = ['تبريد باب الزبير', 'تبريد المركز الثقافي', 'تبريد المكينة'];
            const squadRosters = useMemo(() => {
                const mk = () => ({ A: [], B: [], C: [], D: [] });
                const triple = mk(), doubleFlat = mk();
                staff.forEach(s => {
                    if (s.workType !== 'مناوب' || s.status !== 'نشط') return;
                    const bucket = (s.location && s.location.includes('نهر بن عمر')) ? triple : doubleFlat;
                    if (bucket[s.squad]) bucket[s.squad].push({ id: s.id, name: s.name, unit: String(s.unit || '').trim() || 'غير محدد' });
                });
                Object.values(triple).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'ar')));
                const double = mk();
                Object.keys(doubleFlat).forEach(q => {
                    // Object.create(null): بيانات الوحدة قد تصل من استيراد JSON/Excel خارجي غير مقيَّد
                    // بالقائمة المنسدلة، فلا يصح استخدام كائن عادي قد يصطدم بمفاتيح موروثة مثل __proto__.
                    const byUnit = Object.create(null);
                    doubleFlat[q].forEach(e => { (byUnit[e.unit] || (byUnit[e.unit] = [])).push(e); });
                    Object.values(byUnit).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'ar')));
                    const orderedUnits = [
                        ...DOUBLE_DUTY_UNIT_ORDER.filter(u => byUnit[u]),
                        ...Object.keys(byUnit).filter(u => !DOUBLE_DUTY_UNIT_ORDER.includes(u)).sort((a, b) => a.localeCompare(b, 'ar'))
                    ];
                    double[q] = orderedUnits.map(u => ({ unit: u, employees: byUnit[u] }));
                });
                return { triple, double };
            }, [staff]);









            // تنبيهات الفترات: ما يوشك على الانتهاء، وما انتهى ولم تُؤكَّد المباشرة.
            // يُحسب من الفترات في كل رسم — لا تخزين ولا وظيفة خلفية.
            const periodAlerts = React.useMemo(() => {
                const today = localDateStr();
                const soonLimit = localDateStr(Date.now() + 3 * 86400000);
                const endingSoon = [];
                const endedUnconfirmed = [];
                (staff || []).forEach(emp => {
                    periodsOf(emp).forEach(p => {
                        if (!p || !p.to || p.confirmedReturn) return;
                        if (p.to >= today && p.to <= soonLimit) {
                            const daysLeft = Math.round((new Date(p.to) - new Date(today)) / 86400000);
                            endingSoon.push({ emp, period: p, daysLeft });
                        } else if (p.to < today) {
                            endedUnconfirmed.push({ emp, period: p });
                        }
                    });
                });
                endedUnconfirmed.sort((a, b) => (a.period.to < b.period.to ? -1 : 1));
                endingSoon.sort((a, b) => a.daysLeft - b.daysLeft);
                return { endingSoon, endedUnconfirmed };
            }, [staff]);

            const [waterMonth, setWaterMonth] = useState(() => localDateStr().slice(0, 7));

            // أيام الدوام الفعلي لكل مجموعة (صباحي/ثلاثية/ثنائية) لكل شهر — رقم تشغيلي لا يُحسب
            // من البيانات (يختلف باختلاف نمط المناوبة)، يُدخله الإداري يدوياً عند تحضير الاستمارة.
            // محلي على هذا الجهاز فقط، بلا مزامنة سحابية بعد — انظر ملاحظة الأثر أدناه.
            const [waterAttendanceDays, setWaterAttendanceDays] = useState(() => {
                try { return JSON.parse(safeStorage.getItem('waterAttendanceDays') || '{}'); } catch (e) { return {}; }
            });
            React.useEffect(() => {
                safeStorage.setItem('waterAttendanceDays', JSON.stringify(waterAttendanceDays));
            }, [waterAttendanceDays]);

            const [waterMemoGroup, setWaterMemoGroup] = useState(null);

            const BOC_LOGO_DATA_URI = 'data:image/jpeg;base64,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';

            const [dismissedReturnIds, setDismissedReturnIds] = useState([]);

            // يُسأل عن موظف واحد في كل مرة، بترتيب تاريخ الانتهاء
            const pendingReturnPrompt = React.useMemo(() => {
                if (!canEdit('staffMaster')) return null;
                return periodAlerts.endedUnconfirmed.find(a => !dismissedReturnIds.includes(a.period.id)) || null;
            }, [periodAlerts, dismissedReturnIds, currentUserRole, currentUserPermissions]);

            const confirmReturn = (didResume) => {
                if (!pendingReturnPrompt) return;
                const { emp, period } = pendingReturnPrompt;
                const dayAfter = localDateStr(new Date(period.to).getTime() + 86400000);
                // «لا» تفتح غياباً من اليوم التالي، لكن يجب ألا يتداخل مع فترة لاحقة مسجَّلة بالفعل —
                // وإلا يُكتب مباشرة عبر setStaff متجاوزاً حارس التداخل في saveEmployeeEdit، فيصبح
                // السجل محظوراً على أي حفظ مستقبلي بلا وسيلة لإصلاحه من الواجهة.
                const laterPeriods = periodsOf(emp).filter(p => p.id !== period.id && p.from && p.from >= dayAfter);
                const nextStart = laterPeriods.length > 0 ? laterPeriods.reduce((min, p) => p.from < min ? p.from : min, laterPeriods[0].from) : null;
                const absenceTo = nextStart ? localDateStr(new Date(nextStart).getTime() - 86400000) : '';
                const skipAbsence = nextStart === dayAfter;
                const updated = (staff || []).map(s => {
                    if (s.id !== emp.id) return s;
                    const marked = periodsOf(s).map(p => p.id === period.id ? { ...p, confirmedReturn: true } : p);
                    // «لا» تفتح غياباً مفتوح النهاية من اليوم التالي، فلا يختفي من الكشف بصمت
                    const withAbsence = (didResume || skipAbsence) ? marked : [...marked, { id: 'per_' + Date.now(), type: 'غياب', from: dayAfter, to: absenceTo, note: 'لم يباشر بعد انتهاء ' + period.type }];
                    return { ...s, statusPeriods: withAbsence };
                });
                setStaff(updated);
                safeStorage.setItem('staffData', JSON.stringify(updated));
                pushDataToCloud(buildCloudBundle({ staffData: updated }));
                logAuditEvent((didResume ? 'confirm_return:' : 'no_return:') + (emp.jobNumber || emp.id), currentUserName);
                setDismissedReturnIds(prev => [...prev, period.id]);
            };

            // الحصول على الموقف الطبيعي الافتراضي للمنتسب بدون أي تعديلات (الحضور/الدوام الأصلي)
            const getEmployeeDefaultNaturalStatus = (emp, dateStr) => {
                const activePeriod = getActivePeriod(emp, dateStr);
                if (activePeriod) {
                    return activePeriod.type;
                }
                const isOfficialHoliday = officialHolidays.includes(dateStr);
                if (emp.workType === 'صباحي') {
                    if (!dateStr) return 'دوام صباحي';
                    try {
                        const parts = dateStr.split('-');
                        const curDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        const day = curDate.getDay();

                        if (isOfficialHoliday) return 'عطلة رسمية';
                        if (day === 5 || day === 6) return 'استراحة نهاية الأسبوع';
                    } catch (e) {}
                    return 'دوام صباحي';
                }
                if (emp.workType === 'مناوب') {
                    if (!emp.squad) return 'مناوب (الوجبة غير محددة)';
                    const isThreeShift = emp.location && emp.location.includes('نهر بن عمر');
                    const diffDays = getDaysBetweenDates(dateStr, anchorDate);
                    
                    if (isThreeShift) {
                        const squads = ['A', 'B', 'C', 'D'];
                        const idxAnchor = squads.indexOf(threeShiftAnchorSquad);
                        if (idxAnchor === -1) return 'استراحة مناوبة';
                        const idxActive = (idxAnchor + (diffDays % 4) + 4) % 4;
                        if (emp.squad === squads[idxActive]) return 'دوام 24 ساعة';
                        return 'استراحة مناوبة';
                    } else {
                        const squadToDayMap = { 'A': 1, 'C': 2, 'D': 3, 'B': 4 };
                        const anchorDay = squadToDayMap[twoShiftAnchorSquad] || 1;
                        const cycleDay = ((anchorDay - 1 + diffDays) % 4 + 4) % 4 + 1;
                        const S = emp.squad;
                        if (cycleDay === 1) {
                            if (S === 'A') return 'دوام صباحي (12 ساعة)';
                            if (S === 'B') return 'دوام مسائي (12 ساعة)';
                            return 'استراحة مناوبة';
                        } else if (cycleDay === 2) {
                            if (S === 'C') return 'دوام صباحي (12 ساعة)';
                            if (S === 'A') return 'دوام مسائي (12 ساعة)';
                            return 'استراحة مناوبة';
                        } else if (cycleDay === 3) {
                            if (S === 'D') return 'دوام صباحي (12 ساعة)';
                            if (S === 'C') return 'دوام مسائي (12 ساعة)';
                            return 'استراحة مناوبة';
                        } else if (cycleDay === 4) {
                            if (S === 'B') return 'دوام صباحي (12 ساعة)';
                            if (S === 'D') return 'دوام مسائي (12 ساعة)';
                            return 'استراحة مناوبة';
                        }
                        return 'استراحة مناوبة';
                    }
                }
                return 'دوام صباحي';
            };

            const getEmployeeDailyStatus = (emp, dateStr) => {
                // 1. التعديلات الاستثنائية المباشرة للموظف
                if (dailyStatusOverrides[dateStr] && dailyStatusOverrides[dateStr][emp.id]) {
                    const ov = dailyStatusOverrides[dateStr][emp.id];
                    // تعذر الحضور يشمل موظفي الصباحي فقط ولا يشمل المناوبين نهائياً
                    if (emp.workType === 'مناوب' && (ov === 'تعذر حضور' || (typeof ov === 'string' && ov.includes('تعذر')))) {
                        // لا ينطبق على المناوب إطلاقاً، يستمر لاحتساب وجبة المناوبة الطبيعية
                    } else {
                        return ov;
                    }
                }
                const activePeriod = getActivePeriod(emp, dateStr);
                if (activePeriod) {
                    return activePeriod.type;
                }

                // 2. فحص العطل الرسمية المحددة بالنظام
                const isOfficialHoliday = officialHolidays.includes(dateStr);

                if (emp.workType === 'صباحي') {
                    if (!dateStr) return 'دوام صباحي';
                    try {
                        const parts = dateStr.split('-');
                        const curDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        const day = curDate.getDay();

                        // عطلة رسمية عامة
                        if (isOfficialHoliday) {
                            return 'عطلة رسمية';
                        }

                        // فحص يومي الجمعة (5) والسبت (6) وقاعدة الربط بالخميس والأحد
                        if (day === 5 || day === 6) {
                            // حساب تاريخ الخميس والأحد
                            let thuDate = new Date(curDate);
                            let sunDate = new Date(curDate);
                            if (day === 5) {
                                thuDate.setDate(curDate.getDate() - 1);
                                sunDate.setDate(curDate.getDate() + 2);
                            } else {
                                thuDate.setDate(curDate.getDate() - 2);
                                sunDate.setDate(curDate.getDate() + 1);
                            }
                            
                            const thuStr = `${thuDate.getFullYear()}-${String(thuDate.getMonth() + 1).padStart(2, '0')}-${String(thuDate.getDate()).padStart(2, '0')}`;
                            const sunStr = `${sunDate.getFullYear()}-${String(sunDate.getMonth() + 1).padStart(2, '0')}-${String(sunDate.getDate()).padStart(2, '0')}`;

                            const thuStatus = dailyStatusOverrides[thuStr] && dailyStatusOverrides[thuStr][emp.id];
                            const sunStatus = dailyStatusOverrides[sunStr] && dailyStatusOverrides[sunStr][emp.id];

                            // إذا كان الخميس والأحد إجازة مدفوعة/اعتيادية/مرضية، تحسب الجمعة والسبت من ضمن الإجازة
                            const isLeaveType = (st) => st && (st.includes('إجازة اعتيادية') || st.includes('مرضية') || st.includes('خارج العراق') || st.includes('بدون راتب'));
                            if (isLeaveType(thuStatus) && isLeaveType(sunStatus)) {
                                return thuStatus; // تكتسب نفس نوع إجازة الخميس
                            }

                            return 'استراحة نهاية الأسبوع';
                        }
                    } catch (e) {}
                    return 'دوام صباحي';
                }
                if (emp.workType === 'مناوب') {
                    if (!emp.squad) {
                        return 'مناوب (الوجبة غير محددة)';
                    }
                    const isThreeShift = emp.location && emp.location.includes('نهر بن عمر');
                    const diffDays = getDaysBetweenDates(dateStr, anchorDate);
                    
                    if (isThreeShift) {
                        const squads = ['A', 'B', 'C', 'D'];
                        const idxAnchor = squads.indexOf(threeShiftAnchorSquad);
                        if (idxAnchor === -1) return 'استراحة مناوبة';
                        const idxActive = (idxAnchor + (diffDays % 4) + 4) % 4;
                        if (emp.squad === squads[idxActive]) {
                            return 'دوام 24 ساعة';
                        }
                        return 'استراحة مناوبة';
                    } else {
                        const squadToDayMap = { 'A': 1, 'C': 2, 'D': 3, 'B': 4 };
                        const anchorDay = squadToDayMap[twoShiftAnchorSquad] || 1;
                        const cycleDay = ((anchorDay - 1 + diffDays) % 4 + 4) % 4 + 1;
                        const S = emp.squad;
                        if (cycleDay === 1) {
                            if (S === 'A') return 'دوام صباحي (12 ساعة)';
                            if (S === 'B') return 'دوام مسائي (12 ساعة)';
                            return 'استراحة مناوبة';
                        } else if (cycleDay === 2) {
                            if (S === 'C') return 'دوام صباحي (12 ساعة)';
                            if (S === 'A') return 'دوام مسائي (12 ساعة)';
                            return 'استراحة مناوبة';
                        } else if (cycleDay === 3) {
                            if (S === 'D') return 'دوام صباحي (12 ساعة)';
                            if (S === 'C') return 'دوام مسائي (12 ساعة)';
                            return 'استراحة مناوبة';
                        } else if (cycleDay === 4) {
                            if (S === 'B') return 'دوام صباحي (12 ساعة)';
                            if (S === 'D') return 'دوام مسائي (12 ساعة)';
                            return 'استراحة مناوبة';
                        }
                        return 'استراحة مناوبة';
                    }
                }
                return 'غير محدد';
            };


            const isWorkDay = (dateStr) => {
                const [y, m, d] = dateStr.split('-').map(Number);
                const day = new Date(y, m - 1, d).getDay();
                return day !== 5 && day !== 6 && !officialHolidays.includes(dateStr);
            };



            // استثناء ثنائي المرحلة، وفق النموذج الرسمي لاستمارة تجهيز المياه المعدنية:
            //  • في دورة / إيفاد → أي تماس مع الشهر يستبعد فوراً، ولو يوماً واحداً.
            //  • إجازة طويلة/بدون راتب/أمومة/غياب (وإجازة اعتيادية إن طالت) → تُجمَع أيام العمل
            //    الفعلية المشمولة بها من الفترات المؤرَّخة ومن تعديلات "الموقف" اليومية معاً (قد تكون
            //    متفرقة غير متتالية)، فإن بلغت نصف أيام العمل في الشهر أو تجاوزته يُستبعد كلياً —
            //    لا حصة جزئية أدنى من ذلك، فمن حضر أكثر من نصف الشهر يبقى ضمن العدد كاملاً.
            const isExcludedFromWater = (emp, monthStr) => {
                if (!emp) return false;
                if (emp.excludeFromWaterLists) return true;
                const hasPeriods = periodsOf(emp).length > 0;
                // لا فترات مؤرَّخة: حالة قديمة بنص خام في emp.status — تُستبعد بالكامل إن لم تكن
                // "نشط"، تماماً كما كان الفلتر قبل هذا التغيير (status === 'نشط' فقط يُقبل).
                if (!hasPeriods) {
                    return !!(emp.status && emp.status !== 'نشط');
                }
                const total = daysInMonth(monthStr);
                const monthStart = monthStr + '-01';
                const monthEnd = monthStr + '-' + String(total).padStart(2, '0');
                for (const p of periodsOf(emp)) {
                    if (!p || !p.from) continue;
                    const pEnd = p.to || '9999-12-31';
                    if (p.from > monthEnd || pEnd < monthStart) continue; // لا تماس
                    if (p.type === 'في دورة' || p.type === 'إيفاد') return true;
                }
                let leaveDays = 0;
                let workDays = 0;
                for (let d = 1; d <= total; d++) {
                    const dateStr = monthStr + '-' + String(d).padStart(2, '0');
                    if (!isWorkDay(dateStr)) continue;
                    workDays++;
                    if (WATER_LEAVE_TALLY_TYPES.includes(getEmployeeDailyStatus(emp, dateStr))) leaveDays++;
                }
                return leaveDays >= Math.ceil(workDays / 2);
            };

            // مجموعة معرّفات المستبعَدين من الماء لشهر waterMonth، محسوبة مرة واحدة لكل رسم بدل
            // إعادة فحص كل موظف (بحلقته اليومية) من كل موضع فلترة يستخدمها على حدة
            const excludedWaterIds = React.useMemo(() => {
                const set = new Set();
                (staff || []).forEach(s => { if (isExcludedFromWater(s, waterMonth)) set.add(s.id); });
                return set;
            }, [staff, waterMonth, officialHolidays, dailyStatusOverrides]);


            // أيام الدوام الفعلي مُحتسَبة تلقائياً من نفس منظومة "الموقف" ودورة المناوبة الموجودة
            // أصلاً (لا حاجة لإدخال يدوي): للصباحي = أيام العمل التقويمية، وللمناوَبين = عدد أيام
            // الدوام الفعلية حسب دورة الوجبة (الأكثر تكراراً بين أفراد المجموعة، عادة متطابقة للجميع).
            const getAutoWaterAttendanceDays = (groupKey, monthStr) => {
                const total = daysInMonth(monthStr);
                if (groupKey === 'morning') {
                    let count = 0;
                    for (let d = 1; d <= total; d++) {
                        if (isWorkDay(monthStr + '-' + String(d).padStart(2, '0'))) count++;
                    }
                    return count;
                }
                // shiftType ليس حقلاً مخزَّناً فعلياً في سجل الموظف — يُشتقّ من الموقع في كل موضع آخر
                // بالملف (نهر بن عمر = ثلاثية، غيرها = ثنائية)، وهذا الاشتقاق نفسه يُستخدَم هنا
                const inGroup = groupKey === 'triple'
                    ? (s => s.workType === 'مناوب' && s.location && s.location.includes('نهر بن عمر') && s.squad)
                    : (s => s.workType === 'مناوب' && s.location && !s.location.includes('نهر بن عمر') && s.squad);
                const members = staff.filter(inGroup);
                if (members.length === 0) return 0;
                const counts = members.map(emp => {
                    let c = 0;
                    for (let d = 1; d <= total; d++) {
                        const dateStr = monthStr + '-' + String(d).padStart(2, '0');
                        if (isShiftOnDutyStatus(getEmployeeDefaultNaturalStatus(emp, dateStr))) c++;
                    }
                    return c;
                });
                const freq = {};
                counts.forEach(c => { freq[c] = (freq[c] || 0) + 1; });
                let mode = counts[0], best = 0;
                Object.keys(freq).forEach(k => { if (freq[k] > best) { best = freq[k]; mode = Number(k); } });
                return mode;
            };

            // ملخص استمارة تجهيز المياه المعدنية لمجموعة واحدة (صباحي/ثلاثية/ثنائية) بشهر معيّن
            const getWaterGroupSummary = (groupKey, monthStr) => {
                const inGroup = groupKey === 'morning'
                    ? (s => s.workType === 'صباحي')
                    : groupKey === 'triple'
                        ? (s => s.workType === 'مناوب' && s.location && s.location.includes('نهر بن عمر'))
                        : (s => s.workType === 'مناوب' && s.location && !s.location.includes('نهر بن عمر'));
                const headcount = staff.filter(s => inGroup(s) && (monthStr === waterMonth ? !excludedWaterIds.has(s.id) : !isExcludedFromWater(s, monthStr))).length;
                const manualDays = waterAttendanceDays[monthStr] && waterAttendanceDays[monthStr][groupKey];
                const isAuto = manualDays === undefined || manualDays === null;
                const days = isAuto ? getAutoWaterAttendanceDays(groupKey, monthStr) : manualDays;
                const rate = getWaterSeasonalRate(monthStr);
                const bottles = headcount * days * rate;
                // توضيح لاحق من المستخدم: نصف سيت يُقرَّب دائماً للسيت الأقل (318.5 → 318)،
                // لا يبقى كسراً ولا يُرفع لسيت كامل — لا يُطلَب سيت جزئي من المورّد أصلاً
                const sets = Math.floor(bottles / 12);
                const cost = sets * 1000;
                return { headcount, days, rate, bottles, sets, cost, isAuto };
            };

            // إعادة حقل الأيام إلى الحساب التلقائي بعد أن كان قد عُدِّل يدوياً
            const resetWaterGroupDaysToAuto = (groupKey, monthStr) => {
                setWaterAttendanceDays(prev => {
                    const monthEntry = { ...(prev[monthStr] || {}) };
                    delete monthEntry[groupKey];
                    return { ...prev, [monthStr]: monthEntry };
                });
            };

            const setWaterGroupDays = (groupKey, monthStr, value) => {
                setWaterAttendanceDays(prev => ({
                    ...prev,
                    [monthStr]: { ...(prev[monthStr] || {}), [groupKey]: value }
                }));
            };


            // المبلغ هنا دائماً عدد سيتات (أعداد صحيحة بعد التقريب للأقل أعلاه) × 1000 — نحوّل
            // عدد السيتات فقط إلى كلمات ونلحقه بـ"ألف"
            const amountToArabicWords = (amount) => {
                const sets = Math.round(amount / 1000);
                if (sets <= 0) return 'لا يوجد مبلغ';
                let thousandsWord;
                if (sets === 1) thousandsWord = 'ألف';
                else if (sets === 2) thousandsWord = 'ألفان';
                else if (sets <= 10) thousandsWord = numberChunkToArabicWords(sets) + ' آلاف';
                else thousandsWord = numberChunkToArabicWords(sets) + ' ألف';
                return thousandsWord + ' دينار عراقي فقط';
            };

            const setEmployeeDailyStatusOverride = (empId, dateStr, status) => {
                if (!canEdit('dailyReport')) {
                    if (lockedSections['dailyReport']) {
                        alert('🔒 ' + lockedSections['dailyReport'] + ' يعدّل الموقف اليومي الآن.\n\nأنت في وضع الاطلاع مؤقتاً، وتعود صلاحيتك تلقائياً خلال 15 ثانية من خروجه.');
                    } else {
                        alert('⛔ عذراً، ليس لديك صلاحية تعديل أو مزامنة الموقف اليومي!\nتم منحك صلاحية العرض والاطلاع والطباعة فقط.');
                    }
                    return;
                }
                const emp = staff.find(s => s.id === empId);

                // إلغاء وسحب التعديل فوراً والعودة إلى الافتراضي الأصلي
                const revertToDefault = () => {
                    // الحذف يُسجَّل إن كان لليوم ما يُحذف فعلاً: موقف، أو ساعات زمنية، أو إضافي (مراجعة Codex)
                    const hasOwnDay = (rec) => !!rec && Object.prototype.hasOwnProperty.call(rec, dateStr) && !!rec[dateStr] && Object.prototype.hasOwnProperty.call(rec[dateStr], empId);
                    if (emp && (hasOwnDay(dailyStatusOverrides) || hasOwnDay(hourlyLeaveRecords) || hasOwnDay(overtimeHoursRecords))) {
                        updateTombstones({ addDays: [tombstoneKeyOfDay(dateStr, emp.jobNumber)] });
                    }
                    setEmployeeHourlyLeave(empId, dateStr, 0);
                    setEmployeeOvertimeHours(empId, dateStr, 0);
                    setDailyStatusOverrides(prev => {
                        const next = { ...prev };
                        if (next[dateStr]) {
                            delete next[dateStr][empId];
                            if (Object.keys(next[dateStr]).length === 0) delete next[dateStr];
                        }
                        return next;
                    });
                };

                if (emp && emp.workType === 'صباحي' && dateStr && (status.includes('إجازة اعتيادية') || status.includes('إجازة مرضية') || status.includes('إجازة خارج العراق'))) {
                    try {
                        const parts = dateStr.split('-');
                        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        const day = d.getDay();
                        if (day === 5 || day === 6) {
                            let thuDate = new Date(d);
                            let sunDate = new Date(d);
                            if (day === 5) { thuDate.setDate(d.getDate() - 1); sunDate.setDate(d.getDate() + 2); }
                            else { thuDate.setDate(d.getDate() - 2); sunDate.setDate(d.getDate() + 1); }
                            
                            const thuStr = `${thuDate.getFullYear()}-${String(thuDate.getMonth() + 1).padStart(2, '0')}-${String(thuDate.getDate()).padStart(2, '0')}`;
                            const sunStr = `${sunDate.getFullYear()}-${String(sunDate.getMonth() + 1).padStart(2, '0')}-${String(sunDate.getDate()).padStart(2, '0')}`;

                            const thuStatus = dailyStatusOverrides[thuStr] && dailyStatusOverrides[thuStr][empId];
                            const sunStatus = dailyStatusOverrides[sunStr] && dailyStatusOverrides[sunStr][empId];
                            const isLeaveType = (st) => st && (st.includes('إجازة اعتيادية') || st.includes('مرضية') || st.includes('خارج العراق') || st.includes('بدون راتب'));

                            if (!isLeaveType(thuStatus) || !isLeaveType(sunStatus)) {
                                const confirmLeave = confirm(`⚠️ تنبيه إداري:\n\nيوم (${day === 5 ? 'الجمعة' : 'السبت'}) هو يوم استراحة رسمية نهاية الأسبوع للدوام الصباحي.\n\nتذكير: لا تحسب الإجازة في نهاية الأسبوع إلا إذا كانت مؤشرة يوم الخميس ويوم الأحد معاً (قاعدة ربط الإجازة).\n\nهل تريد تأكيد تسليط الإجازة بالرغم من ذلك؟\n\n• اضغط [موافق / OK] للتأكيد وتسليط الإجازة.\n• اضغط [إلغاء / Cancel] للتراجع والاحتفاظ بـ استراحة نهاية الأسبوع.`);
                                if (!confirmLeave) {
                                    revertToDefault();
                                    return;
                                }
                            }
                        }
                    } catch(e) {}
                }

                // سجلات الساعات بعد تعديلها هنا، للبثّ المؤجَّل أدناه — قيم الإغلاق قبل الحفظ
                let freshRecords = {};
                if (status === 'default') {
                    revertToDefault();
                    return;
                } else if (status === 'إجازة زمنية') {
                    // الساعات والتوقيت من نافذتها؛ الموقف يُثبَّت عند «تثبيت» (confirmHourlyLeave)،
                    // و«إلغاء» يُبقي موقف اليوم كما كان
                    const oldHours = hourlyLeaveRecords[dateStr] && hourlyLeaveRecords[dateStr][empId];
                    const oldTiming = hourlyLeaveTimings[dateStr] && hourlyLeaveTimings[dateStr][empId];
                    setPendingHourlyLeave({ empId, dateStr, empName: emp ? emp.name : 'المنتسب',
                        hours: oldHours >= 1 && oldHours <= 7 ? oldHours : 2, timing: oldTiming || '' });
                    return;
                } else if (status === 'دوام إضافي' || status.includes('إضافي')) {
                    try {
                        const empName = emp ? emp.name : 'المنتسب';
                        const dParts = dateStr.split('-');
                        const curD = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
                        const isSatOrHoliday = curD.getDay() === 6 || officialHolidays.includes(dateStr);
                        const maxHours = isSatOrHoliday ? 3 : 2;

                        const inputOt = prompt(`⚡ الدوام الإضافي للمنتسب (${empName}):\n\nكم عدد ساعات العمل الإضافي؟ (الحد الأقصى لهذا اليوم ${maxHours} ساعات):`, maxHours.toString());
                        if (inputOt !== null) {
                            const h = parseInt(inputOt.trim());
                            if (!isNaN(h) && h >= 1 && h <= maxHours) {
                                setEmployeeOvertimeHours(empId, dateStr, h);
                                freshRecords = { overtimeHoursRecords: withDayValue(overtimeHoursRecords, dateStr, empId, h) };
                            } else {
                                setEmployeeOvertimeHours(empId, dateStr, maxHours);
                                freshRecords = { overtimeHoursRecords: withDayValue(overtimeHoursRecords, dateStr, empId, maxHours) };
                            }
                        } else {
                            revertToDefault();
                            return;
                        }
                    } catch(e) {}
                }

                commitDailyStatusOverride(empId, dateStr, status, freshRecords);
            };

            const confirmHourlyLeave = () => {
                const p = pendingHourlyLeave;
                if (!p || !p.timing) return;
                setEmployeeHourlyLeave(p.empId, p.dateStr, p.hours, p.timing);
                commitDailyStatusOverride(p.empId, p.dateStr, 'إجازة زمنية', {
                    hourlyLeaveRecords: withDayValue(hourlyLeaveRecords, p.dateStr, p.empId, p.hours),
                    hourlyLeaveTimings: withDayValue(hourlyLeaveTimings, p.dateStr, p.empId, p.timing),
                });
                setPendingHourlyLeave(null);
            };

            // نسخة من سجل يومي (تاريخ ← موظف ← قيمة) بقيمة موظف واحد في يوم واحد، دون مسّ الأصل
            const withDayValue = (records, dateStr, empId, value) =>
                ({ ...records, [dateStr]: { ...((records && records[dateStr]) || {}), [empId]: value } });

            // تثبيت موقف اليوم وبثّه؛ الساعات (الزمنية/الإضافي) تُحفظ قبله كلٌّ في سجله، وتصل هنا
            // محدَّثةً في fresh: البثّ المؤجَّل بقيم الإغلاق قد يصل السحابة بعد البثّ الصحيح فيكتب فوقه
            const commitDailyStatusOverride = (empId, dateStr, status, fresh = {}) => {
                const emp = staff.find(s => s.id === empId);
                // إدخال موقف لليوم يُزيل تذكرة حذفه
                if (emp) updateTombstones({ removeDays: [tombstoneKeyOfDay(dateStr, emp.jobNumber)] });
                let nextOverrides;
                setDailyStatusOverrides(prev => {
                    const next = { ...prev };
                    if (!next[dateStr]) next[dateStr] = {};
                    next[dateStr][empId] = status;
                    nextOverrides = next;
                    return next;
                });
                // بث مباشر وفوري للموقف اليومي للسحابة في نفس اللحظة
                setTimeout(() => {
                    if (nextOverrides) {
                        pushDataToCloud({
                            staffData: staff,
                            systemUsersList: systemUsers,
                            officialHolidaysList: officialHolidays,
                            hourlyLeaveRecords: hourlyLeaveRecords,
                            hourlyLeaveTimings: hourlyLeaveTimings,
                            overtimeHoursRecords: overtimeHoursRecords,
                            dailyStatusOverrides: nextOverrides,
                            shiftAnchorDate: anchorDate,
                            threeShiftAnchorSquad: threeShiftAnchorSquad,
                            twoShiftAnchorSquad: twoShiftAnchorSquad,
                            dataEntryOperator: dataEntryOperator,
                            overtimeSelectedIds: overtimeIds,
                            lastCloudUpdate: new Date().toISOString(),
                            pendingDeletionRequest: pendingDeletionRequest,
                            ...fresh
                        });
                    }
                }, 50);
            };

            // تسليط إجراء جماعي لمنتسبي موقع / وحدة معينة (تعذر حضور للصباحي فقط، أو استعادة الافتراضي)
            const setUnitBulkStatus = (unitName, statusValue) => {
                if (!canEdit('dailyReport')) {
                    if (lockedSections['dailyReport']) {
                        alert('🔒 ' + lockedSections['dailyReport'] + ' يعدّل الموقف اليومي الآن.\n\nأنت في وضع الاطلاع مؤقتاً، وتعود صلاحيتك تلقائياً خلال 15 ثانية من خروجه.');
                    } else {
                        alert('⛔ عذراً، ليس لديك صلاحية تعديل أو مزامنة الموقف اليومي!\nتم منحك صلاحية العرض والاطلاع والطباعة فقط.');
                    }
                    return;
                }
                const targetStaff = staff.filter(s => s.unit === unitName);
                if (targetStaff.length === 0) return;

                const isDefault = !statusValue || statusValue === 'default';
                const isExcuse = statusValue === 'تعذر حضور' || (statusValue && statusValue.includes('تعذر'));
                
                // تعذر الحضور يشمل الصباحي فقط ولا يشمل المناوبين
                const morningStaffInUnit = targetStaff.filter(s => s.workType === 'صباحي');
                if (isExcuse && morningStaffInUnit.length === 0) {
                    alert(`ℹ️ وحدة (${unitName}) لا تحتوي على موظفين صباحيين لتسليط تعذر الحضور عليهم.\nالمناوبون يتبعون جدول وجباتهم ولا يشملهم تعذر الحضور.`);
                    return;
                }

                const actionLabel = isDefault 
                    ? `استعادة الموقف الطبيعي لجميع منتسبي (${unitName})` 
                    : `تسليط تعذر حضور لموظفي الصباحي فقط في (${unitName}) (عددهم ${morningStaffInUnit.length} موظف)`;

                if (!confirm(`هل أنت متأكد من ${actionLabel} لتاريخ [${dailyReportDate}]؟`)) {
                    return;
                }

                // ما يُحذف من مواقف الوحدة يُسجَّل: الافتراضي لكل من له موقف، وتعذر الحضور المُزال عن المناوبين؛ وما يُسلَّط يُزيل تذكرته
                const dayBeforeBulk = dailyStatusOverrides[dailyReportDate] || {};
                const removedByBulk = targetStaff.filter(emp => dayBeforeBulk[emp.id] && (isDefault
                    || (isExcuse && emp.workType !== 'صباحي' && String(dayBeforeBulk[emp.id]).includes('تعذر'))));
                const setByBulk = isExcuse ? targetStaff.filter(emp => emp.workType === 'صباحي') : [];
                updateTombstones({
                    addDays: removedByBulk.map(emp => tombstoneKeyOfDay(dailyReportDate, emp.jobNumber)),
                    removeDays: setByBulk.map(emp => tombstoneKeyOfDay(dailyReportDate, emp.jobNumber))
                });
                let updatedOverrides = {};
                setDailyStatusOverrides(prev => {
                    const next = { ...prev };
                    const dateOverrides = { ...(next[dailyReportDate] || {}) };

                    targetStaff.forEach(emp => {
                        if (isDefault) {
                            delete dateOverrides[emp.id];
                        } else if (isExcuse) {
                            if (emp.workType === 'صباحي') {
                                dateOverrides[emp.id] = statusValue;
                            } else {
                                // المناوب لا يشمله تعذر الحضور نهائياً ويُحذف أي تعذر مسلط عليه سابقاً
                                if (dateOverrides[emp.id] && (dateOverrides[emp.id] === 'تعذر حضور' || dateOverrides[emp.id].includes('تعذر'))) {
                                    delete dateOverrides[emp.id];
                                }
                            }
                        }
                    });

                    if (Object.keys(dateOverrides).length === 0) {
                        delete next[dailyReportDate];
                    } else {
                        next[dailyReportDate] = dateOverrides;
                    }
                    updatedOverrides = next;
                    return next;
                });

                showCustomAlert(`✅ تم بنجاح ${actionLabel}`, 'success');

                setTimeout(() => {
                    pushDataToCloud({
                        staffData: staff,
                        systemUsersList: systemUsers,
                        officialHolidaysList: officialHolidays,
                        hourlyLeaveRecords: hourlyLeaveRecords,
                        hourlyLeaveTimings: hourlyLeaveTimings,
                        overtimeHoursRecords: overtimeHoursRecords,
                        dailyStatusOverrides: updatedOverrides,
                        shiftAnchorDate: anchorDate,
                        threeShiftAnchorSquad: threeShiftAnchorSquad,
                        twoShiftAnchorSquad: twoShiftAnchorSquad,
                        dataEntryOperator: dataEntryOperator,
                        overtimeSelectedIds: overtimeIds,
                        lastCloudUpdate: new Date().toISOString(),
                        pendingDeletionRequest: pendingDeletionRequest
                    });
                }, 50);
            };

            const handleThreeShiftAnchorChange = (squad) => {
                setAnchorDate(dailyReportDate);
                setThreeShiftAnchorSquad(squad);
                safeStorage.setItem('shiftAnchorDate', dailyReportDate);
                safeStorage.setItem('threeShiftAnchorSquad', squad);
                pushDataToCloud({
                    staffData: staff,
                    systemUsersList: systemUsers,
                    officialHolidaysList: officialHolidays,
                    hourlyLeaveRecords: hourlyLeaveRecords,
                    hourlyLeaveTimings: hourlyLeaveTimings,
                    overtimeHoursRecords: overtimeHoursRecords,
                    dailyStatusOverrides: dailyStatusOverrides,
                    shiftAnchorDate: dailyReportDate,
                    threeShiftAnchorSquad: squad,
                    twoShiftAnchorSquad: twoShiftAnchorSquad,
                    dataEntryOperator: dataEntryOperator,
                    overtimeSelectedIds: overtimeIds,
                    lastCloudUpdate: new Date().toISOString(),
                    pendingDeletionRequest: pendingDeletionRequest
                });
            };

            const handleTwoShiftAnchorChange = (squad) => {
                setAnchorDate(dailyReportDate);
                setTwoShiftAnchorSquad(squad);
                safeStorage.setItem('shiftAnchorDate', dailyReportDate);
                safeStorage.setItem('twoShiftAnchorSquad', squad);
                pushDataToCloud({
                    staffData: staff,
                    systemUsersList: systemUsers,
                    officialHolidaysList: officialHolidays,
                    hourlyLeaveRecords: hourlyLeaveRecords,
                    hourlyLeaveTimings: hourlyLeaveTimings,
                    overtimeHoursRecords: overtimeHoursRecords,
                    dailyStatusOverrides: dailyStatusOverrides,
                    shiftAnchorDate: dailyReportDate,
                    threeShiftAnchorSquad: threeShiftAnchorSquad,
                    twoShiftAnchorSquad: squad,
                    dataEntryOperator: dataEntryOperator,
                    overtimeSelectedIds: overtimeIds,
                    lastCloudUpdate: new Date().toISOString(),
                    pendingDeletionRequest: pendingDeletionRequest
                });
            };

            const dailyStats = useMemo(() => {
                let onDuty = 0;
                let morningOnDuty = 0;
                let dayShift12h = 0;
                let nightShift12h = 0;
                let shift24h = 0;
                let overtimeDuty = 0;
                let rest = 0;
                let off = 0;
                
                staff.forEach(s => {
                    const status = getEmployeeDailyStatus(s, dailyReportDate);
                    if (status === 'دوام صباحي' || status === 'حضور فعلي') {
                        onDuty++;
                        morningOnDuty++;
                    } else if (status === 'دوام صباحي (12 ساعة)') {
                        onDuty++;
                        dayShift12h++;
                    } else if (status === 'دوام مسائي (12 ساعة)') {
                        onDuty++;
                        nightShift12h++;
                    } else if (status === 'دوام 24 ساعة') {
                        onDuty++;
                        shift24h++;
                    } else if (status === 'دوام إضافي' || status.includes('إضافي')) {
                        onDuty++;
                        overtimeDuty++;
                    } else if (status.includes('استراحة') || status.includes('عطلة') || status === 'عطلة رسمية') {
                        rest++;
                    } else if (status.includes('إجازة') || status.includes('غياب') || status === 'سحب يد' || status.includes('دورة') || status.includes('إيفاد') || status.includes('مرضية') || status.includes('زمنية')) {
                        off++;
                    }
                });
                
                return { onDuty, morningOnDuty, dayShift12h, nightShift12h, shift24h, overtimeDuty, rest, off };
            }, [staff, dailyReportDate, dailyStatusOverrides, anchorDate, threeShiftAnchorSquad, twoShiftAnchorSquad]);
            const periodReportData = useMemo(() => {
                if (!periodStartDate || !periodEndDate) return { datesList: [], employees: [], summary: { totalStaff: 0, totalDutyDays: 0, totalOvertimeDays: 0, totalLeaveDays: 0, totalAbsenceDays: 0, totalDaysCount: 0 } };
                
                const datesList = [];
                try {
                    const pStart = periodStartDate.split('-');
                    const pEnd = periodEndDate.split('-');
                    let cur = new Date(parseInt(pStart[0]), parseInt(pStart[1]) - 1, parseInt(pStart[2]));
                    const end = new Date(parseInt(pEnd[0]), parseInt(pEnd[1]) - 1, parseInt(pEnd[2]));
                    
                    while (cur <= end) {
                        const y = cur.getFullYear();
                        const m = String(cur.getMonth() + 1).padStart(2, '0');
                        const d = String(cur.getDate()).padStart(2, '0');
                        datesList.push(`${y}-${m}-${d}`);
                        cur.setDate(cur.getDate() + 1);
                    }
                } catch (e) {
                    return { datesList: [], employees: [], summary: { totalStaff: 0, totalDutyDays: 0, totalOvertimeDays: 0, totalLeaveDays: 0, totalAbsenceDays: 0, totalDaysCount: 0 } };
                }

                let filteredStaff = staff.filter(s => {
                    if (periodUnitFilter !== 'all' && s.unit !== periodUnitFilter) return false;
                    if (periodWorkTypeFilter !== 'all' && s.workType !== periodWorkTypeFilter) return false;
                    return matchesStaffSearch(s, periodSearchQuery);
                });

                let totalDutyDaysSum = 0;
                let totalOvertimeDaysSum = 0;
                let totalLeaveDaysSum = 0;
                let totalAbsenceDaysSum = 0;

                const employeesResult = filteredStaff.map(emp => {
                    let regularDuty = 0;
                    let overtimeDuty = 0;
                    let leaves = 0;
                    let courses = 0;
                    let deputations = 0;
                    let absence = 0;
                    let rest = 0;
                    let monthlyHourlyLeaveSum = 0;
                    let monthlyOvertimeHoursSum = 0;
                    const dailyLog = [];

                    datesList.forEach(dateStr => {
                        const status = getEmployeeDailyStatus(emp, dateStr);
                        const dayName = getArabicDayName(dateStr);
                        const isOverride = dailyStatusOverrides[dateStr] && dailyStatusOverrides[dateStr][emp.id];
                        const hourlyHours = (status === 'إجازة زمنية' && hourlyLeaveRecords[dateStr] && hourlyLeaveRecords[dateStr][emp.id]) || (status === 'إجازة زمنية' ? 2 : 0);

                        // احتساب ساعات العمل الإضافي التراكمية (السبت/العطلة = 3 ساعات كحد أقصى، الأيام العادية = 2 ساعة)
                        let otHours = 0;
                        if (status === 'دوام إضافي' || status.includes('إضافي')) {
                            if (overtimeHoursRecords[dateStr] && overtimeHoursRecords[dateStr][emp.id]) {
                                otHours = overtimeHoursRecords[dateStr][emp.id];
                            } else {
                                try {
                                    const dParts = dateStr.split('-');
                                    const curD = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
                                    const isSatOrHoliday = curD.getDay() === 6 || officialHolidays.includes(dateStr);
                                    otHours = isSatOrHoliday ? 3 : 2;
                                } catch(e) { otHours = 2; }
                            }
                            monthlyOvertimeHoursSum += otHours;
                        }

                        if (status === 'إجازة زمنية') {
                            monthlyHourlyLeaveSum += hourlyHours;
                        }

                        // حساب تاريخ اليوم الحالي بالصيغة القياسية YYYY-MM-DD
                        const nowD = new Date();
                        const tY = nowD.getFullYear();
                        const tM = String(nowD.getMonth() + 1).padStart(2, '0');
                        const tD = String(nowD.getDate()).padStart(2, '0');
                        const todayStr = `${tY}-${tM}-${tD}`;
                        const isPastOrToday = dateStr <= todayStr;

                        dailyLog.push({ dateStr, dayName, status, isOverride: !!isOverride, hourlyHours, otHours, isFuture: !isPastOrToday });

                        // احتساب أيام الحضور والإحصائيات فقط للأيام المنقضية واليوم الحالي
                        if (isPastOrToday) {
                            if (status === 'دوام صباحي' || status === 'حضور فعلي' || status === 'دوام صباحي (12 ساعة)' || status === 'دوام مسائي (12 ساعة)' || status === 'دوام 24 ساعة' || status === 'إجازة زمنية' || status === 'ورقة عمل' || status === 'مكلف بواجب') {
                                regularDuty++;
                            } else if (status === 'دوام إضافي' || status.includes('إضافي')) {
                                overtimeDuty++;
                            } else if (status.includes('إجازة اعتيادية') || status.includes('مرضية') || status.includes('خارج العراق') || isLongOrMaternityLeave(status)) {
                                leaves++;
                            } else if (status.includes('تعذر') || status.includes('توقف موقع')) {
                                rest++;
                            } else if (status.includes('دورة')) {
                                courses++;
                            } else if (status.includes('إيفاد')) {
                                deputations++;
                            } else if (status === 'غياب' || status === 'سحب يد') {
                                absence++;
                            } else if (status.includes('استراحة') || status === 'عطلة رسمية') {
                                rest++;
                            }
                        }
                    });

                    totalDutyDaysSum += regularDuty;
                    totalOvertimeDaysSum += overtimeDuty;
                    totalLeaveDaysSum += leaves;
                    totalAbsenceDaysSum += absence;

                    return {
                        employee: emp,
                        totalDays: datesList.length,
                        regularDuty,
                        overtimeDuty,
                        monthlyOvertimeHoursSum,
                        monthlyHourlyLeaveSum,
                        leaves,
                        courses,
                        deputations,
                        absence,
                        rest,
                        dailyLog
                    };
                });

                return {
                    datesList,
                    employees: employeesResult,
                    summary: {
                        totalStaff: filteredStaff.length,
                        totalDutyDays: totalDutyDaysSum,
                        totalOvertimeDays: totalOvertimeDaysSum,
                        totalLeaveDays: totalLeaveDaysSum,
                        totalAbsenceDays: totalAbsenceDaysSum,
                        totalDaysCount: datesList.length
                    }
                };
            }, [staff, periodStartDate, periodEndDate, periodUnitFilter, periodWorkTypeFilter, periodSearchQuery, dailyStatusOverrides, anchorDate, threeShiftAnchorSquad, twoShiftAnchorSquad]);

            // ترميز خانة اليوم في مصفوفة الموقف: رمز مختصر ولون لكل حالة يومية ممكنة.
            // الحالات مأخوذة من getEmployeeDailyStatus وأنواع الفترات السبعة والتعديلات اليدوية —
            // وأي حالة غير متوقَّعة تظهر بأول حرفٍ منها ولونٍ محايد بدل أن تختفي بصمت.
            const getDayMatrixCell = (status, isFuture) => {
                if (isFuture) return { code: '·', cls: 'text-slate-300', label: 'يوم لم يحن بعد' };
                const s = status || '';
                if (s === 'دوام صباحي' || s === 'حضور فعلي' || s === 'دوام صباحي (12 ساعة)') return { code: 'ص', cls: 'bg-emerald-100 text-emerald-800', label: s };
                if (s === 'دوام مسائي (12 ساعة)') return { code: 'م', cls: 'bg-teal-100 text-teal-800', label: s };
                if (s === 'دوام 24 ساعة') return { code: '٢٤', cls: 'bg-emerald-200 text-emerald-900', label: s };
                if (s === 'ورقة عمل') return { code: 'و', cls: 'bg-blue-100 text-blue-800', label: s };
                if (s === 'مكلف بواجب') return { code: 'ك', cls: 'bg-sky-100 text-sky-800', label: s };
                if (s === 'إجازة زمنية') return { code: 'ز', cls: 'bg-cyan-100 text-cyan-800', label: s };
                if (s.includes('إضافي')) return { code: 'إض', cls: 'bg-violet-100 text-violet-800', label: s };
                if (s.includes('تعذر')) return { code: 'ت', cls: 'bg-yellow-100 text-yellow-800', label: s };
                if (s === 'استراحة مناوبة') return { code: 'ر', cls: 'bg-slate-100 text-slate-500', label: s };
                if (s === 'استراحة نهاية الأسبوع') return { code: 'ع', cls: 'bg-slate-100 text-slate-400', label: s };
                if (s === 'عطلة رسمية') return { code: 'ر.س', cls: 'bg-slate-200 text-slate-600', label: s };
                if (s === 'غياب') return { code: 'غ', cls: 'bg-red-100 text-red-800', label: s };
                if (s === 'سحب يد') return { code: 'س', cls: 'bg-red-200 text-red-800', label: s };
                if (s === 'في دورة') return { code: 'د', cls: 'bg-indigo-100 text-indigo-800', label: s };
                if (s === 'إيفاد') return { code: 'ف', cls: 'bg-purple-100 text-purple-800', label: s };
                if (s === 'إجازة أمومة') return { code: 'أم', cls: 'bg-pink-100 text-pink-800', label: s };
                if (s === 'إجازة بدون راتب') return { code: 'ب', cls: 'bg-orange-100 text-orange-800', label: s };
                if (s === 'إجازة طويلة') return { code: 'ط', cls: 'bg-orange-100 text-orange-900', label: s };
                if (s.includes('إجازة')) return { code: 'إ', cls: 'bg-amber-100 text-amber-800', label: s };
                return { code: (s.trim()[0] || '؟'), cls: 'bg-slate-100 text-slate-500', label: s || 'غير محدد' };
            };

            const DAY_MATRIX_LEGEND = [
                { code: 'ص', label: 'دوام صباحي', cls: 'bg-emerald-100 text-emerald-800' },
                { code: 'م', label: 'دوام مسائي', cls: 'bg-teal-100 text-teal-800' },
                { code: '٢٤', label: 'دوام 24 ساعة', cls: 'bg-emerald-200 text-emerald-900' },
                { code: 'إض', label: 'دوام إضافي', cls: 'bg-violet-100 text-violet-800' },
                { code: 'و', label: 'ورقة عمل', cls: 'bg-blue-100 text-blue-800' },
                { code: 'ك', label: 'مكلف بواجب', cls: 'bg-sky-100 text-sky-800' },
                { code: 'ز', label: 'إجازة زمنية', cls: 'bg-cyan-100 text-cyan-800' },
                { code: 'ت', label: 'تعذر حضور', cls: 'bg-yellow-100 text-yellow-800' },
                { code: 'ر', label: 'استراحة مناوبة', cls: 'bg-slate-100 text-slate-500' },
                { code: 'ع', label: 'عطلة أسبوعية', cls: 'bg-slate-100 text-slate-400' },
                { code: 'ر.س', label: 'عطلة رسمية', cls: 'bg-slate-200 text-slate-600' },
                { code: 'إ', label: 'إجازة اعتيادية', cls: 'bg-amber-100 text-amber-800' },
                { code: 'ب', label: 'بدون راتب', cls: 'bg-orange-100 text-orange-800' },
                { code: 'ط', label: 'إجازة طويلة', cls: 'bg-orange-100 text-orange-900' },
                { code: 'أم', label: 'إجازة أمومة', cls: 'bg-pink-100 text-pink-800' },
                { code: 'د', label: 'في دورة', cls: 'bg-indigo-100 text-indigo-800' },
                { code: 'ف', label: 'إيفاد', cls: 'bg-purple-100 text-purple-800' },
                { code: 'غ', label: 'غياب', cls: 'bg-red-100 text-red-800' },
                { code: 'س', label: 'سحب يد', cls: 'bg-red-200 text-red-800' }
            ];

            const exportPeriodReportExcel = () => {
                try {
                    const exportData = [];
                    let counter = 1;

                    periodReportData.employees.forEach(item => {
                        const emp = item.employee;
                        exportData.push({
                            type: 'data',
                            'ت': counter++,
                            'الاسم الكامل': getTripleName(emp.name),
                            'الرقم الوظيفي': emp.jobNumber || '',
                            'الوحدة': emp.unit || '',
                            'طبيعة العمل': emp.workType || '',
                            'الدوام الاعتيادي (يوم)': item.regularDuty,
                            'الدوام الإضافي (يوم)': item.overtimeDuty,
                            'الإجازات (يوم)': item.leaves,
                            'الدورات والإيفاد (يوم)': item.coursesOrDeputation,
                            'الغياب (يوم)': item.absence,
                            'أيام الاستراحة (يوم)': item.rest
                        });
                    });

                    setPreviewData(exportData);
                    setVisiblePreviewColumns(['الرقم الوظيفي', 'الوحدة', 'طبيعة العمل', 'الدوام الاعتيادي (يوم)', 'الدوام الإضافي (يوم)', 'الإجازات (يوم)', 'الغياب (يوم)']);
                    // الفلاتر تُذكَر في العنوان: تقريران بعنوان واحد ومحتوى مختلف التباس خطر في مستند رسمي
                    const scopeParts = [];
                    if (periodUnitFilter !== 'all') scopeParts.push(periodUnitFilter);
                    if (periodWorkTypeFilter !== 'all') scopeParts.push(periodWorkTypeFilter === 'صباحي' ? 'الملاك الصباحي' : 'الملاك المناوب');
                    const scopeLabel = scopeParts.length ? scopeParts.join(' — ') : 'كامل الشعبة';
                    setPreviewTitle(`موقف الحضور (${scopeLabel}) للفترة من ${periodStartDate} إلى ${periodEndDate}`);
                    setShowPreview(true);
                } catch (e) {
                    alert('❌ خطأ في تصدير موقف الفترة: ' + e.message);
                }
            };


            const exportDailyReportExcel = () => {
                try {
                    const unitOrder = ['مقر الشعبة', 'تبريد باب الزبير', 'ورشة التبريد', 'تبريد المكينة', 'تبريد نهر بن عمر', 'تبريد المركز الثقافي'];
                    const exportData = [];
                    let counter = 1;
                    
                    const isOfficialHoliday = officialHolidays.includes(dailyReportDate);
                    let isWeekend = false;
                    try {
                        const p = dailyReportDate.split('-');
                        const d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
                        isWeekend = d.getDay() === 5 || d.getDay() === 6;
                    } catch(e) {}
                    const isOffDay = isOfficialHoliday || isWeekend;

                    unitOrder.forEach(unitName => {
                        const unitStaff = staff.filter(s => s.unit === unitName);
                        // وحدة سُلّط عليها تعذر الحضور تُعامل معاملة يوم العطلة: عدم الحضور هو
                        // الحال الطبيعي فيُخفى، ومن حضر رغم الإغلاق هو الاستثناء الذي يستحق الذكر.
                        const unitHasNoAccess = unitStaff.some(s => {
                            if (s.workType === 'مناوب') return false;
                            const st = getEmployeeDailyStatus(s, dailyReportDate);
                            return st && st.includes('تعذر');
                        });

                        const unitDailyStaff = unitStaff.filter(s => {
                            const status = getEmployeeDailyStatus(s, dailyReportDate);
                            if (isLongOrMaternityLeave(status)) return false;

                            // المناوبون يظهرون دائماً (سواء بالدوام أو استراحة المناوبة)
                            if (s.workType === 'مناوب') {
                                return true;
                            }
                            
                            // موظفو الصباحي:
                            // القاعدة المعتمدة: عدم ذكر موظف الصباحي إذا كان في حالته الطبيعية (دوام اعتيادي، أو عطلة، أو تعذر حضور الموقع)
                            // يُعامل تعذر الحضور معاملة العطل: لا يُذكر في الكشف المطبوع، ويظهر فقط من لديه تغيير خاص (إجازة، غياب، دورة، إيفاد، ورقة عمل، إضافي، أو تكليف بدوام)
                            if (isOffDay) {
                                // في أيام العطل الرسمية وعطلة نهاية الأسبوع (الجمعة والسبت):
                                if (status === 'عطلة رسمية' || status.includes('عطلة') || status === 'استراحة نهاية الأسبوع' || status.includes('نهاية الأسبوع') || status === 'استراحة' || status.includes('تعذر حضور') || status.includes('تعذر')) {
                                    return false; // إخفاء المتمتع بالعطلة أو استراحة نهاية الأسبوع أو تعذر الحضور
                                }
                                return true; // يظهر فقط من تم تثبيت تكليف دوام/إضافي/إجازة له في العطلة
                            } else if (unitHasNoAccess) {
                                // يوم تعذّر فيه الحضور لهذه الوحدة — تنقلب القاعدة كما في يوم العطلة:
                                if (status.includes('تعذر')) {
                                    return false; // من تعذّر حضوره هو الحال الطبيعي هنا فلا يُذكر
                                }
                                return true; // ويظهر من حضر رغم الإغلاق، ومن له عذر آخر
                            } else {
                                // في أيام الدوام الاعتيادية (ليست عطلة):
                                if (status === 'دوام صباحي' || status === 'حضور فعلي' || status.includes('تعذر حضور') || status.includes('تعذر')) {
                                    return false; // إخفاء الحاضرين في الدوام الصباحي الاعتيادي ومن تعذر حضورهم (معاملة العطل)
                                }
                                return true; // يظهر فقط من لديه عذر أو تغيير: إجازة، غياب، دورة، إيفاد، ورقة عمل، إضافي، استراحة خاصة
                            }
                        });

                        if (unitDailyStaff.length > 0) {
                            exportData.push({
                                type: 'separator',
                                content: `━━━ ${unitName} ━━━`
                            });
                            
                            // نفس معيار الترتيب المعروض على الشاشة ("الوحدات والموقف" و"الموقف اليومي")،
                            // فلا يختلف التصدير/الطباعة عمّا يراه المدخِل حيّاً — والعقود تنتهي آخر كل وحدة
                            let sortedStaff = sortByJobTitleHierarchy(unitDailyStaff, unitName);
                            if (unitName === 'مقر الشعبة') {
                                sortedStaff = ensureTopTwo(sortedStaff);
                            }
                            
                            sortedStaff.forEach(s => {
                                const status = getEmployeeDailyStatus(s, dailyReportDate);
                                exportData.push({
                                    type: 'data',
                                    'ت': counter++,
                                    'الاسم الكامل': getTripleName(s.name),
                                    'الرقم الوظيفي': s.jobNumber || '',
                                    'طبيعة العمل': s.workType || '',
                                    'الموقف اليومي': status,
                                    // توقيت الإجازة الزمنية وحده (بطلب المستخدم)؛ السجل القديم بلا توقيت يبقى فارغاً
                                    'الملاحظات': (status === 'إجازة زمنية' && hourlyLeaveTimings[dailyReportDate] && hourlyLeaveTimings[dailyReportDate][s.id]) || ''
                                });
                            });
                        }
                    });
                    
                    setPreviewData(exportData);
                    setVisiblePreviewColumns(['الرقم الوظيفي', 'طبيعة العمل', 'الموقف اليومي', 'الملاحظات']);
                    setPreviewTitle(`الموقف اليومي الموحد لمنتسبي الشعبة بتاريخ ${dailyReportDate}`);
                    setShowPreview(true);
                } catch (error) {
                    alert('❌ خطأ في تحضير الموقف للتصدير: ' + error.message);
                }
            };
            const getColSpan = () => {
                if (previewData.length === 0) return 1;
                const firstDataRow = previewData.find(d => d.type === 'data');
                if (!firstDataRow) return 1;
                return Object.keys(firstDataRow).filter(k => 
                    !['type', 'isFirst', 'location', 'locationSize', 'startRow', 'endRow', 'rowIndex'].includes(k) &&
                    (!isCustomizable || ['ت', 'الاسم الكامل', 'الأسم الكامل', 'الأسم الثلاثي', 'الاسم'].includes(k) || visiblePreviewColumns.includes(k))
                ).length;
            };
            
            // ===== المزامنة والنسخ الاحتياطي ومؤشرات الأمان =====
            const [lastBackupDate, setLastBackupDate] = useState(() => safeStorage.getItem('lastBackupDate'));
            const [safetyFilter, setSafetyFilter] = useState('all'); // 'all' | 'renewal' | 'never'
            const [showSizeDetails, setShowSizeDetails] = useState(false);
            const [showMergeModal, setShowMergeModal] = useState(false);
            const [incomingStaff, setIncomingStaff] = useState([]);
            const [incomingBundle, setIncomingBundle] = useState(null);
            const [showPasteModal, setShowPasteModal] = useState(false);
            const [pastedJsonText, setPastedJsonText] = useState('');

            // تطبيق تاريخ تجهيز (أو مسحه بقيمة فارغة) على المحددين، مع حفظ تواريخهم السابقة للتراجع
            const applySafetyDate = (ids, dateVal) => {
                const idSet = new Set(ids);
                const prev = {};
                const nowIso = new Date().toISOString();
                const updatedStaff = staff.map(emp => {
                    if (!idSet.has(emp.id)) return emp;
                    prev[emp.id] = emp.lastSafetyDelivery || '';
                    return { ...emp, lastSafetyDelivery: dateVal, lastModified: nowIso };
                });
                setStaff(updatedStaff);
                safeStorage.setItem('staffData', JSON.stringify(updatedStaff));
                setSafetyUndo({ prev, applied: dateVal, count: Object.keys(prev).length });
            };

            const undoSafetyDate = () => {
                if (!safetyUndo) return;
                if (!canEdit('safety')) {
                    alert('⛔ عذراً، ليس لديك صلاحية تعديل بيانات وتجهيزات السلامة المهنية!');
                    return;
                }
                // من تغيّر تاريخه بعد التطبيق (تعديل لاحق أو من جهاز آخر عبر المزامنة) لا يُعاد، كي لا يُمحى تعديل أحدث
                let restored = 0;
                const nowIso = new Date().toISOString();
                const updatedStaff = staff.map(emp => {
                    if (!Object.prototype.hasOwnProperty.call(safetyUndo.prev, emp.id)) return emp;
                    if ((emp.lastSafetyDelivery || '') !== safetyUndo.applied) return emp;
                    restored++;
                    return { ...emp, lastSafetyDelivery: safetyUndo.prev[emp.id], lastModified: nowIso };
                });
                setSafetyUndo(null);
                if (restored === 0) {
                    alert('ℹ️ لا شيء للتراجع عنه: تواريخ هؤلاء الموظفين تغيّرت بعد التطبيق.');
                    return;
                }
                setStaff(updatedStaff);
                safeStorage.setItem('staffData', JSON.stringify(updatedStaff));
                const skipped = safetyUndo.count - restored;
                alert(`↩️ أُعيدت التواريخ السابقة لـ (${restored}) موظف${skipped > 0 ? `\nولم يُعَد (${skipped}) لأن تاريخهم تغيّر بعد التطبيق.` : ''}`);
            };
            
            const showBackupWarning = useMemo(() => {
                if (staff.length === 0) return false;
                if (!lastBackupDate) return true;
                const diffTime = Math.abs(new Date() - new Date(lastBackupDate));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays > 7;
            }, [lastBackupDate, staff]);

            // هجرة قاعدة البيانات الذكية إلى الإصدار V5 تلقائياً
            React.useEffect(() => {
                if (staff.length === 0) return;
                let migrated = false;
                const migratedStaff = staff.map(emp => {
                    let changed = false;
                    const updatedEmp = { ...emp };
                    if (updatedEmp.lastSafetyDelivery === undefined) {
                        updatedEmp.lastSafetyDelivery = "";
                        changed = true;
                    }
                    if (updatedEmp.lastModified === undefined) {
                        updatedEmp.lastModified = new Date().toISOString();
                        changed = true;
                    }
                    if (changed) migrated = true;
                    return updatedEmp;
                });
                if (migrated) {
                    setStaff(migratedStaff);
                    safeStorage.setItem('staffData', JSON.stringify(migratedStaff));
                }
            }, [staff]);


            // نطاق الفترة بالكلمات، والتواريخ معزولة الاتجاه: التاريخ بعد نصّ عربي يُعرض مقلوباً (23-08-2026)
            // والسهم بين تاريخين يشير بصرياً إلى البداية، فيُقرأ النطاق معكوساً
            // ويبقى التاريخ في سطر واحد: المتصفح قد يكسره عند الشرطة («2026-» في آخر السطر و«09-03» في أوله)
            const periodRangeJsx = (p) => (
                <React.Fragment>«{p.type}» من <bdi dir="ltr" className="whitespace-nowrap">{p.from}</bdi> {p.to ? <React.Fragment>إلى <bdi dir="ltr" className="whitespace-nowrap">{p.to}</bdi></React.Fragment> : '(مستمرة)'}</React.Fragment>
            );

            // قيمة سطر المواقف: الموقف وساعاته بين قوسين — «إجازة زمنية» (3 ساعات)؛ والساعات وحدها تُسمّى بنوعها
            const attendanceValueJsx = (parts) => {
                const hours = [];
                if (parts.hourly !== undefined) hours.push({ label: 'زمنية', value: parts.hourly });
                if (parts.overtime !== undefined) hours.push({ label: 'إضافي', value: parts.overtime });
                const hoursText = hours.length === 1 && parts.status !== undefined
                    ? arabicHoursCount(hours[0].value)
                    : hours.map(h => `${h.label}: ${arabicHoursCount(h.value)}`).join('، ');
                return (
                    <React.Fragment>
                        {parts.status !== undefined ? <span>«{parts.status}»</span> : <span>ساعات</span>}
                        {hours.length > 0 && <span> ({hoursText})</span>}
                    </React.Fragment>
                );
            };


                        const commitBundleMetadata = (bundle) => {
                if (!bundle || typeof bundle !== 'object') return;
                // سجلّ المحذوفات في الملف يُضاف إلى سجلّ الجهاز (اتحاداً): الاستبدال الكامل يستعيد ذاكرة الحذف ولا يمحو ذاكرة الجهاز
                if (bundle.mergeTombstones && typeof bundle.mergeTombstones === 'object' && !Array.isArray(bundle.mergeTombstones)) {
                    const incomingTombs = bundle.mergeTombstones;
                    const plain = (x) => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};
                    setMergeTombstones(prev => ({
                        periods: { ...(prev.periods || {}), ...plain(incomingTombs.periods) },
                        dailyStatus: { ...(prev.dailyStatus || {}), ...plain(incomingTombs.dailyStatus) },
                        employees: { ...(prev.employees || {}), ...plain(incomingTombs.employees) }
                    }));
                }
                if (bundle.officialHolidaysList && Array.isArray(bundle.officialHolidaysList)) {
                    setOfficialHolidays(bundle.officialHolidaysList);
                    safeStorage.setItem('officialHolidaysList', JSON.stringify(bundle.officialHolidaysList));
                }
                if (bundle.hourlyLeaveRecords) {
                    setHourlyLeaveRecords(bundle.hourlyLeaveRecords);
                    safeStorage.setItem('hourlyLeaveRecords', JSON.stringify(bundle.hourlyLeaveRecords));
                    // ملف أقدم بلا توقيتات: السجل يتبع ساعاته فيُفرَّغ معها
                    const timings = bundle.hourlyLeaveTimings && typeof bundle.hourlyLeaveTimings === 'object' ? bundle.hourlyLeaveTimings : {};
                    setHourlyLeaveTimings(timings);
                    safeStorage.setItem('hourlyLeaveTimings', JSON.stringify(timings));
                }
                if (bundle.overtimeHoursRecords) {
                    setOvertimeHoursRecords(bundle.overtimeHoursRecords);
                    safeStorage.setItem('overtimeHoursRecords', JSON.stringify(bundle.overtimeHoursRecords));
                }
                if (bundle.dailyStatusOverrides) {
                    setDailyStatusOverrides(bundle.dailyStatusOverrides);
                    safeStorage.setItem('dailyStatusOverrides', JSON.stringify(bundle.dailyStatusOverrides));
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
                // bundle.dataEntryOperator لا يُستعاد: اسم منظم الموقف خاص بكل جهاز (يُملأ عند الدخول)
            };

            // selection: خريطة "رقم::حقل" ← منطقي. addSelection: خريطة رقم ← منطقي للموظفين الجدد.
            // أيٌّ منهما لم يُمرَّر ⇒ يُطبَّق كل ما في بابه (سلوك النداءات القديمة، وتوافق خلفي).
            //
            // التحليل يُعاد اشتقاقه هنا عمداً بدل استعمال mergeAnalysis: لو تغيّرت `staff` بين
            // فتح النافذة والضغط (وصول مزامنة سحابية مثلاً)، فالاشتقاق الآن يضمن مطابقة الفروقات
            // للبيانات الحيّة. والمفاتيح (رقم، حقل) تبقى صالحة، وأي فرق جديد لم يره المستخدم
            // لا مفتاح له في selection فلا يُطبَّق — الاتجاه الآمن.
            const handleSmartMerge = (incoming, selection = null, addSelection = null, periodSelection = null, clearDaysSelection = null, attendanceSelection = null, deleteSelection = null) => {
                const analysis = analyzeMerge(incoming, staff, dailyStatusOverrides, mergeTombstones, incomingBundle && incomingBundle.mergeTombstones);
                const isPicked = (jobNumber, field) =>
                    selection === null ? true : !!selection[`${jobNumber}::${field}`];
                const isAddPicked = (jobNumber) =>
                    addSelection === null ? true : !!addSelection[normalizeJobNumber(jobNumber)];

                // رقم وظيفي يحمله أكثر من موظف لديك: كان كلٌّ منهم يُستبدل بنسخة آخرهم عند بناء القائمة — فيضيع أحدهم ويتكرر
                // الآخر. المكرر يُخرج من الفهرس، فلا يُحدَّث ويبقى كل موظف كما هو؛ والتحليل لا يعرض له فروقاً أصلاً
                const currentMap = Object.create(null);
                const duplicateJobs = new Set();
                staff.forEach(s => {
                    const key = normalizeJobNumber(s.jobNumber);
                    if (!key) return;
                    if (key in currentMap) duplicateJobs.add(key); else currentMap[key] = { ...s };
                });
                duplicateJobs.forEach(key => { delete currentMap[key]; });

                // 1. الموظفون الجدد تماماً — المؤشَّرون منهم وحدهم. المعرّف مفتاح المواقف والساعات، ومعرّف موظف جديد قد يطابق
                //    معرّف موظف لديك (رقمه الوظيفي صُحِّح في جهاز آخر مثلاً): فيُعطى معرّفاً جديداً، فلا يتشارك موظفان بياناتهما.
                const pickedAdds = analysis.added.filter(inc => isAddPicked(inc.jobNumber));
                const takenIds = new Set(staff.map(s => String(s.id)));
                const bundleIdUses = new Map();
                pickedAdds.forEach(inc => {
                    const b = inc.id === undefined || inc.id === null ? '' : String(inc.id);
                    if (b) bundleIdUses.set(b, (bundleIdUses.get(b) || 0) + 1);
                });
                const bundleIdOfNew = new Map();
                const newEmployees = pickedAdds.map(inc => {
                    const bundleId = inc.id === undefined || inc.id === null ? '' : String(inc.id);
                    let id = bundleId && !takenIds.has(bundleId) ? inc.id : null;
                    while (id === null || takenIds.has(String(id))) id = 'emp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
                    takenIds.add(String(id));
                    bundleIdOfNew.set(String(id), bundleId);
                    return { ...inc, id, lastModified: new Date().toISOString() };
                });

                // 2. تحديث الموظفين الحاليين — الحقول المؤشَّرة وحدها.
                //    lastModified لا يُلمس إن لم يُطبَّق شيء على الموظف، وإلا بدا معدَّلاً بلا تعديل.
                let appliedFieldCount = 0;
                analysis.updated.forEach(upd => {
                    const existing = currentMap[upd.jobNumber];
                    if (!existing) return;
                    let touched = false;
                    upd.changes.forEach(ch => {
                        if (!isPicked(upd.jobNumber, ch.field)) return;
                        // newVal نصّ للعرض؛ الحقول المُنمَّطة (الأولويات، استثناء السلامة) تُسند بنوعها
                        // وإلا صار المنطقي نصّ "false" وهو قيمة صادقة. false قيمة صحيحة فالفحص بـ!== undefined
                        existing[ch.field] = ch.newValTyped !== undefined ? ch.newValTyped : ch.newVal;
                        touched = true;
                        appliedFieldCount++;
                    });
                    if (touched) existing.lastModified = new Date().toISOString();
                });

                // 3. الفترات المؤرخة — المؤشَّرة وحدها. الحالة (status) لا تُلمس هنا: لها سطرها في الحقول أعلاه،
                //    وعرض الموقف يقرأ الفترات قبلها. والتحليل مبني على البيانات الحيّة لحظة الضغط، فمفتاح فترة
                //    لم يرها المستخدم لا يطابق شيئاً في الاختيار فلا تُطبَّق — الاتجاه الآمن.
                const isPeriodPicked = (key) => !!(periodSelection && periodSelection[key]);
                let appliedPeriodCount = 0;
                let clearedOverrides = null;
                analysis.periods.forEach(item => {
                    if (!isPeriodPicked(item.key)) return;
                    const existing = currentMap[item.jobNumber];
                    if (!existing) return;
                    const current = periodsOf(existing);
                    const ip = { ...item.incoming };
                    // اختيار فترة الملف يستبدل المتداخلة معها كاملةً — اصطلاح saveQuickPeriod نفسه، والمستبدَل ظاهر مشطوباً
                    // في النافذة قبل الضغط. المطابقة بالهوية لا بالمعرّف وحده: فترة قديمة بلا معرّف لا تجرّ غيرها معها
                    const replaced = item.overlaps.map(periodIdentityOf);
                    const kept = current.filter(p => !replaced.includes(periodIdentityOf(p)));
                    let nextPeriods;
                    if (item.kind === 'changed') {
                        // تحلّ محلّ نظيرها المحلي وتحتفظ بمعرّفه، فلا يتغيّر ما يشير إلى الفترة لديك
                        const twinIdentity = periodIdentityOf(item.local);
                        const replacement = { ...ip, id: item.local.id || ip.id };
                        nextPeriods = kept.some(p => periodIdentityOf(p) === twinIdentity)
                            ? kept.map(p => periodIdentityOf(p) === twinIdentity ? replacement : p)
                            : [...kept, replacement];
                    } else {
                        // وكذلك: حالة قديمة بلا فترات تُرحَّل صراحةً حتى اليوم السابق للفترة، فلا تُفقَد صمتاً
                        const legacySeed = (item.legacy && current.length === 0 && item.legacy !== ip.type)
                            ? [{ id: 'per_legacy_' + Date.now() + '_' + item.jobNumber, type: item.legacy, from: '1900-01-01', to: localDateStr(new Date(ip.from).getTime() - 86400000), note: 'ترحيل تلقائي من الحالة القديمة' }]
                            : [];
                        nextPeriods = [...legacySeed, ...kept, ip];
                    }
                    existing.statusPeriods = nextPeriods;
                    existing.lastModified = new Date().toISOString();
                    appliedPeriodCount++;
                    // الأيام المثبَّتة المخالفة داخل الفترة: التثبيت اليومي يسبق الفترة، فبلا مسحها لا تظهر الفترة فيها
                    if (item.days.length > 0 && clearDaysSelection && clearDaysSelection[item.key]) {
                        if (!clearedOverrides) clearedOverrides = { ...dailyStatusOverrides };
                        item.days.forEach(({ date }) => {
                            if (!clearedOverrides[date]) return;
                            const day = { ...clearedOverrides[date] };
                            delete day[item.empId];
                            if (Object.keys(day).length === 0) delete clearedOverrides[date];
                            else clearedOverrides[date] = day;
                        });
                    }
                });

                // الموظفون الذين حُذفوا على الجهاز الآخر: لا يُحذف إلا المؤشَّر صراحةً، ويُسجَّل محذوفاً هنا أيضاً
                const pickedDeletes = (analysis.deletedElsewhere || []).filter(
                    d => deleteSelection !== null && !!deleteSelection[d.jobNumber]
                );
                const deletedJobs = new Set(pickedDeletes.map(d => d.jobNumber));
                if (pickedDeletes.length > 0) {
                    updateTombstones({ addEmployees: pickedDeletes.map(d => ({ job: d.jobNumber, name: d.name })) });
                }
                // ومن اخترت إعادته بعد أن كنت حذفته: تُمحى شاهدته وإلا بقي موسوماً «محذوف» إلى الأبد
                const restoredJobs = pickedAdds
                    .map(inc => normalizeJobNumber(inc.jobNumber))
                    .filter(job => job && (analysis.previouslyDeleted || {})[job]);
                if (restoredJobs.length > 0) updateTombstones({ removeEmployees: restoredJobs });

                // دمج القائمتين مع بقية الموظفين الذين لم يتغيروا
                const mergedList = [];
                staff.forEach(s => {
                    const key = normalizeJobNumber(s.jobNumber);
                    if (key && deletedJobs.has(key)) return;
                    if (key && currentMap[key]) {
                        mergedList.push(currentMap[key]);
                    } else {
                        mergedList.push(s);
                    }
                });
                newEmployees.forEach(emp => {
                    mergedList.push(emp);
                });

                // الدمج لا يستبدل بيانات الحضور المحلية دفعة واحدة: كان هنا استدعاءٌ يطبّق حزمة الملف كلها
                // (المواقف اليومية والإجازات الزمنية والإضافي والعطل ومرجع المناوبات) مهما اختار المستخدم.
                // الاستبدال الكامل وحده يطبّق الحزمة كلها.
                // ما يحذفه الدمج من الجهاز (فترات مستبدَلة، أيام ممسوحة) يُسجَّل؛ وفترة الملف المختارة صراحةً لا تبقى لها تذكرة
                const appliedPeriodItems = analysis.periods.filter(item => isPeriodPicked(item.key) && currentMap[item.jobNumber]);
                updateTombstones({
                    addPeriods: appliedPeriodItems.reduce((acc, item) => acc.concat(item.overlaps.map(periodIdentityOf)), []),
                    removePeriods: appliedPeriodItems.map(item => periodIdentityOf(item.incoming)),
                    addDays: appliedPeriodItems.reduce((acc, item) => acc.concat(
                        (item.days.length > 0 && clearDaysSelection && clearDaysSelection[item.key]) ? item.days.map(d => tombstoneKeyOfDay(d.date, item.jobNumber)) : []), [])
                });
                // 4. المواقف اليومية والساعات الزمنية والإضافي والعطل والإعدادات — المؤشَّرة وحدها، ولا يُحذف شيء لديك.
                //    تُطبَّق بعد مسح أيام الفترات: موقف وارد اختير صراحةً ليوم مُسح يُكتب فوقه.
                const attendance = analyzeMergeAttendance(incomingBundle, incoming, staff, {
                    overrides: dailyStatusOverrides, hourly: hourlyLeaveRecords, overtime: overtimeHoursRecords, holidays: officialHolidays,
                    anchorDate, threeShiftAnchorSquad, twoShiftAnchorSquad, dataEntryOperator, tombstones: mergeTombstones.dailyStatus
                });
                const isAttendancePicked = (key) => !!(attendanceSelection && attendanceSelection[key]);
                let nextOverrides = clearedOverrides;
                let nextHourly = null;
                let nextOvertime = null;
                let nextHolidays = null;
                let appliedAttendanceCount = 0;
                const writeDay = (records, date, empId, value) => {
                    records[date] = { ...(ownKey(records, date) ? records[date] : {}), [empId]: value };
                };
                attendance.items.forEach(item => {
                    if (!isAttendancePicked(item.key)) return;
                    if (item.incoming.status !== undefined) {
                        if (!nextOverrides) nextOverrides = { ...dailyStatusOverrides };
                        writeDay(nextOverrides, item.date, item.empId, item.incoming.status);
                    }
                    if (item.incoming.hourly !== undefined) {
                        if (!nextHourly) nextHourly = { ...hourlyLeaveRecords };
                        writeDay(nextHourly, item.date, item.empId, item.incoming.hourly);
                    }
                    if (item.incoming.overtime !== undefined) {
                        if (!nextOvertime) nextOvertime = { ...overtimeHoursRecords };
                        writeDay(nextOvertime, item.date, item.empId, item.incoming.overtime);
                    }
                    appliedAttendanceCount++;
                });
                // ما اختاره المستخدم صراحةً من مواقف الملف يعود ولا تبقى له تذكرة حذف
                updateTombstones({ removeDays: attendance.items.filter(item => isAttendancePicked(item.key)).map(item => tombstoneKeyOfDay(item.date, item.jobNumber)) });
                // موظفون جدد اختير إضافتهم: قيمهم في الملف تأتي معهم — لا شيء لديهم يُستبدل. تُقرأ بمعرّف الموظف في الملف
                // وتُكتب بمعرّفه لديك (جديد إن طابق معرّفه موظفاً لديك)؛ ومعرّف مكرر بين الجدد لا تُنقل قيمه لأيٍّ منهم.
                newEmployees.forEach(emp => {
                    const bundleId = bundleIdOfNew.get(String(emp.id)) || '';
                    if (!bundleId || (bundleIdUses.get(bundleId) || 0) > 1) return;
                    ATTENDANCE_PARTS.forEach(([part, bundleKey]) => {
                        const records = incomingBundle ? incomingBundle[bundleKey] : null;
                        if (!records || typeof records !== 'object' || Array.isArray(records)) return;
                        Object.keys(records).forEach(date => {
                            const row = records[date];
                            if (!ISO_DAY.test(date) || !row || typeof row !== 'object' || Array.isArray(row) || !ownKey(row, bundleId)) return;
                            const value = row[bundleId];
                            if (!isValidAttendanceValue(part, value)) return;
                            if (part === 'status') {
                                if (!nextOverrides) nextOverrides = { ...dailyStatusOverrides };
                                writeDay(nextOverrides, date, emp.id, value);
                            } else if (part === 'hourly') {
                                if (!nextHourly) nextHourly = { ...hourlyLeaveRecords };
                                writeDay(nextHourly, date, emp.id, value);
                            } else {
                                if (!nextOvertime) nextOvertime = { ...overtimeHoursRecords };
                                writeDay(nextOvertime, date, emp.id, value);
                            }
                            appliedAttendanceCount++;
                        });
                    });
                });
                const pickedHolidays = attendance.holidays.filter(h => isAttendancePicked(h.key)).map(h => h.date);
                if (pickedHolidays.length > 0) {
                    nextHolidays = Array.from(new Set([...(officialHolidays || []), ...pickedHolidays])).sort();
                    appliedAttendanceCount += pickedHolidays.length;
                }
                // كل ما تغيّر من بيانات الحضور يُحفظ مرة واحدة: مسح أيام الفترات، ثم المواقف والساعات والعطل المختارة
                commitBundleMetadata({
                    dailyStatusOverrides: nextOverrides || undefined,
                    hourlyLeaveRecords: nextHourly || undefined,
                    overtimeHoursRecords: nextOvertime || undefined,
                    officialHolidaysList: nextHolidays || undefined
                });
                attendance.settings.forEach(s => {
                    if (!isAttendancePicked(s.key)) return;
                    commitBundleMetadata(s.values);
                    appliedAttendanceCount++;
                });
                const sorted = sortByUnit(mergedList);
                setStaff(sorted);
                safeStorage.setItem('staffData', JSON.stringify(sorted));
                
                setShowWelcome(false);
                setShowMergeModal(false);
                setIncomingStaff([]);
                setIncomingBundle(null);
                
                const touchedEmployees = analysis.updated.filter(
                    upd => upd.changes.some(ch => isPicked(upd.jobNumber, ch.field))
                ).length;
                alert(`📊 تم إكمال الدمج والمزامنة بنجاح!\n\n• تم حذف: ${pickedDeletes.length} موظف\n• تم إضافة: ${newEmployees.length} موظف جديد\n• تم تحديث بيانات: ${touchedEmployees} موظف\n• الحقول المطبَّقة: ${appliedFieldCount} حقلاً${selection === null ? '' : ` من أصل ${analysis.updated.reduce((n, u) => n + u.changes.length, 0)}`}\n• الفترات المؤرخة المطبَّقة: ${appliedPeriodCount}\n• المواقف والعطل والإعدادات المطبَّقة: ${appliedAttendanceCount}`);
            };

            // رفع ملف أقدم من حالة السحابة يمحو كل ما حفظه الزملاء بعد تصديره — وحارس الحفظ العادي لا يراه،
            // لأن الجهاز حمّل السحابة للتوّ فختمها يطابق ما يعرفه. فيُقرأ ختم الخادم ويُقارَن بمرجع النسخة
            // السحابية المكتوب في الملف (baseCloudUpdate)، لا بتاريخ تصديره: جهاز لم يزامن منذ أيام يصدّر
            // اليوم ملفاً بيانات قديمة. في الأوفلاين لا سحابة أصلاً، فتمرّ العملية بلا فحص.
            const confirmCloudFreshness = async (bundle) => {
                if (typeof FIREBASE_DB_URL === 'undefined' || !FIREBASE_DB_URL || typeof cloudFetch !== 'function') return true;
                if (window.location.protocol === 'file:') return true;
                const NL = String.fromCharCode(10);
                const ms = (v) => {
                    if (typeof v !== 'string' || !v) return null;
                    const t = Date.parse(v);
                    return Number.isFinite(t) ? t : null;
                };
                const human = (v) => {
                    const t = ms(v);
                    return t === null ? 'غير مذكور' : new Date(t).toISOString().slice(0, 16).replace('T', ' ');
                };
                // التوقف هو الافتراض: الاستبدال الكامل لا يُراجَع بعده شيء
                const ask = (head) => confirm(head + NL + NL + 'موافق = المتابعة على مسؤوليتك.' + NL + 'إلغاء = إيقاف العملية.');
                let serverStamp = null;
                try {
                    const res = await cloudFetch(FIREBASE_DB_URL.replace('.json', '/lastCloudUpdate.json') + '?t=' + Date.now());
                    if (!res.ok) {
                        return ask('⚠️ تعذّر التحقق من حالة السحابة قبل الاستبدال (رمز ' + res.status + ').' + NL +
                            'لا نعرف هل في السحابة عمل أحدث من هذا الملف، والاستبدال الكامل يمحوه إن وُجد.');
                    }
                    serverStamp = await res.json();
                } catch (e) {
                    return ask('⚠️ تعذّر الاتصال بالسحابة للتحقق قبل الاستبدال.' + NL +
                        'لا نعرف هل في السحابة عمل أحدث من هذا الملف، والاستبدال الكامل يمحوه إن وُجد.');
                }
                const serverMs = ms(serverStamp);
                if (serverMs === null) {
                    return ask('⚠️ تعذّر قراءة ختم آخر حفظ سحابي، فلا يمكن التحقق من أن هذا الملف أحدث.');
                }
                const baseMs = ms(bundle && bundle.baseCloudUpdate);
                if (baseMs !== null) {
                    // التطابق النصّي التام وحده يُقبل: المرجع يأتي من الملف نفسه، فمرجع من المستقبل (ملف معدَّل
                    // أو ساعة جهاز مختلّة) — أو صيغة نصّية أخرى للحظة نفسها — لا يُثبت أنه ختم الخادم بعينه
                    if (bundle.baseCloudUpdate === serverStamp) return true;
                    if (baseMs >= serverMs) {
                        return ask('⚠️ مرجع النسخة السحابية في هذا الملف لا يطابق آخر ختم سحابي.' + NL + NL +
                            'آخر حفظ سحابي: ' + human(serverStamp) + NL +
                            'المرجع المذكور في الملف: ' + human(bundle.baseCloudUpdate) + NL + NL +
                            'لا يمكن إثبات أن هذا الملف يحمل كل ما في السحابة.');
                    }
                    return ask('⚠️ السحابة أحدث من هذا الملف!' + NL + NL +
                        'آخر حفظ سحابي: ' + human(serverStamp) + NL +
                        'النسخة السحابية التي بُني عليها الملف: ' + human(bundle.baseCloudUpdate) + NL + NL +
                        'الاستبدال الكامل يمحو كل ما حفظه الزملاء بعد تلك النسخة.' + NL +
                        'الأسلم: استورد نسخة السحابة إلى جهازك أولاً، ثم ارفع.');
                }
                return ask('⚠️ هذا الملف لا يحمل مرجع النسخة السحابية التي بُني عليها، فلا يمكن إثبات أنه أحدث.' + NL + NL +
                    'آخر حفظ سحابي: ' + human(serverStamp) + NL +
                    'تاريخ تصدير الملف: ' + human(bundle && bundle.exportDate) + NL + NL +
                    'الاستبدال الكامل يمحو كل ما في السحابة ويضع مكانه هذا الملف.' + NL +
                    'الأسلم: استورد نسخة السحابة إلى جهازك أولاً، ثم ارفع.');
            };

            const handleFullOverwrite = (incoming) => {
                commitBundleMetadata(incomingBundle);
                const sorted = sortByUnit(incoming);
                setStaff(sorted);
                setShowWelcome(false);
                setShowMergeModal(false);
                setIncomingStaff([]);
                setIncomingBundle(null);
                alert(`⚠️ تم استبدال قاعدة البيانات بالكامل بنجاح. إجمالي الموظفين الحاليين: ${incoming.length} موظف.`);
            };

            // طباعة مصفوفة الأيام: القالب المخصص أدناه يحلّ محلّ الشاشة أثناء الطباعة فقط.
            // اتجاه الصفحة يُحقَن ديناميكياً لأن التطبيق يفرض A4 عمودية عالمياً في @page،
            // و@page لا يمكن ربطه بصنف على body — فالحقن والإزالة هما الطريق الموثوق الوحيد.
            const printDayMatrix = () => {
                const styleEl = document.createElement('style');
                styleEl.id = 'matrixLandscapeStyle';
                styleEl.textContent = '@media print { @page { size: A4 landscape; margin: 8mm; } }';
                document.head.appendChild(styleEl);
                document.body.classList.add('printing-matrix');
                setTimeout(() => {
                    window.print();
                    setTimeout(() => {
                        document.body.classList.remove('printing-matrix');
                        const el = document.getElementById('matrixLandscapeStyle');
                        if (el) el.remove();
                    }, 1000);
                }, 250);
            };

            // طباعة بطاقة المنتسب من نافذة المعاينة. الصنف على body يفعّل عزل طباعتها
            // (body.printing-card في CSS)، والنافذة نفسها مرسومة خارج #root عبر portal.
            //
            // لا مؤقّت لنزع الصنف، عمداً: الصنف لا أثر له إلا تحت @media print، فبقاؤه على
            // الشاشة غير ضارّ؛ أما نزعه بمؤقّت فيسابق الطباعة في المتصفحات التي لا تحجب عند
            // window.print (سفاري على الهاتف) فتعود المعاينة بيضاء — نبّهت إليه مراجعة Codex.
            // يُنزع عند afterprint، وعند إغلاق النافذة (التأثير بجوار selectedEmployeeCard)
            // احتياطاً لمتصفح لا يُطلقه، فلا يبقى الصنف ليُفسد طباعة تالية.
            const printEmployeeCard = () => {
                // البطاقة التي نُقر زرّها بعينها، لا «أيّ بطاقة مفتوحة» عند حلول التأجيل:
                // لو أُغلقت وفُتحت أخرى خلاله، لطبع الاستعلامُ العام البطاقةَ الجديدة بنداءٍ قديم.
                const cardEl = document.querySelector('.card-print-root');
                const onAfterPrint = () => document.body.classList.remove('printing-card');
                document.body.classList.add('printing-card');
                window.addEventListener('afterprint', onAfterPrint, { once: true });
                // تأجيل قصير يضمن أن يرى محرّك الطباعة الصنف مطبَّقاً. وإن انفصلت البطاقة عن
                // الصفحة خلاله (أُغلقت) تُلغى الطباعة ويُزال مستمعها، فلا يبقى مستمع يتيم.
                // (البندان نبّهت إليهما مراجعة Codex في جولتيها الثانية والثالثة.)
                setTimeout(() => {
                    if (cardEl && cardEl.isConnected) { window.print(); return; }
                    window.removeEventListener('afterprint', onAfterPrint);
                    document.body.classList.remove('printing-card');
                }, 50);
            };



            // ===== الكاميرا والوثائق =====
            const [showCamera, setShowCamera] = useState(false);
            const videoRef = useRef(null);
            
            
            
            

            


            const mergeAnalysis = useMemo(() => {
                if (!showMergeModal || !Array.isArray(incomingStaff) || incomingStaff.length === 0) return null;
                return analyzeMerge(incomingStaff, staff, dailyStatusOverrides, mergeTombstones, incomingBundle && incomingBundle.mergeTombstones);
            }, [showMergeModal, incomingStaff, staff, dailyStatusOverrides, mergeTombstones, incomingBundle]);

            // الحقول المؤشَّرة للتطبيق، والموظفون الجدد المؤشَّرون للإضافة (كلٌّ على حدة:
            // ملف زميل قديم قد يحمل من حُذف عمداً، أو من أُضيف عنده بالخطأ)
            const [mergeSelection, setMergeSelection] = useState({});
            const [mergeAddSelection, setMergeAddSelection] = useState({});
            // الحذف لا يُؤشَّر تلقائياً أبداً: إزالة موظف لا رجعة فيها، والقاعدة أن لا يقع شيء بلا قرار صريح
            const [mergeDeleteSelection, setMergeDeleteSelection] = useState({});
            // الفترات المؤرخة المؤشَّرة للتطبيق، ومسح الأيام المثبَّتة المخالفة داخل كل فترة — مفتاحهما مفتاح الفترة
            const [mergePeriodSelection, setMergePeriodSelection] = useState({});
            const [mergeClearDaysSelection, setMergeClearDaysSelection] = useState({});

            // الافتراض مبني على الخطر لا على المساواة: ما كان حقله الحالي فارغاً كسبٌ خالص
            // فيُؤشَّر تلقائياً، وما له قيمة حالية — تعارضاً كان أو فرقاً إملائياً — يحتاج قرار
            // المستخدم فيبقى بلا تأشير. افتراض قابل للتجاوز في كل سطر، لا قاعدة تمنع.
            React.useEffect(() => {
                if (!mergeAnalysis) { setMergeSelection({}); setMergeAddSelection({}); setMergeDeleteSelection({}); setMergePeriodSelection({}); setMergeClearDaysSelection({}); return; }
                const initial = {};
                mergeAnalysis.updated.forEach(upd => {
                    upd.changes.forEach(ch => { initial[mergeKeyOf(upd.jobNumber, ch.field)] = ch.wasEmpty; });
                });
                setMergeSelection(initial);
                // الإضافة كسبٌ لا تعارض فيه، فالافتراض قبولها — والانتقاء متاح
                const adds = {};
                mergeAnalysis.added.forEach(emp => {
                    const job = normalizeJobNumber(emp.jobNumber);
                    // من حذفتَه أنت لا يعود مؤشَّراً: عودته الصامتة هي بالضبط ما تمنعه الشاهدة
                    adds[job] = !(mergeAnalysis.previouslyDeleted || {})[job];
                });
                setMergeAddSelection(adds);
                const dels = {};
                (mergeAnalysis.deletedElsewhere || []).forEach(d => { dels[d.jobNumber] = false; });
                setMergeDeleteSelection(dels);
                // الفترة: الجديدة التي لا تمسّ شيئاً لديك، والكسب (ملاحظة أو تأكيد مباشرة كان فارغاً لديك) ⇒ مؤشَّرة؛
                // ما يتداخل مع فترة أو حالة غير مؤرخة، أو يخالف يوماً مثبَّتاً، أو يغيّر فترة لديك ⇒ بلا تأشير.
                // مسح الأيام المخالفة مؤشَّر افتراضاً: لا أثر له ما لم تُؤشَّر فترته، وبدونه لا تظهر الفترة في تلك الأيام.
                const periodPicks = {};
                const clearPicks = {};
                mergeAnalysis.periods.forEach(item => {
                    periodPicks[item.key] = (item.kind === 'new' || item.gainOnly) && !item.deletedLocally;
                    if (item.days.length > 0) clearPicks[item.key] = true;
                });
                setMergePeriodSelection(periodPicks);
                setMergeClearDaysSelection(clearPicks);
            }, [mergeAnalysis]);

            const toggleMergeAdd = (jobNumber) =>
                setMergeAddSelection(prev => ({ ...prev, [jobNumber]: !prev[jobNumber] }));
            const toggleMergeDelete = (jobNumber) =>
                setMergeDeleteSelection(prev => ({ ...prev, [jobNumber]: !prev[jobNumber] }));
            const setMergeAddScope = (value) => {
                if (!mergeAnalysis) return;
                const next = {};
                mergeAnalysis.added.forEach(emp => { next[normalizeJobNumber(emp.jobNumber)] = value; });
                setMergeAddSelection(next);
            };
            const mergeAddCount = useMemo(
                () => Object.values(mergeAddSelection).filter(Boolean).length,
                [mergeAddSelection]
            );
            // تأشيرات الحذف تُحسب في «لا شيء يُطبَّق» كبقية الاختيارات: ملف فرقه الوحيد حذف موظف كان
            // يُبقي «تطبيق ما اخترته» معطَّلاً بعد تأشير الحذف، فلا يُطبَّق أبداً
            const mergeDeleteCount = useMemo(
                () => Object.values(mergeDeleteSelection).filter(Boolean).length,
                [mergeDeleteSelection]
            );

            const mergeSelectedCount = useMemo(
                () => Object.values(mergeSelection).filter(Boolean).length,
                [mergeSelection]
            );
            const mergeTotalChanges = useMemo(
                () => mergeAnalysis ? mergeAnalysis.updated.reduce((n, u) => n + u.changes.length, 0) : 0,
                [mergeAnalysis]
            );
            const toggleMergePeriod = (key) =>
                setMergePeriodSelection(prev => ({ ...prev, [key]: !prev[key] }));
            const setMergePeriodScope = (value) => {
                if (!mergeAnalysis) return;
                const next = {};
                mergeAnalysis.periods.forEach(item => { next[item.key] = value; });
                setMergePeriodSelection(next);
            };
            const toggleMergeClearDays = (key) =>
                setMergeClearDaysSelection(prev => ({ ...prev, [key]: !prev[key] }));
            const mergePeriodCount = useMemo(
                () => Object.values(mergePeriodSelection).filter(Boolean).length,
                [mergePeriodSelection]
            );
            // تعارضات لم يؤشّرها المستخدم: تُذكر في العدّاد صراحةً، فلا تُفوَّت فترة ينتظر نقلها لأنها بدأت بلا تأشير
            const mergePendingPeriodWarnings = useMemo(
                () => mergeAnalysis ? mergeAnalysis.periods.filter(item => (item.deletedLocally || !(item.kind === 'new' || item.gainOnly)) && !mergePeriodSelection[item.key]).length : 0,
                [mergeAnalysis, mergePeriodSelection]
            );
            // المواقف والعطل والإعدادات من حزمة الملف — تُحلَّل على البيانات الحيّة كالحقول والفترات
            const mergeAttendance = useMemo(() => {
                if (!showMergeModal || !incomingBundle) return null;
                return analyzeMergeAttendance(incomingBundle, incomingStaff, staff, {
                    overrides: dailyStatusOverrides, hourly: hourlyLeaveRecords, overtime: overtimeHoursRecords, holidays: officialHolidays,
                    anchorDate, threeShiftAnchorSquad, twoShiftAnchorSquad, dataEntryOperator, tombstones: mergeTombstones.dailyStatus
                });
            }, [showMergeModal, incomingBundle, incomingStaff, staff, dailyStatusOverrides, hourlyLeaveRecords, overtimeHoursRecords,
                officialHolidays, anchorDate, threeShiftAnchorSquad, twoShiftAnchorSquad, dataEntryOperator, mergeTombstones]);
            const [mergeAttendanceSelection, setMergeAttendanceSelection] = useState({});
            // ما ليس لديك مؤشَّر، والعطل الجديدة مؤشَّرة؛ ما يخالف قيمة أو فترة لديك، والإعدادات العامة، بلا تأشير
            React.useEffect(() => {
                if (!mergeAttendance) { setMergeAttendanceSelection({}); return; }
                const picks = {};
                mergeAttendance.items.forEach(item => { picks[item.key] = item.kind === 'new' && !item.deletedLocally; });
                mergeAttendance.holidays.forEach(h => { picks[h.key] = true; });
                mergeAttendance.settings.forEach(s => { picks[s.key] = false; });
                setMergeAttendanceSelection(picks);
            }, [mergeAttendance]);
            const toggleMergeAttendance = (key) =>
                setMergeAttendanceSelection(prev => ({ ...prev, [key]: !prev[key] }));
            const setMergeAttendanceScope = (scope, value) => {
                if (!mergeAttendance) return;
                setMergeAttendanceSelection(prev => {
                    const next = { ...prev };
                    if (scope === 'all') {
                        [...mergeAttendance.items, ...mergeAttendance.holidays, ...mergeAttendance.settings].forEach(x => { next[x.key] = value; });
                    } else {
                        mergeAttendance.items.forEach(item => { if (item.date === scope) next[item.key] = value; });
                    }
                    return next;
                });
            };
            const mergeAttendanceCount = useMemo(
                () => Object.values(mergeAttendanceSelection).filter(Boolean).length,
                [mergeAttendanceSelection]
            );
            const mergeAttendancePending = useMemo(
                () => mergeAttendance ? mergeAttendance.items.filter(item => (item.kind !== 'new' || item.deletedLocally) && !mergeAttendanceSelection[item.key]).length : 0,
                [mergeAttendance, mergeAttendanceSelection]
            );

            // إلغاء الدمج دون تطبيق شيء: من ✕ في رأس النافذة، ومن «إلغاء العملية» في ذيلها، ومن Esc.
            // كانت النافذة بلا ✕ ولا Esc، وذيلها — وفيه زرّ الإلغاء الوحيد — يخرج عن الشاشة حين يطول
            // المحتوى (ملف من 144 موظفاً بعشرة تعارضات)، وطبقتها لا تُمرَّر: فيبقى المستخدم محبوساً فيها.
            const cancelMerge = () => {
                setShowMergeModal(false);
                setIncomingStaff([]);
                setIncomingBundle(null);
            };
            // المستمع يُسجَّل حين تنفتح النافذة ويُزال حين تُغلق، فلا يلتقط Esc في غيرها.
            // (مستمع Esc العام لمنتقي التاريخ لا يوقف انتشار الحدث، فيتعايشان.)
            React.useEffect(() => {
                if (!showMergeModal) return;
                const onKey = (e) => { if (e.key === 'Escape') cancelMerge(); };
                window.addEventListener('keydown', onKey);
                return () => window.removeEventListener('keydown', onKey);
            }, [showMergeModal]);

            const toggleMergeField = (jobNumber, field) => {
                const key = mergeKeyOf(jobNumber, field);
                setMergeSelection(prev => ({ ...prev, [key]: !prev[key] }));
            };
            // scope: 'all' لكل الفروقات، أو رقم وظيفي لموظف واحد
            const setMergeScope = (scope, value) => {
                if (!mergeAnalysis) return;
                setMergeSelection(prev => {
                    const next = { ...prev };
                    mergeAnalysis.updated.forEach(upd => {
                        if (scope !== 'all' && upd.jobNumber !== scope) return;
                        upd.changes.forEach(ch => { next[mergeKeyOf(upd.jobNumber, ch.field)] = value; });
                    });
                    return next;
                });
            };

            // إحصائيات ذكية
            const smartStats = useMemo(() => {
                const locationCounts = {};
                const titleCounts = {};
                const normalizedTitles = {}; // لحفظ النص الأصلي لكل نص موحد
                
                staff.forEach(s => {
                    // الموقع - توحيد
                    const normalizedLocation = normalizeArabicText(s.location);
                    locationCounts[normalizedLocation] = (locationCounts[normalizedLocation] || 0) + 1;
                    
                    // العنوان الوظيفي - توحيد
                    const normalizedTitle = normalizeArabicText(s.jobTitle);
                    titleCounts[normalizedTitle] = (titleCounts[normalizedTitle] || 0) + 1;
                    
                    // حفظ النص الأصلي (أول مرة نشوفه)
                    if (!normalizedTitles[normalizedTitle]) {
                        normalizedTitles[normalizedTitle] = s.jobTitle;
                    }
                });
                
                // تحويل titleCounts لاستخدام النص الأصلي كـ display
                const displayTitleCounts = {};
                Object.entries(titleCounts).forEach(([normalized, count]) => {
                    const original = normalizedTitles[normalized];
                    displayTitleCounts[original] = count;
                });
                
                return {
                    byLocation: locationCounts,
                    byTitle: displayTitleCounts,
                    engineers: staff.filter(s => s.jobTitle.includes('مهندس') || s.jobTitle.includes('م.')).length,
                    technicians: staff.filter(s => s.jobTitle.includes('فني') || s.jobTitle.includes('مدير')).length,
                    craftsmen: staff.filter(s => s.jobTitle.includes('حرف')).length
                };
            }, [staff]);
            
            const stats = useMemo(() => ({
                total: staff.length,
                shift: staff.filter(s => s.workType === 'مناوب').length,
                morning: staff.filter(s => s.workType === 'صباحي' && !isContractEmployee(s)).length,
                contract: staff.filter(s => isContractEmployee(s)).length,
                contract315: staff.filter(s => contractTypeOf(s) === 'عقد 315').length,
                contractGov: staff.filter(s => contractTypeOf(s) === 'عقد المحافظة').length,
                contractUnclassified: staff.filter(s => contractTypeOf(s) === 'غير مصنّف').length,
                maaMorning: staff.filter(s =>
                    s.workType === 'صباحي' &&
                    !excludedWaterIds.has(s.id)
                ).length,
                maaShift: staff.filter(s =>
                    s.workType === 'مناوب' &&
                    !excludedWaterIds.has(s.id)
                ).length,
                evaluation: staff.filter(s => {
                    if (isContractEmployee(s)) return false;
                    const p = getActivePeriod(s, localDateStr());
                    return !(p && (p.type === 'إجازة طويلة' || p.type === 'إجازة أمومة'));
                }).length,
                active: staff.filter(s => s.status === 'نشط').length,
                inCourse: staff.filter(s => s.status === 'في دورة').length,
                male: staff.filter(s => s.gender === 'ذكر').length,
                female: staff.filter(s => s.gender === 'أنثى').length,
                safety: staff.filter(isInSafetyRoster).length,
                missingData: staff.filter(s => getMissingFields(s).length > 0).length
            }), [staff, waterMonth, excludedWaterIds]);

            const filtered = useMemo(() => {
                if (!search) return staff;
                const normalizedSearch = normalizeArabic(search);
                
                // البحث عن الجنس (مع توحيد الأحرف)
                // نبحث عن "انث" فقط لتشمل: انثى، انثي، اناث
                if (normalizedSearch.includes('انث') || normalizedSearch.includes('نساء')) {
                    return staff.filter(s => s.gender === 'أنثى');
                }
                if (normalizedSearch.includes('ذكور') || normalizedSearch.includes('ذكر') || normalizedSearch.includes('رجال')) {
                    return staff.filter(s => s.gender === 'ذكر');
                }
                
                // البحث العادي
                return staff.filter(s => 
                    normalizeArabic(s.name).includes(normalizedSearch) || 
                    s.jobNumber.includes(search)
                );
            }, [staff, search]);
            
            const statsFiltered = useMemo(() => {
                if (!statsQuery) return [];
                // توحيد نص البحث: الألف + التاء المربوطة/الهاء
                const q = normalizeArabic(statsQuery);
                const results = [];
                
                Object.entries(smartStats.byLocation).forEach(([loc, count]) => {
                    if (normalizeArabic(loc).includes(q)) {
                        results.push({ type: 'موقع', name: loc, count });
                    }
                });
                
                Object.entries(smartStats.byTitle).forEach(([title, count]) => {
                    if (normalizeArabic(title).includes(q)) {
                        results.push({ type: 'وظيفة', name: title, count });
                    }
                });
                
                if (q.includes('مهندس')) results.push({ type: 'تصنيف', name: 'المهندسين', count: smartStats.engineers });
                if (q.includes('فني')) results.push({ type: 'تصنيف', name: 'الفنيين', count: smartStats.technicians });
                if (q.includes('حرف')) results.push({ type: 'تصنيف', name: 'الحرفيين', count: smartStats.craftsmen });
                if (q.includes('ذكور') || q.includes('ذكر') || q.includes('رجال')) results.push({ type: 'جنس', name: 'الذكور', count: stats.male });
                if (q.includes('اناث') || q.includes('انثي') || q.includes('نساء')) results.push({ type: 'جنس', name: 'الإناث', count: stats.female });
                
                return results;
            }, [statsQuery, smartStats, stats]);
            
            
            

            
            

            // صفوف تقرير موقف الفترة مرتَّبة بأساس قوائم الوحدات نفسه — العقود آخر كل وحدة.
            //
            // لماذا هنا لا داخل periodReportData: قيمة useMemo تُنفَّذ أثناء الرسم، وsortByUnit
            // وsortByJobTitleHierarchy وnormalizeArabicText كلها معرَّفة بعده في الملف،
            // فقراءتها من هناك خطأ ترتيب تصريح (TDZ) يُسقط التطبيق بشاشة بيضاء.
            //
            // الترتيب يُبنى على الموظفين ثم يُسقَط على الصفوف بخريطة مواضع، فتبقى المصفوفة
            // وجدول الملخّص وقالب الطباعة على ترتيب واحد لا ثلاثة.
            const periodReportRows = useMemo(() => {
                const rows = periodReportData.employees;
                if (!Array.isArray(rows) || rows.length < 2) return rows || [];
                const position = new Map();
                sortByUnit(rows.map(r => r.employee)).forEach((emp, i) => {
                    if (emp && emp.id != null) position.set(emp.id, i);
                });
                // من لم يظهر في الترتيب (بلا معرّف مثلاً) يذهب إلى الآخر بدل أن يختفي
                const at = (row) => {
                    const id = row && row.employee && row.employee.id;
                    return position.has(id) ? position.get(id) : Number.MAX_SAFE_INTEGER;
                };
                return rows.slice().sort((a, b) => at(a) - at(b));
            }, [periodReportData]);
            
            const current = useMemo(() => {
                const data = search ? filtered : staff;
                let result = [];
                
                if (view === 'all') result = sortByUnit(data); // ترتيب حسب الوحدات
                else if (view === 'morning') { result = data.filter(s => s.workType === 'صباحي' && !isContractEmployee(s)); result = sortByJobNumber(result); }
                else if (view === 'shift') {
                result = data.filter(s => s.workType === 'مناوب');
                // ترتيب حسب الموقع
                const locationOrder = ['وحدة تبريد نهر بن عمر', 'وحدة تبريد باب الزبير', 'وحدة تبريد المركز الثقافي', 'وحدة تبريد المكينة', 'دار استراحة المشروع السكني'];
                result.sort((a, b) => {
                    const indexA = locationOrder.indexOf(a.location);
                    const indexB = locationOrder.indexOf(b.location);
                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            }
                else if (view === 'contract') result = data.filter(s => isContractEmployee(s));
                else if (view === 'safety') {
                    result = data.filter(isInSafetyRoster);
                    if (safetyFilter !== 'all') {
                        result = result.filter(s => safetyFilterGroup(s) === safetyFilter);
                    }
                    result = sortByJobNumber(result); // ترتيب حسب الأرقام الوظيفية، العقود في النهاية
                }
                else if (view === 'maaMorning') {
                    result = data.filter(s =>
                        s.workType === 'صباحي' &&
                        !excludedWaterIds.has(s.id)
                    );
                    result = sortByJobNumber(result);
                }
                else if (view === 'maaShift') {
                result = data.filter(s =>
                    s.workType === 'مناوب' &&
                    !excludedWaterIds.has(s.id)
                );
                // نفس ترتيب المناوبين: حسب الموقع
                const locationOrder = ['وحدة تبريد نهر بن عمر', 'وحدة تبريد باب الزبير', 'وحدة تبريد المركز الثقافي', 'وحدة تبريد المكينة', 'دار استراحة المشروع السكني'];
                result.sort((a, b) => {
                    const indexA = locationOrder.indexOf(a.location);
                    const indexB = locationOrder.indexOf(b.location);
                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            }
                else if (view === 'evaluation') {
                    // التقييم لحظة واحدة لا مدى شهري، فيُفحص تاريخ اليوم فقط
                    const evalDate = localDateStr();
                    result = data.filter(s => {
                        if (isContractEmployee(s)) return false;
                        const p = getActivePeriod(s, evalDate);
                        return !(p && (p.type === 'إجازة طويلة' || p.type === 'إجازة أمومة'));
                    });
                    result = sortByJobNumber(result); // ترتيب حسب الأرقام الوظيفية
                }
                else if (view === 'units') {
                    // عرض الموظفين مجموعين حسب الوحدة (نرجع كل البيانات)
                    result = data;
                }
                else if (view === 'maa') {
                    result = data.filter(s => !excludedWaterIds.has(s.id));
                    // ترتيب: صباحي أولاً (مرتب)، ثم مناوبين (مرتب حسب الوحدة)
                    const morning = result.filter(r => r.workType === 'صباحي');
                    const shift = result.filter(r => r.workType === 'مناوب');
                    
                    // ترتيب المناوبين حسب الوحدات: نهر بن عمر → باب الزبير → المركز الثقافي → المكينة
                    const unitOrder = ['تبريد نهر بن عمر', 'تبريد باب الزبير', 'تبريد المركز الثقافي', 'تبريد المكينة'];
                    shift.sort((a, b) => {
                        const indexA = unitOrder.indexOf(a.unit);
                        const indexB = unitOrder.indexOf(b.unit);
                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });
                    result = [...sortByJobNumber(morning), ...shift];
                }
                else result = data;
                
                // فصل العقود فقط في التبويبات الأخرى (ليس في "الكل")
                if (view === 'all') {
                    // العقود يبقون ضمن وحداتهم
                    return result;
                } else {
                    // في التبويبات الأخرى، العقود في النهاية
                    const contracts = result.filter(s => isContractEmployee(s));
                    const nonContracts = result.filter(s => !isContractEmployee(s));
                    return [...nonContracts, ...contracts];
                }
            }, [staff, filtered, search, view, waterMonth, excludedWaterIds, safetyFilter]);

            // أعداد خيارات فلتر السلامة من نفس القائمة التي يُصفّيها (بعد البحث، قبل الفلتر)
            const safetyGroupCounts = useMemo(() => {
                const counts = { all: 0, renewal: 0, never: 0 };
                if (view !== 'safety') return counts;
                (search ? filtered : staff).forEach(s => {
                    if (!isInSafetyRoster(s)) return;
                    counts.all++;
                    const group = safetyFilterGroup(s);
                    if (group !== 'ok') counts[group]++;
                });
                return counts;
            }, [staff, filtered, search, view]);
            
            const loadFile = (e) => {
                const file = e.target.files[0];
                // تصفير الحقل بعد التقاط الملف: المتصفح لا يُطلق حدث الاختيار لملف مطابق لقيمة الحقل الحالية،
                // فمن ألغى نافذة المزامنة ثم أعاد اختيار ملفه نفسه لم يكن يحدث له شيء. كائن الملف يبقى صالحاً.
                e.target.value = '';
                if (!file) return;
                
                // تحديد نوع الملف
                if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
                    // تحميل ملف نصي يحتوي على بيانات JSON
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            let text = event.target.result.trim();
                            
                            // تنظيف ذكي لعلامات الاقتباس الملتوية ليكون الملف النصي محصناً أيضاً
                            text = text
                                .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\u2033\u2036]/g, '"')
                                .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035`]/g, "'");
                                
                            const data = JSON.parse(text);
                            
                            // في استيراد JSON، نتحقق ما إذا كان الملف هو قالب النسخ الجديد أو مصفوفة قديمة
                            let incomingList = [];
                            if (Array.isArray(data)) {
                                incomingList = data;
                            } else if (data && (Array.isArray(data.staff) || Array.isArray(data.staffData))) {
                                incomingList = data.staff || data.staffData;
                            } else {
                                throw new Error('تنسيق ملف النسخة الاحتياطية غير مدعوم');
                            }
                            // لا يُطبَّق شيء من الملف لحظة اختياره: تُحفظ حزمته كما هي وتنفتح نافذة المزامنة.
                            // كان هذا الفرع يستبدل هنا — قبل أي نقرة — المواقفَ اليومية والإجازات الزمنية والإضافي
                            // والعطل ومرجع المناوبات ومُدخل البيانات، والإلغاء لا يُرجع منها شيئاً.
                            // الحزمة لا يطبّقها كاملةً إلا «الاستبدال الكامل»؛ وكل إغلاق للنافذة يُسقطها.
                            setIncomingBundle(Array.isArray(data) ? null : data);
                            setIncomingStaff(incomingList);
                            setShowMergeModal(true);
                        } catch (err) {
                            alert('خطأ في قراءة البيانات النصية: ' + err.message + '\n\n💡 نصيحة: تأكد من سلامة ملف الـ txt والنسخ الكامل لملف النسخ الاحتياطية.');
                        }
                    };
                    reader.readAsText(file);
                    return;
                }
                
                // تحميل Excel (الكود القديم)
                loadExcel(file);
            };
            
            const loadExcel = async (file) => {
                if (!(await ensureLibs('xlsx'))) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        console.log('بدء قراءة الملف...');
                        const data = new Uint8Array(evt.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        console.log('تم قراءة الملف بنجاح');
                        
                        // قراءة كل البيانات أولاً
                        const rawData = XLSX.utils.sheet_to_json(firstSheet, { 
                            header: 1,  // قراءة كمصفوفات
                            raw: false,
                            defval: ''
                        });
                        console.log(`عدد الصفوف الخام: ${rawData.length}`);
                        
                        // التحقق: هل الصف الأول عبارة عن عنوان merged؟
                        // إذا كان الصف الأول يحتوي على قيمة واحدة فقط وبقية الخلايا فارغة = عنوان
                        let startRow = 0;
                        if (rawData.length > 0) {
                            const firstRow = rawData[0];
                            const nonEmptyCells = firstRow.filter(cell => cell && String(cell).trim() !== '');
                            console.log(`الصف الأول: خلايا غير فارغة = ${nonEmptyCells.length}`);
                            console.log(`أول خلية: ${nonEmptyCells[0]}`);
                            
                            // إذا كان فيه خلية واحدة فقط غير فارغة وتحتوي على "جدول" أو "الملاك" = عنوان
                            if (nonEmptyCells.length === 1 && 
                                (String(nonEmptyCells[0]).includes('جدول') || 
                                 String(nonEmptyCells[0]).includes('الملاك'))) {
                                startRow = 1; // تخطي الصف الأول
                                console.log('تم اكتشاف صف عنوان، سيتم تخطيه');
                            }
                        }
                        
                        // الآن نقرأ البيانات من الصف الصحيح
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
                            range: startRow,  // البدء من الصف المحدد
                            raw: false,
                            defval: ''
                        });
                        console.log(`عدد الموظفين المقروء: ${jsonData.length}`);
                        
                        if (jsonData.length === 0) {
                            throw new Error('الملف فارغ أو لا يحتوي على بيانات صحيحة');
                        }
                        
                        // تحقق مما إذا كانت أعمدة البيانات الإضافية أو الحساسة غائبة تماماً عن الملف المرفوع
                        const hasEmailCol = jsonData.some(row => 
                            row['البريد الإلكتروني'] !== undefined || 
                            row['البريد الالكتروني'] !== undefined || 
                            row['البريد'] !== undefined || 
                            row['Email'] !== undefined || 
                            row['email'] !== undefined
                        );
                        const hasMobileCol = jsonData.some(row => 
                            row['النقال'] !== undefined || 
                            row['mobile'] !== undefined || 
                            row['Mobile'] !== undefined
                        );
                        const hasUniformCol = jsonData.some(row => 
                            row['قياس البدلة'] !== undefined || 
                            row['قياس البدله'] !== undefined
                        );
                        const hasShoeCol = jsonData.some(row => 
                            row['قياس حذاء السلامة'] !== undefined || 
                            row['قياس الحذاء'] !== undefined
                        );
                        const hasSafetyDeliveryCol = jsonData.some(row => 
                            row['تاريخ آخر تجهيز'] !== undefined || 
                            row['تاريخ تجهيز السلامة'] !== undefined || 
                            row['تاريخ التجهيز'] !== undefined
                        );
                        const hasAddressCol = jsonData.some(row => 
                            row['العنوان'] !== undefined || 
                            row['عنوان السكن'] !== undefined || 
                            row['العنوان السكن'] !== undefined || 
                            row['السكن'] !== undefined || 
                            row['address'] !== undefined || 
                            row['Address'] !== undefined
                        );
                        const hasRelativePhoneCol = jsonData.some(row => 
                            row['هاتف احد ذوي الموظف'] !== undefined || 
                            row['هاتف أحد ذوي الموظف'] !== undefined || 
                            row['هاتف ذوي الموظف'] !== undefined || 
                            row['هاتف احد الاقارب'] !== undefined || 
                            row['relativePhone'] !== undefined || 
                            row['RelativePhone'] !== undefined
                        );

                        // قراءة وتحديد الأعمدة المتوفرة بالملف المرفوع للحفاظ على الحقول الحالية إذا غابت الأعمدة
                        const columnsInFile = jsonData.length > 0 ? Object.keys(jsonData[0] || {}) : [];
                        const hasCol = (names) => {
                            return columnsInFile.some(col => names.includes(col));
                        };
                        const hasSquadCol = jsonData.some(row => 
                            row['الوجبة'] !== undefined || 
                            row['وجبة'] !== undefined || 
                            row['squad'] !== undefined || 
                            row['group'] !== undefined || 
                            row['الجروب'] !== undefined
                        );

                        const loadedStaff = jsonData.map((row, index) => {
                            // البحث عن الموظف الحالي لمطابقة وحفظ حقوله المخزنة في حال غياب أعمدتها
                            const empNoString = normalizeJobNumber(String(row['الرقم الوظيفي'] || '').split('.')[0]);
                            const existingEmp = staff.find(s => normalizeJobNumber(s.jobNumber) === empNoString);

                            let status = String(row['الحالة'] || 'نشط').trim();
                            if (status === 'إجازة امومة') status = 'إجازة أمومة';
                            if (!hasCol(['الحالة']) && existingEmp) {
                                status = existingEmp.status || 'نشط';
                            }
                            
                            // معالجة التواريخ بشكل صحيح
                            const hireDateParsed = parseExcelDate(row['تاريخ التعيين']);
                            let hireDateVal = formatDateToString(hireDateParsed);
                            if (!hasCol(['تاريخ التعيين']) && existingEmp) {
                                hireDateVal = existingEmp.hireDate || '';
                            }

                            const birthDateParsed = parseExcelDate(row['التولد']);
                            let birthDateVal = formatDateToString(birthDateParsed);
                            if (!hasCol(['التولد']) && existingEmp) {
                                birthDateVal = existingEmp.birthDate || '';
                            }
                            
                            let emailVal = String(row['البريد الإلكتروني'] || row['البريد الالكتروني'] || row['البريد'] || row['Email'] || row['email'] || '').trim();
                            if (!hasEmailCol && existingEmp) {
                                emailVal = existingEmp.email || '';
                            }
                            
                            let mobileVal = fixPhoneNumber(String(row['النقال'] || '').split('.')[0]);
                            if (!hasMobileCol && existingEmp) {
                                mobileVal = existingEmp.mobile || '';
                            }
                            
                            let addressVal = String(row['العنوان'] || row['عنوان السكن'] || row['العنوان السكن'] || row['السكن'] || row['address'] || row['Address'] || '').trim();
                            if (!hasAddressCol && existingEmp) {
                                addressVal = existingEmp.address || '';
                            }
                            
                            let relativePhoneVal = fixPhoneNumber(String(row['هاتف احد ذوي الموظف'] || row['هاتف أحد ذوي الموظف'] || row['هاتف ذوي الموظف'] || row['هاتف احد الاقارب'] || row['relativePhone'] || row['RelativePhone'] || '').split('.')[0]);
                            if (!hasRelativePhoneCol && existingEmp) {
                                relativePhoneVal = existingEmp.relativePhone || '';
                            }
                            
                            let uniformVal = String(row['قياس البدلة'] || row['قياس البدله'] || '');
                            if (!hasUniformCol && existingEmp) {
                                uniformVal = existingEmp.uniformSize || '';
                            }
                            
                            let shoeVal = String(row['قياس حذاء السلامة'] || row['قياس الحذاء'] || '').split('.')[0];
                            if (!hasShoeCol && existingEmp) {
                                shoeVal = existingEmp.shoeSafetySize || '';
                            }
                            
                            let safetyDeliveryVal = formatDateToString(parseExcelDate(row['تاريخ آخر تجهيز'] || row['تاريخ تجهيز السلامة'] || row['تاريخ التجهيز'] || ''));
                            if (!hasSafetyDeliveryCol && existingEmp) {
                                safetyDeliveryVal = existingEmp.lastSafetyDelivery || '';
                            }

                            let departmentVal = String(row['القسم'] || '');
                            if (!hasCol(['القسم']) && existingEmp) {
                                departmentVal = existingEmp.department || '';
                            }

                            let sectionVal = String(row['الشعبة'] || '');
                            if (!hasCol(['الشعبة']) && existingEmp) {
                                sectionVal = existingEmp.section || '';
                            }

                            let locationVal = String(row['الموقع'] || '');
                            if (!hasCol(['الموقع']) && existingEmp) {
                                locationVal = existingEmp.location || '';
                            }

                            let unitVal = String(row['الوحدة'] || '');
                            if (!hasCol(['الوحدة']) && existingEmp) {
                                unitVal = existingEmp.unit || '';
                            }

                            let workTypeVal = String(row['طبيعة العمل'] || '');
                            if (!hasCol(['طبيعة العمل']) && existingEmp) {
                                workTypeVal = existingEmp.workType || '';
                            }

                            let workPhoneVal = fixPhoneNumber(String(row['هاتف العمل'] || '').split('.')[0]);
                            if (!hasCol(['هاتف العمل']) && existingEmp) {
                                workPhoneVal = existingEmp.workPhone || '';
                            }

                            let workNumberVal = String(row['رقم العمل'] || '').split('.')[0];
                            if (!hasCol(['رقم العمل']) && existingEmp) {
                                workNumberVal = existingEmp.workNumber || '';
                            }

                            let educationVal = String(row['التحصيل الدراسي'] || '');
                            if (!hasCol(['التحصيل الدراسي']) && existingEmp) {
                                educationVal = existingEmp.education || '';
                            }

                            let graduationYearVal = String(row['سنة التخرج'] || '').split('.')[0];
                            if (!hasCol(['سنة التخرج']) && existingEmp) {
                                graduationYearVal = existingEmp.graduationYear || '';
                            }

                            let specializationVal = String(row['الاختصاص'] || '');
                            if (!hasCol(['الاختصاص']) && existingEmp) {
                                specializationVal = existingEmp.specialization || '';
                            }

                            let genderVal = normalizeGender(String(row['الجنس'] || '').trim());
                            if (!hasCol(['الجنس']) && existingEmp) {
                                genderVal = existingEmp.gender || '';
                            }

                            let bankVal = String(row['التوطين'] || '');
                            if (!hasCol(['التوطين']) && existingEmp) {
                                bankVal = existingEmp.bank || '';
                            }

                            let vacationDaysVal = String(row['أيام الإجازة'] || '0');
                            if (!hasCol(['أيام الإجازة']) && existingEmp) {
                                vacationDaysVal = existingEmp.vacationDays || '0';
                            }
                            
                            let squadVal = String(row['الوجبة'] || row['وجبة'] || row['squad'] || row['group'] || row['الجروب'] || '').trim().toUpperCase();
                            if (!hasSquadCol && existingEmp) {
                                squadVal = existingEmp.squad || '';
                            }

                            return {
                                id: 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + index,
                                name: String(row['الاسم الكامل'] || ''),
                                jobNumber: empNoString,
                                jobTitle: String(row['العنوان الوظيفي'] || ''),
                                department: departmentVal,
                                section: sectionVal,
                                location: locationVal,
                                unit: unitVal,
                                workType: workTypeVal,
                                squad: squadVal,
                                shiftType: '',
                                workPhone: workPhoneVal,
                                birthDate: birthDateVal,
                                workNumber: workNumberVal,
                                hireDate: hireDateVal,
                                education: educationVal,
                                graduationYear: graduationYearVal,
                                specialization: specializationVal,
                                gender: genderVal,
                                bank: bankVal,
                                mobile: mobileVal,
                                status: status,
                                vacationDays: vacationDaysVal,
                                uniformSize: uniformVal,
                                shoeSafetySize: shoeVal,
                                lastSafetyDelivery: safetyDeliveryVal,
                                email: emailVal,
                                address: addressVal,
                                relativePhone: relativePhoneVal,
                                statusPeriods: existingEmp ? existingEmp.statusPeriods : undefined,
                                excludeFromWaterLists: existingEmp ? existingEmp.excludeFromWaterLists : undefined
                            };
                        });
                        
                        // تمرير البيانات لواجهة المزامنة والدمج الذكي
                        // ملف Excel لا يحمل بيانات حضور: لا حزمة يطبّقها «الاستبدال الكامل»
                        setIncomingBundle(null);
                        setIncomingStaff(loadedStaff);
                        setShowMergeModal(true);
                    } catch (error) {
                        alert('❌ خطأ في قراءة الملف: ' + error.message);
                    }
                };
                reader.readAsArrayBuffer(file);
            };

            // دالة تصدير جدول قياسي (Excel)
            const exportStandardExcel = async () => {
                if (!(await ensureLibs('xlsx'))) return;
                try {
                    // ترتيب الموظفين حسب الوحدات
                    const unitOrder = ['مقر الشعبة', 'تبريد باب الزبير', 'ورشة التبريد', 'تبريد المكينة', 'تبريد نهر بن عمر', 'تبريد المركز الثقافي'];
                    let sortedStaff = [...staff].sort((a, b) => {
                        const unitA = unitOrder.indexOf(a.unit);
                        const unitB = unitOrder.indexOf(b.unit);
                        if (unitA !== unitB) {
                            return (unitA === -1 ? 999 : unitA) - (unitB === -1 ? 999 : unitB);
                        }
                        return 0;
                    });
                    
                    // ضمان أن أسامة ووسام في البداية دائماً
                    sortedStaff = ensureTopTwo(sortedStaff);
                    
                    // إعداد البيانات للتصدير بالصيغة القياسية المعتمدة (17 عموداً حسب هيكل 2026-06-29)
                    const exportData = sortedStaff.map((emp, index) => ({
                        'ت': index + 1,
                        'الاسم الكامل': emp.name,
                        'الرقم الوظيفي': emp.jobNumber || '',
                        'العنوان الوظيفي': emp.jobTitle || '',
                        'القسم': emp.department || '',
                        'الشعبة': emp.section || '',
                        'الموقع': emp.location || '',
                        'هاتف العمل': emp.workPhone || '',
                        'النقال': emp.mobile || '',
                        'هاتف احد ذوي الموظف': emp.relativePhone || '',
                        'التولد': emp.birthDate || '',
                        'تاريخ التعيين': emp.hireDate || '',
                        'التحصيل الدراسي': emp.education || '',
                        'الاختصاص': emp.specialization || '',
                        'الجنس': emp.gender || '',
                        'عنوان السكن': emp.address || '',
                        'التوطين': emp.bank || ''
                    }));
                    
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    ws['!cols'] = [
                        {wch: 5.8}, // ت
                        {wch: 30.8}, // الاسم الكامل
                        {wch: 12.8}, // الرقم الوظيفي
                        {wch: 20.8}, // العنوان الوظيفي
                        {wch: 25.8}, // القسم
                        {wch: 40.8}, // الشعبة
                        {wch: 20.8}, // الموقع
                        {wch: 12.8}, // هاتف العمل
                        {wch: 15.8}, // النقال
                        {wch: 20.8}, // هاتف احد ذوي الموظف
                        {wch: 12.8}, // التولد
                        {wch: 12.8}, // تاريخ التعيين
                        {wch: 20.8}, // التحصيل الدراسي
                        {wch: 20.8}, // الاختصاص
                        {wch: 10.8}, // الجنس
                        {wch: 30.8}, // عنوان السكن
                        {wch: 25.8}  // التوطين
                    ];
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'جدول الملاك');
                    
                    const date = new Date().toISOString().split('T')[0];
                    XLSX.writeFile(wb, `جدول_الملاك_قياسي_${date}.xlsx`);
                    alert('✅ تم تصدير الجدول القياسي بنجاح!');
                } catch (error) {
                    alert('❌ خطأ في التصدير: ' + error.message);
                }
            };

            // دالة تصدير نسخة احتياطية بصيغة JSON للأمان والخصوصية
            const exportBackupJSON = () => {
                try {
                    const backupData = {
                        version: 'v9.5 Enterprise Cloud Edition',
                        exportDate: new Date().toISOString(),
                        staff: staff,
                        staffData: staff,
                        officialHolidaysList: officialHolidays,
                        hourlyLeaveRecords: hourlyLeaveRecords,
                        hourlyLeaveTimings: hourlyLeaveTimings,
                        overtimeHoursRecords: overtimeHoursRecords,
                        dailyStatusOverrides: dailyStatusOverrides,
                        shiftAnchorDate: anchorDate,
                        threeShiftAnchorSquad: threeShiftAnchorSquad,
                        twoShiftAnchorSquad: twoShiftAnchorSquad,
                        dataEntryOperator: dataEntryOperator,
                        overtimeSelectedIds: overtimeIds,
                        mergeTombstones: mergeTombstones,
                        // مرجع النسخة السحابية التي بُني عليها هذا الملف: يُقارَن قبل أي استبدال كامل
                        baseCloudUpdate: (typeof knownServerUpdateRef !== 'undefined' && knownServerUpdateRef && knownServerUpdateRef.current) ? knownServerUpdateRef.current : ''
                    };
                    const dataStr = JSON.stringify(backupData, null, 2);
                    const dataBlob = new Blob([dataStr], {type: 'application/json'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    const date = new Date().toISOString().split('T')[0];
                    link.download = `نظام_الملاك_نسخة_احتياطية_${date}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    
                    const today = new Date().toISOString();
                    safeStorage.setItem('lastBackupDate', today);
                    setLastBackupDate(today);
                    alert('✅ تم تصدير قاعدة البيانات (JSON) بنجاح كنسخة احتياطية!');
                } catch (error) {
                    alert('❌ خطأ في تصدير النسخة الاحتياطية: ' + error.message);
                }
            };
            
            // دالة تصدير تجهيزات السلامة
            const exportSafetyEquipment = async () => {
                if (!(await ensureLibs('xlsx'))) return;
                try {
                    // فلترة الموظفين (ذكور نشطين، مع العقود، استثناء الإداريين المعفَين)
                    let safetyStaff = staff.filter(isInSafetyRoster);
                    
                    // ترتيب حسب الرقم الوظيفي مع العقود في النهاية
                    safetyStaff = sortByJobNumber(safetyStaff);
                    
                    // إعداد البيانات للتصدير
                    const exportData = safetyStaff.map((emp, index) => {
                        // استخراج الاسم الثلاثي (أول 3 أسماء)
                        const nameParts = emp.name.trim().split(/\s+/);
                        const tripleName = nameParts.slice(0, 3).join(' ');
                        
                        return {
                            'ت': index + 1,
                            'الرقم الوظيفي': emp.jobNumber,
                            'الأسم الثلاثي': tripleName,
                            'العنوان الوظيفي': emp.jobTitle,
                            'قياس البدله': emp.uniformSize || '',
                            'قياس حذاء السلامة': emp.shoeSafetySize || ''
                        };
                    });
                    
                    // إنشاء الملف
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    
                    // إضافة صف العنوان
                    XLSX.utils.sheet_add_aoa(ws, [['كادر شعبة تبريد المركز ومحطة عزل نهر بن عمر']], {origin: 'A1'});
                    
                    // دمج الخلايا للعنوان
                    if (!ws['!merges']) ws['!merges'] = [];
                    ws['!merges'].push({s: {r: 0, c: 0}, e: {r: 0, c: 5}});
                    
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'تجهيزات السلامة');
                    
                    const date = new Date().toISOString().split('T')[0];
                    XLSX.writeFile(wb, `تجهيزات_السلامة_${date}.xlsx`);
                    alert('✅ تم تصدير تجهيزات السلامة بنجاح!');
                } catch (error) {
                    alert('❌ خطأ في التصدير: ' + error.message);
                }
            };

            const performAdvancedSearch = () => {
                let results = staff;
                
                // فلتر حسب العنوان الوظيفي — مع توحيد الأحرف (ة/ه، أإآ/ا)
                if (advancedSearch.jobTitle) {
                    const normTitle = normalizeArabic(advancedSearch.jobTitle);
                    results = results.filter(s => 
                        normalizeArabic(s.jobTitle).includes(normTitle)
                    );
                }
                
                // فلتر حسب الموقع
                if (advancedSearch.location && advancedSearch.location !== 'الكل' && advancedSearch.location !== '') {
                    const normLoc = normalizeArabic(advancedSearch.location);
                    results = results.filter(s => normalizeArabic(s.location) === normLoc);
                }
                
                // فلتر حسب الوحدة
                if (advancedSearch.unit && advancedSearch.unit !== 'الكل' && advancedSearch.unit !== '') {
                    const normUnit = normalizeArabic(advancedSearch.unit);
                    results = results.filter(s => normalizeArabic(s.unit) === normUnit);
                }
                
                // فلتر حسب سنوات الخدمة
                if (advancedSearch.yearsOfService) {
                    const yearsFilter = advancedSearch.yearsOfService;
                    results = results.filter(s => {
                        const years = calculateYearsOfService(s.hireDate);
                        if (yearsFilter === 'أقل من 5') return years < 5;
                        if (yearsFilter === '5-10') return years >= 5 && years <= 10;
                        if (yearsFilter === '10-15') return years > 10 && years <= 15;
                        if (yearsFilter === 'أكثر من 15') return years > 15;
                        return true;
                    });
                }
                
                setAdvancedResults(results);
            };
            
            const clearAdvancedSearch = () => {
                setAdvancedSearch({ jobTitle: '', location: '', unit: '', yearsOfService: '' });
                setAdvancedResults([]);
            };

            // بحث حسب التحصيل الدراسي أو سنة التخرج أو تاريخ التعيين
            const performEduSearch = () => {
                let results = staff;
                const { education, graduationYear, hireYear } = eduSearch;
                if (education) {
                    results = results.filter(s => s.education && s.education.includes(education));
                }
                if (graduationYear) {
                    results = results.filter(s => s.graduationYear && String(s.graduationYear).includes(graduationYear));
                }
                if (hireYear) {
                    results = results.filter(s => s.hireDate && String(s.hireDate).includes(hireYear));
                }
                setEduResults(results);
            };

            const clearEduSearch = () => {
                setEduSearch({ education: '', graduationYear: '', hireYear: '' });
                setEduResults([]);
            };


            const performUnifiedSearch = () => {
                let results = staff;
                const rawQ = unifiedQuery.trim();
                const qNormalized = normalizeArabic(rawQ);
                const q = qNormalized.replace(/\s+/g, ''); // إزالة المسافات للبحث المرن بالأسماء المركبة
                const qExpanded = expandAbbrev(qNormalized).replace(/\s+/g, '');
                const f = unifiedFilters;
                if (q) {
                    results = results.filter(s =>
                        normalizeArabicForSearch(s.name||'').includes(q) ||
                        String(s.jobNumber||'').includes(rawQ) ||
                        normalizeArabicForSearch(s.jobTitle||'').includes(q) ||
                        normalizeArabicForSearch(s.jobTitle||'').includes(qExpanded) ||
                        normalizeArabicForSearch(s.unit||'').includes(q) ||
                        normalizeArabicForSearch(s.location||'').includes(q) ||
                        normalizeArabicForSearch(s.education||'').includes(q) ||
                        normalizeArabicForSearch(s.address||'').includes(q) ||
                        String(s.relativePhone||'').includes(rawQ) ||
                        normalizeArabicForSearch(s.specialization||'').includes(q) ||
                        normalizeArabicForSearch(s.email||'').includes(q)
                    );
                }
                if (f.gender)        results = results.filter(s => s.gender === f.gender);
                if (f.location)      results = results.filter(s => normalizeArabic(s.location||'') === normalizeArabic(f.location));
                if (f.selectedUnits && f.selectedUnits.length > 0) {
                    results = results.filter(s => f.selectedUnits.some(u => normalizeArabic(s.unit||'') === normalizeArabic(u)));
                } else if (f.unit) {
                    results = results.filter(s => normalizeArabic(s.unit||'') === normalizeArabic(f.unit));
                }
                if (f.workType)      results = results.filter(s => normalizeArabic(s.workType||'') === normalizeArabic(f.workType));
                if (f.education)     results = results.filter(s => normalizeArabic(s.education||'').includes(normalizeArabic(f.education)));
                if (f.graduationYear) results = results.filter(s => String(s.graduationYear||'').includes(f.graduationYear));
                if (f.hireYear)      results = results.filter(s => String(s.hireDate||'').includes(f.hireYear));
                if (f.hasMissingInfo === 'yes') results = results.filter(s => getMissingFields(s).length > 0);
                if (f.yearsOfService) {
                    results = results.filter(s => {
                        const y = calculateYearsOfService(s.hireDate);
                        if (f.yearsOfService === 'أقل من 5')   return y < 5;
                        if (f.yearsOfService === '5-10')        return y >= 5 && y <= 10;
                        if (f.yearsOfService === '10-15')       return y > 10 && y <= 15;
                        if (f.yearsOfService === 'أكثر من 15') return y > 15;
                        return true;
                    });
                }
                setUnifiedResults(results);
            };

            const clearUnifiedSearch = () => {
                setUnifiedQuery('');
                setUnifiedFilters({ location:'', unit:'', workType:'', education:'', yearsOfService:'', graduationYear:'', hireYear:'', gender:'', hasMissingInfo:'' });
                setUnifiedResults(null);
            };
            
            const openEditModal = (employee) => {
                setEditingEmployee({...employee});
                setShowEditModal(true);
            };
            
            const deleteEmployee = () => {
                if (!editingEmployee) return;
                if (!canEdit('staffMaster')) {
                    alert('⛔ عذراً، ليس لديك صلاحية حذف منتسبين من الملاك العام!\nتم منحك صلاحية العرض والاطلاع والطباعة فقط.');
                    return;
                }
                if (!authorizeEmployeeDelete()) return;
                // تأكيد مزدوج للحذف
                const firstName = editingEmployee.name.split(' ')[0];
                const confirmMsg1 = `⚠️ هل أنت متأكد من حذف الموظف؟

الموظف: ${editingEmployee.name}
الرقم الوظيفي: ${editingEmployee.jobNumber}

⚠️ هذه العملية لا يمكن التراجع عنها!`;
                
                if (!confirm(confirmMsg1)) {
                    return;
                }
                
                // تأكيد ثاني (أقوى)
                const confirmMsg2 = `⚠️⚠️ تأكيد نهائي ⚠️⚠️

أنت على وشك حذف: ${editingEmployee.name}

اكتب اسم الموظف الأول (${firstName}) للتأكيد:`;
                const userInput = prompt(confirmMsg2);
                
                if (userInput !== firstName) {
                    alert('❌ تم إلغاء عملية الحذف\n\nالاسم المدخل غير مطابق.');
                    return;
                }
                
                // القيد يُكتب بعد التأكيد النهائي: السجل لا يُمحى، فلا يجوز أن يوثّق حذفاً لم يقع
                logAuditEvent('delete_employee:' + (editingEmployee.jobNumber || editingEmployee.id), currentUserName);

                // حذف الموظف — ويُسجَّل محذوفاً فلا يعود صامتاً من ملف أقدم يحمله
                updateTombstones({ addEmployees: [{ job: editingEmployee.jobNumber, name: editingEmployee.name }] });
                setStaff(staff.filter(s => s.id !== editingEmployee.id));
                setShowEditModal(false);
                setEditingEmployee(null);
                alert('✅ تم حذف الموظف من النظام');
            };
            
            const saveEmployeeEdit = () => {
                if (!editingEmployee) return;
                const rawPeriods = periodsOf(editingEmployee);
                if (rawPeriods.some(p => p && !p.from)) {
                    alert('⛔ إحدى الفترات بلا تاريخ بداية. الرجاء تحديد تاريخ البداية لكل فترة أو حذفها.');
                    return;
                }
                const periods = rawPeriods;
                for (let i = 0; i < periods.length; i++) {
                    for (let j = i + 1; j < periods.length; j++) {
                        const a = periods[i], b = periods[j];
                        const aEnd = a.to || '9999-12-31';
                        const bEnd = b.to || '9999-12-31';
                        if (a.from <= bEnd && b.from <= aEnd) {
                            alert('⛔ فترتان متداخلتان: «' + a.type + '» و«' + b.type + '».' + String.fromCharCode(10,10) + 'لا يمكن أن يكون الموظف في حالتين في اليوم نفسه. عدّل التواريخ ثم أعد الحفظ.');
                            return;
                        }
                    }
                }
                if (!canEdit('staffMaster')) {
                    alert('⛔ عذراً، ليس لديك صلاحية إضافة أو تعديل بيانات الملاك العام والمنتسبين!\nتم منحك صلاحية العرض والاطلاع والطباعة فقط.');
                    return;
                }
                
                // التحقق من رقم النقال
                if (editingEmployee.mobile && editingEmployee.mobile.length > 0) {
                    const mobilePattern = /^07[0-9]{9}$/;
                    if (!mobilePattern.test(editingEmployee.mobile)) {
                        alert('⚠️ رقم النقال غير صحيح!\n\nيجب أن يبدأ بـ 07 ويتكون من 11 رقم.\nمثال: 07801234567');
                        return;
                    }
                }

                // ⛔ التحقق من تكرار الرقم الوظيفي
                const jobNumStr = normalizeJobNumber(editingEmployee.jobNumber);
                if (!jobNumStr) {
                    alert('⚠️ الرقم الوظيفي مطلوب!');
                    return;
                }
                const duplicate = staff.find(s =>
                    normalizeJobNumber(s.jobNumber) === jobNumStr && s.id !== editingEmployee.id
                );
                if (duplicate) {
                    alert(`⛔ الرقم الوظيفي ${jobNumStr} مستخدم مسبقاً!\n\nالموظف: ${duplicate.name}\nالوحدة: ${duplicate.unit}\n\nالرجاء إدخال رقم وظيفي مختلف.`);
                    return;
                }
                
                // التحقق من نوع العملية: إذا كان المعرف موجوداً في القائمة → تعديل، وإلا → إضافة جديدة
                const isNewEmployee = !staff.some(s => s.id === editingEmployee.id);
                const confirmMsg = isNewEmployee 
                    ? '✅ هل أنت متأكد من إضافة هذا الموظف الجديد؟\n\nسيتم إضافة الموظف إلى القاعدة فوراً.' 
                    : '✅ هل أنت متأكد من حفظ التعديلات؟\n\nسيتم تحديث بيانات الموظف فوراً.';
                
                if (!confirm(confirmMsg)) return;
                
                let updatedStaff;
                const employeeToSave = {
                    ...editingEmployee,
                    lastModified: new Date().toISOString()
                };
                if (isNewEmployee) {
                    updatedStaff = [...staff, employeeToSave];
                    alert('✅ تم إضافة الموظف بنجاح!');
                } else {
                    updatedStaff = staff.map(s => s.id === editingEmployee.id ? employeeToSave : s);
                    alert('✅ تم حفظ التعديلات بنجاح!');
                }
                
                const sortedStaff = sortByUnit(updatedStaff);
                setStaff(sortedStaff);
                safeStorage.setItem('staffData', JSON.stringify(sortedStaff));
                // بث مباشر وفوري للسحابة فور الضغط على حفظ
                pushDataToCloud({
                    staffData: sortedStaff,
                    systemUsersList: systemUsers,
                    officialHolidaysList: officialHolidays,
                    hourlyLeaveRecords: hourlyLeaveRecords,
                    hourlyLeaveTimings: hourlyLeaveTimings,
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
                setShowEditModal(false);
                setEditingEmployee(null);
                stopCamera();
            };
            
            const cancelEdit = () => {
                setShowEditModal(false);
                setEditingEmployee(null);
                stopCamera();
            };

            // ===== دوال الكاميرا والالتقاط =====
            const startCamera = async () => {
                setShowCamera(true);
                setTimeout(async () => {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { width: 400, height: 400, facingMode: "user" } 
                        });
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            videoRef.current.play();
                        }
                    } catch (err) {
                        alert("⚠️ لم نتمكن من تشغيل الكاميرا. يرجى التحقق من إعطاء الصلاحيات اللازمة للمتصفح.");
                        setShowCamera(false);
                    }
                }, 150);
            };

            const stopCamera = () => {
                if (videoRef.current && videoRef.current.srcObject) {
                    const tracks = videoRef.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
                setShowCamera(false);
            };

            const capturePhoto = () => {
                if (videoRef.current) {
                    const canvas = document.createElement("canvas");
                    canvas.width = 250;
                    canvas.height = 250;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(videoRef.current, 0, 0, 250, 250);
                    // ضغط عالي للصورة JPEG بجودة 0.8 لتقليل المساحة
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                    updateEditField("photo", dataUrl);
                    stopCamera();
                }
            };

            const addPeriodToEditing = () => {
                if (!editingEmployee) return;
                const today = localDateStr();
                const next = [...periodsOf(editingEmployee), { id: 'per_' + Date.now(), type: 'في دورة', from: today, to: '', note: '' }];
                setEditingEmployee({ ...editingEmployee, statusPeriods: next });
            };

            const updateEditingPeriod = (index, key, value) => {
                if (!editingEmployee) return;
                const next = periodsOf(editingEmployee).map((p, i) => i === index ? { ...p, [key]: value } : p);
                setEditingEmployee({ ...editingEmployee, statusPeriods: next });
            };

            const removeEditingPeriod = (index) => {
                if (!editingEmployee) return;
                const next = periodsOf(editingEmployee).filter((p, i) => i !== index);
                setEditingEmployee({ ...editingEmployee, statusPeriods: next });
            };

            const updateEditField = (field, value) => {
                if (field === 'name' && value) {
                    const guessedGender = guessGender(value);
                    setEditingEmployee({...editingEmployee, name: value, gender: guessedGender});
                } else if (field === 'jobNumber') {
                    // يُوحَّد فور الكتابة، لا عند المقارنة وحدها — فلا تتراكم بيانات جديدة بخط أرقام مختلف
                    setEditingEmployee({...editingEmployee, jobNumber: normalizeJobNumber(value)});
                } else {
                    setEditingEmployee({...editingEmployee, [field]: value});
                }
            };
            
            const clearAllData = () => {
                if (currentUserRole !== 'admin') {
                    // مسار الإداري المُدخل: تقديم طلب حذف رسمي لمدير النظام
                    const reason = prompt('📝 تقديم طلب حذف رسمي لمدير النظام:\n\nيرجى كتابة سبب طلب حذف أو تفريغ قاعدة البيانات ليتم إرسال إشعار للموافقة:');
                    if (!reason || !reason.trim()) {
                        alert('⚠️ تم إلغاء الطلب: يجب كتابة سبب الحذف.');
                        return;
                    }
                    const newRequest = {
                        id: 'del_req_' + Date.now(),
                        requestedBy: currentUserName || dataEntryOperator || 'الإداري المُدخل',
                        reason: reason.trim(),
                        timestamp: new Date().toLocaleString('ar-IQ'),
                        status: 'pending'
                    };
                    setPendingDeletionRequest(newRequest);
                    safeStorage.setItem('pendingDeletionRequest', JSON.stringify(newRequest));
                    pushDataToCloud({
                        staffData: staff,
                        systemUsersList: systemUsers,
                        officialHolidaysList: officialHolidays,
                        hourlyLeaveRecords: hourlyLeaveRecords,
                        hourlyLeaveTimings: hourlyLeaveTimings,
                        overtimeHoursRecords: overtimeHoursRecords,
                        dailyStatusOverrides: dailyStatusOverrides,
                        shiftAnchorDate: anchorDate,
                        threeShiftAnchorSquad: threeShiftAnchorSquad,
                        twoShiftAnchorSquad: twoShiftAnchorSquad,
                        dataEntryOperator: dataEntryOperator,
                        overtimeSelectedIds: overtimeIds,
                        lastCloudUpdate: new Date().toISOString(),
                        pendingDeletionRequest: newRequest
                    });
                    alert('📨 تم إرسال طلب الحذف بنجاح إلى (👑 مدير النظام الرئيسي)!\n\nستصل رسالة لمدير النظام، وبمجرد موافقته سيتم تفريغ القاعدة سحابياً.');
                    return;
                }

                // مسار مدير النظام المباشر
                if (!authorizeDirectWipe()) return;
                if (confirm('⚠️ تحذير أمني:\n\nهل أنت متأكد تماماً من تفريغ ومسح قاعدة البيانات بالكامل؟\nسيتم تعميم المسح سحابياً على جميع أجهزة الشعبة.')) {
                    executeCompleteDatabaseWipe();
                }
            };

            // دالة التنفيذ الفعلي لمسح وتفريغ قاعدة البيانات
            const executeCompleteDatabaseWipe = () => {
                setStaff([]);
                setDailyStatusOverrides({});
                setHourlyLeaveRecords({});
                setHourlyLeaveTimings({});
                setOvertimeHoursRecords({});
                setPendingDeletionRequest(null);
                safeStorage.setItem('staffData', JSON.stringify([]));
                safeStorage.setItem('dailyStatusOverrides', JSON.stringify({}));
                safeStorage.removeItem('pendingDeletionRequest');
                pushDataToCloud({
                    staffData: [],
                    systemUsersList: systemUsers,
                    officialHolidaysList: officialHolidays,
                    hourlyLeaveRecords: {},
                    hourlyLeaveTimings: {},
                    overtimeHoursRecords: {},
                    dailyStatusOverrides: {},
                    shiftAnchorDate: anchorDate,
                    threeShiftAnchorSquad: threeShiftAnchorSquad,
                    twoShiftAnchorSquad: twoShiftAnchorSquad,
                    dataEntryOperator: dataEntryOperator,
                    overtimeSelectedIds: [],
                    lastCloudUpdate: new Date().toISOString(),
                    pendingDeletionRequest: null
                });
                setView('dashboard');
                alert('✅ تم مسح وتفريغ قاعدة البيانات بنجاح وتعميم ذلك سحابياً على كافة الأجهزة.');
            };

            // دالة رفض طلب الحذف من قبل مدير النظام
            const rejectDeletionRequest = () => {
                setPendingDeletionRequest(null);
                safeStorage.removeItem('pendingDeletionRequest');
                pushDataToCloud({
                    staffData: staff,
                    systemUsersList: systemUsers,
                    officialHolidaysList: officialHolidays,
                    hourlyLeaveRecords: hourlyLeaveRecords,
                    hourlyLeaveTimings: hourlyLeaveTimings,
                    overtimeHoursRecords: overtimeHoursRecords,
                    dailyStatusOverrides: dailyStatusOverrides,
                    shiftAnchorDate: anchorDate,
                    threeShiftAnchorSquad: threeShiftAnchorSquad,
                    twoShiftAnchorSquad: twoShiftAnchorSquad,
                    dataEntryOperator: dataEntryOperator,
                    overtimeSelectedIds: overtimeIds,
                    lastCloudUpdate: new Date().toISOString(),
                    pendingDeletionRequest: null
                });
                alert('❌ تم رفض وإلغاء طلب الحذف.');
            };
            
            // دالة تحديث القياسات من ملف Excel
            const updateMeasurementsFromFile = async (event) => {
                const file = event.target.files[0];
                if (!file) return;
                if (!(await ensureLibs('xlsx'))) return;
                
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const data = new Uint8Array(evt.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        
                        // قراءة البيانات (تخطي صفوف العنوان)
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
                            range: 4,  // البدء من الصف 5 (بعد العنوان والأعمدة)
                            raw: false,
                            defval: ''
                        });
                        
                        let updatedCount = 0;
                        let notFoundCount = 0;
                        const notFoundNumbers = [];
                        
                        // تحديث القياسات للموظفين الموجودين
                        const updatedStaff = staff.map(emp => {
                            // البحث عن الموظف في ملف القياسات
                            const measurementRow = jsonData.find(row => 
                                String(row['الرقم الوظيفي'] || '').trim().split('.')[0] === emp.jobNumber
                            );
                            
                            if (measurementRow) {
                                updatedCount++;
                                return {
                                    ...emp,
                                    uniformSize: String(measurementRow['قياس البدله'] || '').trim(),
                                    shoeSafetySize: String(measurementRow['قياس حذاء السلامة'] || '').trim().split('.')[0],
                                    lastSafetyDelivery: formatDateToString(parseExcelDate(measurementRow['تاريخ آخر تجهيز'] || measurementRow['تاريخ تجهيز السلامة'] || measurementRow['تاريخ التجهيز'] || emp.lastSafetyDelivery || ''))
                                };
                            }
                            return emp;
                        });
                        
                        // التحقق من وجود موظفين في الملف غير موجودين في النظام
                        jsonData.forEach(row => {
                            const jobNum = String(row['الرقم الوظيفي'] || '').trim().split('.')[0];
                            if (jobNum && !staff.find(s => s.jobNumber === jobNum)) {
                                notFoundCount++;
                                notFoundNumbers.push(jobNum);
                            }
                        });
                        
                        setStaff(updatedStaff);
                        
                        let message = `✅ تم تحديث القياسات بنجاح!\n\n`;
                        message += `📊 الإحصائيات:\n`;
                        message += `✅ تم تحديث: ${updatedCount} موظف\n`;
                        message += `❌ غير موجود في النظام: ${notFoundCount} موظف\n`;
                        
                        if (notFoundNumbers.length > 0 && notFoundNumbers.length <= 10) {
                            message += `\n🔢 الأرقام الوظيفية غير الموجودة:\n${notFoundNumbers.join(', ')}`;
                        }
                        
                        alert(message);
                        
                        // إعادة تعيين input file
                        event.target.value = '';
                    } catch (error) {
                        alert('❌ خطأ في قراءة الملف: ' + error.message);
                    }
                };
                reader.readAsArrayBuffer(file);
            };
            
            
            const [quickPeriod, setQuickPeriod] = useState(null);

            // سجل فترات موظف واحد. الجدول لا يعرض إلا نوع الفترة السارية اليوم، فمداها وبقية
            // فتراته لم تكن مرئية في الواجهة إطلاقاً: لا في بطاقته (حُذف محرّر الفترات منها عمداً)
            // ولا في أي شاشة أخرى — كان لا بدّ من تصدير الملف وقراءته لمعرفة متى تنتهي إجازة.
            const [periodHistoryEmpId, setPeriodHistoryEmpId] = useState(null);

            // التواريخ داخل bdi: تاريخ بعد نصّ عربي ينعكس ترتيبه في العرض ثنائي الاتجاه
            const periodSpanJsx = (p) => (p && p.to)
                ? (<React.Fragment><bdi dir="ltr" className="whitespace-nowrap">{p.from}</bdi> ← <bdi dir="ltr" className="whitespace-nowrap">{p.to}</bdi></React.Fragment>)
                : (<React.Fragment>منذ <bdi dir="ltr" className="whitespace-nowrap">{p ? p.from : ''}</bdi> (مستمرة)</React.Fragment>);

            React.useEffect(() => {
                if (!periodHistoryEmpId) return;
                const onKey = (e) => { if (e.key === 'Escape') setPeriodHistoryEmpId(null); };
                window.addEventListener('keydown', onKey);
                return () => window.removeEventListener('keydown', onKey);
            }, [periodHistoryEmpId]);



            const changeStatus = (id, newStatus) => {
                if (!canEdit('staffMaster')) {
                    alert('⛔ عذراً، ليس لديك صلاحية تعديل موقف المنتسبين!');
                    return;
                }
                const emp = staff.find(s => s.id === id);
                if (!emp) return;

                if (newStatus === 'نشط') {
                    const today = localDateStr();
                    const active = getActivePeriod(emp, today);
                    if (!active || active.legacy) {
                        const updated = staff.map(s => s.id === id ? { ...s, status: 'نشط' } : s);
                        setStaff(updated);
                        safeStorage.setItem('staffData', JSON.stringify(updated));
                        pushDataToCloud(buildCloudBundle({ staffData: updated }));
                        logAuditEvent('change_status:نشط:' + (emp.jobNumber || emp.id), currentUserName);
                        return;
                    }
                    // فترة بدأت اليوم نفسه أو لم تبدأ بعد: لا يوجد يوم فعلي "قبلها" لإغلاقها عنده،
                    // فحذفها كلياً (كأنها لم تُدخَل) هو المعادل الصحيح لإنهائها فوراً، لا رفض العملية
                    const updatedPeriods = active.from >= today
                        ? periodsOf(emp).filter(p => p.id !== active.id)
                        : periodsOf(emp).map(p => p.id === active.id ? { ...p, to: localDateStr(new Date(today).getTime() - 86400000) } : p);
                    // فترة حُذفت كلياً (لم تبدأ بعد أو بدأت اليوم) تُسجَّل؛ الفترة التي أُغلقت عند الأمس تبقى بهويتها فلا تذكرة لها
                    if (active.from >= today) updateTombstones({ addPeriods: [periodIdentityOf(active)] });
                    const updated = staff.map(s => s.id === id ? { ...s, statusPeriods: updatedPeriods, status: 'نشط' } : s);
                    setStaff(updated);
                    safeStorage.setItem('staffData', JSON.stringify(updated));
                    pushDataToCloud(buildCloudBundle({ staffData: updated }));
                    logAuditEvent('end_period:' + active.type + ':' + (emp.jobNumber || emp.id), currentUserName);
                    return;
                }

                // بقية الأنواع تُدخَل من نافذة الفترة السريعة (تقويم منبثق ومدة محسوبة) لا من رسائل نصية
                setQuickPeriod({
                    empId: id,
                    empName: emp.name,
                    category: newStatus,
                    paid: true,
                    from: localDateStr(),
                    mode: 'duration',
                    count: '',
                    unit: 'days',
                    to: ''
                });
            };

            // التعديل لا يفتح محرّراً ثانياً: النافذة نفسها مملوءة، فيبقى إدخال الفترات في مسار واحد
            const openPeriodEdit = (emp, p) => {
                if (!canEdit('staffMaster')) {
                    alert('⛔ عذراً، ليس لديك صلاحية تعديل موقف المنتسبين!');
                    return;
                }
                // «إجازة طويلة» في النافذة فئة تتفرّع بمفتاح «براتب» إلى اعتيادية/بدون راتب، فتُعكَس هنا.
                // أما نوع مخزَّن اسمه «إجازة طويلة» حرفياً (من استيراد قديم) فيُقفَل نوعه كي لا يتبدّل صامتاً.
                const isSplit = (p.type === 'إجازة اعتيادية' || p.type === 'إجازة بدون راتب');
                // فترة قديمة بلا معرّف (ملف يدوي أو نسخة سابقة على اعتماد per_<وقت>): تُمنح معرّفاً ثابتاً
                // وتُحفظ فوراً — وإلا صار editingId أدناه undefined فتُحفَظ فترة موازية بدل استبدال هذه
                let period = p;
                if (!period.id) {
                    const newId = 'per_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                    const patched = periodsOf(emp).map(x => x === p ? { ...x, id: newId } : x);
                    const patchedStaff = staff.map(s => s.id === emp.id ? { ...s, statusPeriods: patched } : s);
                    setStaff(patchedStaff);
                    safeStorage.setItem('staffData', JSON.stringify(patchedStaff));
                    period = { ...p, id: newId };
                }
                setPeriodHistoryEmpId(null);
                setQuickPeriod({
                    empId: emp.id,
                    empName: emp.name,
                    category: isSplit ? 'إجازة طويلة' : period.type,
                    keepType: !isSplit,
                    paid: period.type !== 'إجازة بدون راتب',
                    from: period.from,
                    mode: 'date',
                    count: '',
                    unit: 'days',
                    to: period.to || '',
                    editingId: period.id,
                    note: period.note || '',
                    originalTo: period.to || '',
                    confirmedReturn: !!period.confirmedReturn
                });
            };

            const deletePeriodFromHistory = (emp, p) => {
                if (!canEdit('staffMaster')) {
                    alert('⛔ عذراً، ليس لديك صلاحية تعديل موقف المنتسبين!');
                    return;
                }
                const NL = String.fromCharCode(10);
                const ok = confirm('⚠️ حذف الفترة «' + p.type + '» (' + p.from + ' → ' + (p.to || 'مستمرة') + ')؟' + NL + NL +
                    'تُحذف من جهازك، وتُسجَّل كمحذوفة فلا يُعيدها ملف أقدم عند المزامنة.');
                if (!ok) return;
                // تطابق المرجع وحده، لا id: p هو الكائن الحيّ نفسه من emp.statusPeriods (نافذة السجل
                // تبنيه بـ .slice() — نسخ ضحل يبقي الكائنات كما هي)، ومقارنة id عند غيابه (undefined) كانت
                // تحذف كل الفترات بلا معرّف معاً بدل واحدة فقط
                const rest = periodsOf(emp).filter(x => x !== p);
                updateTombstones({ addPeriods: [periodIdentityOf(p)] });
                // الحالة تتبع فترة اليوم بعد الحذف، لا نوع الفترة المحذوفة
                const activeNow = getActivePeriod({ ...emp, statusPeriods: rest }, localDateStr());
                const updated = staff.map(s => s.id === emp.id ? { ...s, statusPeriods: rest, status: (activeNow && !activeNow.legacy) ? activeNow.type : 'نشط' } : s);
                setStaff(updated);
                safeStorage.setItem('staffData', JSON.stringify(updated));
                pushDataToCloud(buildCloudBundle({ staffData: updated }));
                if (typeof logAuditEvent === 'function') logAuditEvent('delete_period:' + p.type + ':' + (emp.jobNumber || emp.id), currentUserName);
            };

            const saveQuickPeriod = () => {
                if (!quickPeriod) return;
                const emp = staff.find(s => s.id === quickPeriod.empId);
                if (!emp) { setQuickPeriod(null); return; }
                const from = quickPeriod.from;
                if (!from) {
                    alert('⛔ تاريخ البداية مطلوب.');
                    return;
                }
                // «إجازة طويلة» فئة يُضغط عليها في القائمة لا نوع مخزَّن: الطويلة براتب هي اعتيادية بمدة طويلة
                // التعديل يُبقي الفترة بهويتها: تُستثنى من فحص التداخل مع نفسها، ويُعاد استعمال معرّفها
                const editingId = quickPeriod.editingId || null;
                const periodType = (quickPeriod.category === 'إجازة طويلة' && !quickPeriod.keepType)
                    ? (quickPeriod.paid ? 'إجازة اعتيادية' : 'إجازة بدون راتب')
                    : quickPeriod.category;
                const to = quickPeriodEnd(quickPeriod);
                if (!to && !OPEN_ENDED_PERIOD_TYPES.includes(quickPeriod.category)) {
                    alert('⛔ المدة مطلوبة لهذا النوع من الفترات. الغياب وسحب اليد وحدهما يُتركان مفتوحي النهاية.');
                    return;
                }
                if (to && to < from) {
                    alert('⛔ تاريخ النهاية قبل تاريخ البداية.');
                    return;
                }

                const existing = periodsOf(emp).filter(p => p && p.from && p.id !== editingId);
                const newEnd = to || '9999-12-31';
                const conflicts = existing.filter(p => {
                    const pEnd = p.to || '9999-12-31';
                    return from <= pEnd && p.from <= newEnd;
                });
                // التداخل لم يعد طريقاً مسدوداً: محرّر الفترات لم يعد موجوداً في نافذة الموظف،
                // فرفض الحفظ بلا بديل يعني فترة خاطئة لا سبيل لتصحيحها من الواجهة إطلاقاً.
                // نعرض الاستبدال صراحةً بدل ذلك.
                if (conflicts.length > 0) {
                    const list = conflicts.map(p => '«' + p.type + '» (' + p.from + ' → ' + (p.to || 'مستمرة') + ')').join('، ');
                    const ok = confirm(
                        '⚠️ تتداخل هذه الفترة مع: ' + list + String.fromCharCode(10,10) +
                        'هل تستبدلها بالفترة الجديدة «' + periodType + '» (' + from + ' → ' + (to || 'مستمرة') + ')؟' + String.fromCharCode(10,10) +
                        'موافق = تُحذف الفترة المتداخلة وتحلّ الجديدة محلها.' + String.fromCharCode(10) +
                        'إلغاء = لا يُحفظ شيء وتبقى الفترة الحالية كما هي.'
                    );
                    if (!ok) return;
                }
                const keptPeriods = periodsOf(emp).filter(p => !conflicts.some(c => c.id === p.id) && p.id !== editingId);

                // موظف بحالة قديمة بلا فترات: إضافة أول فترة له تُسقِط الرجوع الضمني إلى emp.status
                // (getActivePeriod يتوقف عن استخدامه بمجرد وجود أي فترة) — فتُرحَّل الحالة القديمة
                // صراحةً كفترة تغطي كل ما قبل الفترة الجديدة، فلا يُفقَد شيء صمتاً.
                const legacySeed = (periodsOf(emp).length === 0 && emp.status && emp.status !== 'نشط' && emp.status !== periodType)
                    ? [{ id: 'per_legacy_' + Date.now(), type: emp.status, from: '1900-01-01', to: localDateStr(new Date(from).getTime() - 86400000), note: 'ترحيل تلقائي من الحالة القديمة' }]
                    : [];
                // تأكيد المباشرة يسقط إن تغيّرت نهاية الفترة: النهاية الجديدة تُسأل عنها من جديد
                const newPeriod = {
                    id: editingId || ('per_' + Date.now()),
                    type: periodType, from, to,
                    note: quickPeriod.note || '',
                    ...((editingId && quickPeriod.confirmedReturn && (quickPeriod.originalTo || '') === (to || '')) ? { confirmedReturn: true } : {})
                };
                const updatedPeriods = [...legacySeed, ...keptPeriods, newPeriod];

                // التعديلات اليومية تسبق الفترات في getEmployeeDailyStatus، فيوم مُثبَّت يدوياً
                // داخل الفترة يبقى ظاهراً بحالته القديمة ويبدو أن الفترة «لم تُطبَّق». نسأل صراحةً
                // بدل أن نترك المستخدم يظن أن حفظه فشل — وهذا ما حدث فعلاً مع إجازة أماني.
                const rangeEnd = to || '9999-12-31';
                const daysInside = Object.keys(dailyStatusOverrides || {}).filter(d =>
                    d >= from && d <= rangeEnd && dailyStatusOverrides[d] && dailyStatusOverrides[d][emp.id]
                );
                let clearedOverrides = null;
                if (daysInside.length > 0) {
                    const sample = daysInside.slice(0, 3).map(d => d + ' («' + dailyStatusOverrides[d][emp.id] + '»)').join('، ');
                    const replace = confirm(
                        'ℹ️ داخل هذه الفترة يوجد ' + daysInside.length + ' يوماً مثبَّتاً يدوياً من شاشة الموقف اليومي:' + String.fromCharCode(10) +
                        sample + (daysInside.length > 3 ? ' وغيرها' : '') + String.fromCharCode(10,10) +
                        'الأيام المثبَّتة يدوياً تسبق الفترة، فتبقى على حالها ولن تظهر الفترة فيها.' + String.fromCharCode(10,10) +
                        'موافق = تُحذف تلك الأيام وتحكم الفترة كل أيامها.' + String.fromCharCode(10) +
                        'إلغاء = تُحفظ الفترة وتبقى تلك الأيام كما ثُبِّتت.'
                    );
                    if (replace) {
                        clearedOverrides = { ...dailyStatusOverrides };
                        daysInside.forEach(d => {
                            const day = { ...clearedOverrides[d] };
                            delete day[emp.id];
                            if (Object.keys(day).length === 0) delete clearedOverrides[d];
                            else clearedOverrides[d] = day;
                        });
                        setDailyStatusOverrides(clearedOverrides);
                        safeStorage.setItem('dailyStatusOverrides', JSON.stringify(clearedOverrides));
                    }
                }

                // الفترات المستبدَلة والأيام الممسوحة تُسجَّل محذوفات
                updateTombstones({
                    addPeriods: conflicts.map(p => periodIdentityOf(p)),
                    addDays: clearedOverrides ? daysInside.map(d => tombstoneKeyOfDay(d, emp.jobNumber)) : [],
                    // الفترة المحفوظة الآن حيّة: لا تبقى لهويتها تذكرة (تُزال بعد الإضافة فتغلب إن تطابقت الهويتان)
                    removePeriods: [periodIdentityOf(newPeriod)]
                });
                // الحالة تتبع الفترة السارية اليوم لا الفترة المحفوظة: فترة تبدأ الشهر القادم
                // كانت تجعل المنتسب «في دورة» من الآن في العدّادات وشارة الجدول
                const activeToday = getActivePeriod({ ...emp, statusPeriods: updatedPeriods }, localDateStr());
                const updated = staff.map(s => s.id === emp.id ? { ...s, statusPeriods: updatedPeriods, status: (activeToday && !activeToday.legacy) ? activeToday.type : 'نشط' } : s);
                setStaff(updated);
                safeStorage.setItem('staffData', JSON.stringify(updated));
                pushDataToCloud(buildCloudBundle({
                    staffData: updated,
                    ...(clearedOverrides ? { dailyStatusOverrides: clearedOverrides } : {})
                }));
                logAuditEvent((conflicts.length > 0 ? 'replace_period:' : 'add_period:') + periodType + ':' + (emp.jobNumber || emp.id), currentUserName);
                setQuickPeriod(null);
            };

            const preparePreview = () => {
                let displayData = [];
                
                if (view === 'shift' || view === 'maaShift') {
                    let counter = 1;
                    let rowIndex = 4;
                    
                    LOCATION_ORDER.forEach(location => {
                        const locationStaff = current.filter(s => s.location === location);
                        if (locationStaff.length > 0) {
                            // حساب نوع المناوبة
                            const shiftType = location.includes('نهر بن عمر') ? 'ثلاثية' : 'ثنائية';
                            
                            displayData.push({ 
                                type: 'separator', 
                                content: `━━━ ${location} (${shiftType}) ━━━`,
                                rowIndex: rowIndex++
                            });
                            
                            const startRow = rowIndex;
                            locationStaff.forEach((s, idx) => {
                                const rowData = {
                                    type: 'data',
                                    isFirst: idx === 0,
                                    location: location,
                                    locationSize: locationStaff.length,
                                    startRow: startRow,
                                    endRow: startRow + locationStaff.length - 1,
                                    rowIndex: rowIndex++,
                                    'ت': counter++,
                                    'الاسم الكامل': getThreeName(s.name),
                                    'الرقم الوظيفي': s.jobNumber,
                                    'العنوان الوظيفي': s.jobTitle,
                                };
                                
                                // إضافة الأعمدة حسب النوع
                                if (view === 'shift') {
                                    rowData['الموقع'] = s.location;
                                    rowData['نوع المناوبة'] = shiftType;
                                    rowData['مبررات التشغيل'] = idx === 0 ? (LOCATION_REASONS[location] || '') : '';
                                } else if (view === 'maaShift') {
                                    rowData['نوع المناوبة'] = shiftType;
                                    rowData['ملاحظات'] = '';
                                }
                                
                                displayData.push(rowData);
                            });
                        }
                    });
                } else if (view === 'maa') {
                    // current مُستبعد أصلاً بحسب isExcludedFromWater — لا حاجة لتكرار الاستبعاد هنا
                    const morning = current.filter(s => s.workType === 'صباحي');
                    const shift = current.filter(s => s.workType === 'مناوب');

                    // فصل مناوبي الثلاثية (نهر بن عمر) عن الثنائي
                    const shiftThreeDay = shift.filter(s => s.unit === 'تبريد نهر بن عمر');
                    const shiftTwoDay = shift.filter(s => s.unit !== 'تبريد نهر بن عمر');
                    
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    // ورقة 1: الصباحي (تسلسل من 1)
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    if (morning.length > 0) {
                        displayData.push({ type: 'separator', content: '━━━ صباحي ━━━' });
                        let counter = 1;
                        morning.forEach(s => {
                            displayData.push({
                                type: 'data',
                                'ت': counter++,
                                'الرقم الوظيفي': s.jobNumber,
                                'الاسم الكامل': getThreeName(s.name),
                                'العنوان الوظيفي': s.jobTitle,
                                'ملاحظات': ''
                            });
                        });
                        displayData.push({ type: 'signature_footer' });
                    }
                    
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    // ورقة 2: مناوبي الثلاثية - نهر بن عمر (تسلسل جديد من 1)
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    if (shiftThreeDay.length > 0) {
                        // فاصل الصفحة فقط إن كان قبله محتوى فعلي — وإلا (صباحي فارغ مثلاً)
                        // يصبح أول صف في الجدول فيُنتج صفحة أولى فارغة عند الطباعة (ملاحظة Codex)
                        if (displayData.length > 0) displayData.push({ type: 'page_break' });
                        displayData.push({ type: 'separator', content: '━━━ مناوبي الثلاثية - نهر بن عمر ━━━' });
                        let counter = 1; // تسلسل جديد
                        shiftThreeDay.forEach(s => {
                            displayData.push({
                                type: 'data',
                                'ت': counter++,
                                'الرقم الوظيفي': s.jobNumber,
                                'الاسم الكامل': getThreeName(s.name),
                                'العنوان الوظيفي': s.jobTitle,
                                'نوع المناوبة': 'ثلاثية',
                                'ملاحظات': ''
                            });
                        });
                        displayData.push({ type: 'signature_footer' });
                    }
                    
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    // ورقة 3: مناوبي الثنائي - بقية الوحدات (تسلسل جديد من 1)
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    if (shiftTwoDay.length > 0) {
                        if (displayData.length > 0) displayData.push({ type: 'page_break' });
                        displayData.push({ type: 'separator', content: '━━━ مناوبي الثنائي - باب الزبير، المركز الثقافي، المكينة ━━━' });
                        let counter = 1; // تسلسل جديد
                        shiftTwoDay.forEach(s => {
                            displayData.push({
                                type: 'data',
                                'ت': counter++,
                                'الرقم الوظيفي': s.jobNumber,
                                'الاسم الكامل': getThreeName(s.name),
                                'العنوان الوظيفي': s.jobTitle,
                                'نوع المناوبة': 'ثنائية',
                                'ملاحظات': ''
                            });
                        });
                        displayData.push({ type: 'signature_footer' });
                    }
                } else if (view === 'units') {
                    // جدول الوحدات - مجموع حسب الوحدة
                    let counter = 1;
                    
                    // ترتيب الوحدات
                    const unitOrder = [
                        'مقر الشعبة',
                        'تبريد باب الزبير',
                        'ورشة التبريد',
                        'تبريد المكينة',
                        'تبريد نهر بن عمر',
                        'تبريد المركز الثقافي'
                    ];
                    
                    unitOrder.forEach(unit => {
                        const unitStaff = current.filter(s => s.unit === unit);
                        
                        if (unitStaff.length > 0) {
                            // إضافة فاصل للوحدة
                            displayData.push({ 
                                type: 'separator', 
                                content: `━━━ ${unit} ━━━`
                            });
                            
                            // إضافة الموظفين
                            unitStaff.forEach(s => {
                                displayData.push({
                                    type: 'data',
                                    'ت': counter++,
                                    'الاسم الكامل': s.name,
                                    'الرقم الوظيفي': s.jobNumber || '',
                                    'العنوان الوظيفي': s.jobTitle || '',
                                    'القسم': s.department || '',
                                    'الشعبة': s.section || '',
                                    'الموقع': s.location || '',
                                    'الوحدة': s.unit || '',
                                    'طبيعة العمل': s.workType || '',
                                    'الوجبة': s.squad || '',
                                    'هاتف العمل': s.workPhone || '',
                                    'التولد': s.birthDate || '',
                                    'رقم العمل': s.workNumber || '',
                                    'تاريخ التعيين': s.hireDate || '',
                                    'التحصيل الدراسي': s.education || '',
                                    'سنة التخرج': s.graduationYear || '',
                                    'الاختصاص': s.specialization || '',
                                    'الجنس': s.gender || '',
                                    'التوطين': s.bank || '',
                                    'النقال': s.mobile || '',
                                    'الحالة': s.status || '',
                                    'أيام الإجازة': s.vacationDays || '',
                                    'قياس البدلة': s.uniformSize || '',
                                    'قياس حذاء السلامة': s.shoeSafetySize || '',
                                    'تاريخ آخر تجهيز': s.lastSafetyDelivery || '',
                                    'البريد الإلكتروني': s.email || '',
                                    'هاتف احد ذوي الموظف': s.relativePhone || '',
                                    'عنوان السكن': s.address || ''
                                });
                            });
                        }
                    });
                } else {
                    displayData = current.map((s, i) => {
                        const base = { type: 'data', 'ت': i + 1 };
                        const threeName = getThreeName(s.name);
                        
                        if (view === 'morning') {
                            return {...base, 'الرقم الوظيفي': s.jobNumber, 'الاسم الكامل': threeName, 'العنوان الوظيفي': s.jobTitle, 'ملاحظات': ''};
                        } else if (view === 'safety') {
                            // جدول تجهيزات السلامة - 6 أعمدة فقط
                            return {...base, 'الرقم الوظيفي': s.jobNumber, 'الأسم الثلاثي': threeName, 'العنوان الوظيفي': s.jobTitle, 'قياس البدله': s.uniformSize || '-', 'قياس حذاء السلامة': s.shoeSafetySize || '-'};
                        } else if (view === 'evaluation') {
                            return {...base, 'الرقم الوظيفي': s.jobNumber, 'الاسم الكامل': threeName, 'العنوان الوظيفي': s.jobTitle, 'التقييم': ''};
                        } else if (view === 'maaMorning') {
                            return {...base, 'الرقم الوظيفي': s.jobNumber, 'الاسم الكامل': threeName, 'العنوان الوظيفي': s.jobTitle, 'ملاحظات': ''};

                        } else if (view === 'contract') {
                            return {...base, 'الاسم الكامل': threeName, 'الرقم الوظيفي': s.jobNumber, 'العنوان الوظيفي': s.jobTitle};
                        } else {
                            return {...base, 'الاسم الكامل': s.name, 'الرقم الوظيفي': s.jobNumber, 'العنوان الوظيفي': s.jobTitle, 'القسم': s.department, 'الشعبة': s.section, 'الموقع': s.location, 'الوحدة': s.unit || '', 'طبيعة العمل': s.workType, 'الوجبة': s.squad || '', 'هاتف العمل': s.workPhone, 'التولد': s.birthDate, 'رقم العمل': s.workNumber, 'تاريخ التعيين': s.hireDate, 'التحصيل الدراسي': s.education, 'سنة التخرج': s.graduationYear, 'الاختصاص': s.specialization, 'الجنس': s.gender, 'التوطين': s.bank, 'النقال': s.mobile, 'الحالة': s.status, 'أيام الإجازة': s.vacationDays, 'قياس البدلة': s.uniformSize || '', 'قياس حذاء السلامة': s.shoeSafetySize || '', 'تاريخ آخر تجهيز': s.lastSafetyDelivery || '', 'البريد الإلكتروني': s.email || '', 'هاتف احد ذوي الموظف': s.relativePhone || '', 'عنوان السكن': s.address || ''};
                        }
                    });
                }
                
                if (view === 'all' || view === 'units' || view === 'dailyReport') {
                    setVisiblePreviewColumns([
                        'الرقم الوظيفي', 'العنوان الوظيفي', 'القسم', 'الشعبة', 'الموقع', 
                        'الوحدة', 'طبيعة العمل', 'هاتف العمل', 'التولد', 'رقم العمل', 
                        'تاريخ التعيين', 'التحصيل الدراسي', 'سنة التخرج', 'الاختصاص', 
                        'الجنس', 'التوطين', 'النقال', 'الحالة', 'أيام الإجازة', 
                        'قياس البدلة', 'قياس حذاء السلامة', 'تاريخ آخر تجهيز', 'البريد الإلكتروني', 'هاتف احد ذوي الموظف', 'عنوان السكن'
                    ]);
                }
                
                setPreviewData(displayData);
                setShowPreview(true);
            };
            
            const updateCell = (idx, key, val) => {
                const newData = [...previewData];
                newData[idx][key] = val;
                setPreviewData(newData);
            };
            
                        // مشاركة تقرير الموقف أو نتائج الاستعلام عبر تطبيق الواتساب مباشرة
            const shareViaWhatsApp = () => {
                if (!previewData || previewData.length === 0) {
                    alert('⚠️ لا توجد بيانات للمشاركة حالياً.');
                    return;
                }

                let text = '';

                // حالة بطاقة البحث والاستعلام (تخصيص الأعمدة المؤشرة فقط بدون حشو)
                if (view === 'dashboard' || isCustomizable) {
                    const activeCols = visiblePreviewColumns || [];
                    const count = previewData.filter(d => d.type === 'data').length;
                    
                    text += `📋 *${previewTitle || 'بيانات المنتسبين'}*\n`;
                    text += `🏢 شعبة تبريد المركز ومحطة عزل نهر بن عمر\n`;
                    text += `━━━━━━━━━━━━━━━━━━━━\n`;

                    let itemIndex = 0;
                    previewData.forEach(row => {
                        if (row.type === 'data') {
                            itemIndex++;
                            const name = row['الاسم الكامل'] || row['الأسم الكامل'] || row['الاسم'] || row['الأسم الثلاثي'] || '';
                            text += count > 1 ? `\n*${itemIndex}. ${name}*\n` : `👤 *${name}*\n`;
                            
                            // إضافة الحقول المؤشرة فقط
                            activeCols.forEach(col => {
                                if (row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== '') {
                                    text += `▫️ ${col}: *${row[col]}*\n`;
                                }
                            });
                        }
                    });

                    text += `━━━━━━━━━━━━━━━━━━━━\n`;
                    text += `📊 إجمالي العدد: ${count} منتسب\n`;
                } else {
                    // حالة الموقف اليومي الموحد للشعبة
                    text += `📋 *${previewTitle || 'تقرير الموقف الموحد'}*\n`;
                    text += `🏢 شركة نفط البصرة - شعبة تبريد المركز ومحطة عزل نهر بن عمر\n`;
                    text += `📅 التاريخ: ${dailyReportDate || new Date().toISOString().split('T')[0]}\n`;
                    text += `━━━━━━━━━━━━━━━━━━━━\n`;
                    
                    let count = 0;
                    previewData.forEach(row => {
                        if (row.type === 'separator') {
                            text += `\n📌 *${row.content.replace(/━/g, '').trim()}*\n`;
                        } else if (row.type === 'data') {
                            count++;
                            const name = row['الاسم الكامل'] || row['الأسم الكامل'] || row['الاسم'] || '';
                            const jobNum = row['الرقم الوظيفي'] || row['الرقم'] || '';
                            const status = row['الموقف اليومي'] || row['طبيعة العمل'] || row['الوظيفة'] || row['العنوان الوظيفي'] || '';
                            const notes = row['الملاحظات'] || '';
                            text += `${count}. *${name}* (${jobNum}) : ${status} ${notes ? `[${notes}]` : ''}\n`;
                        }
                    });
                    text += `━━━━━━━━━━━━━━━━━━━━\n`;
                    text += `📊 إجمالي العدد: ${count} منتسب\n`;
                    text += `✍️ منظم الموقف: ${dataEntryOperator || 'إدارة الشعبة'}\n`;
                }

                const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
                    navigator.share({ title: previewTitle || 'بيانات الموظف', text: text }).catch(() => window.open(url, '_blank'));
                } else {
                    window.open(url, '_blank');
                }
            };

            // اتجاه ورقة طباعة المعاينة، يتذكّره الجهاز. القالب يفرض A4 عمودية في @page فتختفي قائمة
            // الاتجاه من نافذة طباعة المتصفح؛ الأفقي يُحقَن قبل الطباعة ويُزال بعدها كطباعة مصفوفة الأيام.
            const [printOrientation, setPrintOrientation] = useState(() =>
                safeStorage.getItem('previewPrintOrientation') === 'landscape' ? 'landscape' : 'portrait');
            React.useEffect(() => {
                safeStorage.setItem('previewPrintOrientation', printOrientation);
            }, [printOrientation]);

            const printPreview = () => {
                const old = document.getElementById('previewOrientationStyle');
                if (old) old.remove();
                if (printOrientation !== 'landscape') {
                    window.print();
                    return;
                }
                const styleEl = document.createElement('style');
                styleEl.id = 'previewOrientationStyle';
                styleEl.textContent = '@media print { @page { size: A4 landscape; margin: 6mm 5mm 6mm 5mm; } }';
                document.head.appendChild(styleEl);
                // يُزال عند afterprint لا بمؤقّت: المؤقّت يسابق الطباعة في متصفحات الهاتف التي لا تحجب
                // عند window.print. وإن لم يُطلَق الحدث، تُزيله الطباعة التالية في أول هذه الدالة.
                window.addEventListener('afterprint', () => {
                    const el = document.getElementById('previewOrientationStyle');
                    if (el) el.remove();
                }, { once: true });
                window.print();
            };
            
            const exportExcel = async () => {
                if (!(await ensureLibs('xlsx'))) return;
                const names = {all: 'الملاك', shift: 'المناوبين', morning: 'الصباحي', contract: 'العقود', maaMorning: 'الماء-صباحي', maaShift: 'الماء-مناوبين', evaluation: 'التقييم', safety: 'تجهيزات-السلامة', units: 'الوحدات', dailyReport: 'الموقف-اليومي'};
                const fileName = view && names[view] ? names[view] : 'نتائج-البحث';
                const wb = XLSX.utils.book_new();
                const exportData = previewData.filter(d => d.type === 'data').map(({type, isFirst, location, locationSize, startRow, endRow, rowIndex, ...rest}) => {
                    const isCustom = ['all', 'units', 'dashboard'].includes(view) && !previewTitle;
                    if (!isCustom) return rest;

                    const filtered = {};
                    Object.keys(rest).forEach(k => {
                        if (['ت', 'الاسم الكامل', 'الأسم الكامل', 'الأسم الثلاثي', 'الاسم'].includes(k) || visiblePreviewColumns.includes(k)) {
                            filtered[k] = rest[k];
                        }
                    });
                    return filtered;
                });
                const ws = XLSX.utils.json_to_sheet(exportData);
                
                if (view === 'dailyReport') ws['!cols'] = [{wch: 5.8}, {wch: 30.8}, {wch: 14.7}, {wch: 22.8}, {wch: 14.7}, {wch: 10.8}, {wch: 25.8}, {wch: 20.8}];
                else if (view === 'shift') ws['!cols'] = [{wch: 5.5}, {wch: 32}, {wch: 14.7}, {wch: 23}, {wch: 20}, {wch: 16.6}, {wch: 13.8}];
                else if (view === 'safety') ws['!cols'] = [{wch: 5.8}, {wch: 14}, {wch: 30}, {wch: 22}, {wch: 14}, {wch: 18}];
                else if (view === 'units') ws['!cols'] = [{wch: 5.8}, {wch: 35}, {wch: 14}, {wch: 22}, {wch: 22}, {wch: 12}];
                else if (view === 'morning' || view === 'maa' || view === 'evaluation') ws['!cols'] = [{wch: 5.8}, {wch: 12.8}, {wch: 30.8}, {wch: 20.8}, {wch: 15.8}];
                else if (view === 'contract') ws['!cols'] = [{wch: 5.8}, {wch: 30.8}, {wch: 12.8}, {wch: 20.8}];
                else ws['!cols'] = [{wch: 5.8}, {wch: 30.8}, {wch: 12.8}, {wch: 20.8}, {wch: 25.8}, {wch: 40.8}, {wch: 20.8}, {wch: 12.8}, {wch: 12.8}, {wch: 12.8}, {wch: 15.8}, {wch: 15.8}, {wch: 20.8}, {wch: 12.8}, {wch: 20.8}, {wch: 10.8}, {wch: 25.8}, {wch: 15.8}, {wch: 15.8}, {wch: 12.8}, {wch: 25.8}];
                
                XLSX.utils.book_append_sheet(wb, ws, fileName);
                XLSX.writeFile(wb, `${fileName}.xlsx`);
                const today = new Date().toISOString();
                safeStorage.setItem('lastBackupDate', today);
                setLastBackupDate(today);
                setShowPreview(false);
            };

            // دالة تصدير خاصة لتبويب الوحدات
            const exportUnits = async () => {
                if (!(await ensureLibs('xlsx'))) return;
                try {
                    const wb = XLSX.utils.book_new();
                    const exportData = [];
                    
                    let counter = 1;
                    
                    if (selectedUnit) {
                        // تصدير وحدة واحدة محددة
                        const unitStaff = current.filter(s => s.unit === selectedUnit.name);
                        const sortedStaff = sortByJobTitleHierarchy(unitStaff, selectedUnit.name);
                        
                        sortedStaff.forEach(s => {
                            exportData.push({
                                'ت': counter++,
                                'الاسم الكامل': s.name,
                                'الرقم الوظيفي': s.jobNumber,
                                'العنوان الوظيفي': s.jobTitle
                            });
                        });
                    } else {
                        // تصدير كل الوحدات
                        const unitOrder = [
                            'مقر الشعبة',
                            'تبريد باب الزبير',
                            'ورشة التبريد',
                            'تبريد المكينة',
                            'تبريد نهر بن عمر',
                            'تبريد المركز الثقافي'
                        ];
                        
                        unitOrder.forEach(unit => {
                            const unitStaff = current.filter(s => s.unit === unit);
                            
                            if (unitStaff.length > 0) {
                                const sortedStaff = sortByJobTitleHierarchy(unitStaff, unit);
                                
                                sortedStaff.forEach(s => {
                                    exportData.push({
                                        'ت': counter++,
                                        'الاسم الكامل': s.name,
                                        'الرقم الوظيفي': s.jobNumber,
                                        'العنوان الوظيفي': s.jobTitle
                                    });
                                });
                            }
                        });
                    }
                    
                    if (exportData.length === 0) {
                        alert('❌ لا توجد بيانات للتصدير!');
                        return;
                    }
                    
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    ws['!cols'] = [{wch: 5.8}, {wch: 35}, {wch: 14}, {wch: 22}];
                    
                    const sheetName = selectedUnit ? selectedUnit.name : 'الوحدات';
                    XLSX.utils.book_append_sheet(wb, ws, sheetName);
                    
                    const fileName = selectedUnit ? `${selectedUnit.name}.xlsx` : 'الوحدات.xlsx';
                    XLSX.writeFile(wb, fileName);
                    
                    alert('✅ تم التصدير بنجاح!');
                    setShowPreview(false);
                } catch (error) {
                    alert('❌ خطأ في التصدير: ' + error.message);
                    console.error('Export error:', error);
                }
            };

            const exportWord = async () => {
                if (!(await ensureLibs('docx', 'fileSaver'))) return;
                try {
                    const names = {all: 'الملاك', shift: 'المناوبين', morning: 'الصباحي', contract: 'العقود', maaMorning: 'الماء-صباحي', maaShift: 'الماء-مناوبين', evaluation: 'التقييم'};
                const fileName = view && names[view] ? names[view] : 'نتائج-البحث';
                    const { Document, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, Packer, PageBreak } = window.docx;
                    
                    const dataRows = previewData.filter(d => d.type === 'data');
                    if (dataRows.length === 0) return;
                    
                    const cols = Object.keys(dataRows[0]).filter(k => !['type', 'isFirst', 'location', 'locationSize', 'startRow', 'endRow', 'rowIndex'].includes(k));
                    const colsRTL = [...cols].reverse();
                    
                    // تقسيم البيانات حسب page_break
                    const sections = [];
                    let currentSection = [];
                    
                    previewData.forEach(row => {
                        if (row.type === 'page_break') {
                            if (currentSection.length > 0) {
                                sections.push(currentSection);
                                currentSection = [];
                            }
                        } else {
                            currentSection.push(row);
                        }
                    });
                    
                    // إضافة آخر قسم
                    if (currentSection.length > 0) {
                        sections.push(currentSection);
                    }
                    
                    // إنشاء محتوى الوثيقة
                    const documentChildren = [
                        new Paragraph({ text: "جمهورية العراق", alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, spacing: { after: 100 } }),
                        new Paragraph({ text: "وزارة النفط", alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
                        new Paragraph({ text: "شركة نفط البصرة (شركة عامة)", alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
                        new Paragraph({ text: "شعبة تبريد المركز ومحطة عزل نهر بن عمر", alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                        new Paragraph({ text: `جدول ${fileName}`, alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_2, spacing: { after: 300 } })
                    ];
                    
                    // إضافة جدول لكل قسم مع فواصل صفحات
                    sections.forEach((sectionData, sectionIndex) => {
                        // Header row
                        const tableRows = [
                            new TableRow({
                                children: colsRTL.map(col => new TableCell({
                                    children: [new Paragraph({ text: col, alignment: AlignmentType.CENTER })],
                                    shading: { fill: "4472C4" },
                                    width: { size: 100 / cols.length, type: WidthType.PERCENTAGE }
                                }))
                            })
                        ];
                        
                        // Data rows
                        sectionData.forEach(row => {
                            if (row.type === 'separator') {
                                tableRows.push(new TableRow({
                                    children: [new TableCell({
                                        children: [new Paragraph({ text: row.content, alignment: AlignmentType.CENTER })],
                                        columnSpan: cols.length,
                                        shading: { fill: "FF6600" }
                                    })]
                                }));
                            } else if (row.type === 'data') {
                                const rowDataRTL = colsRTL.map(col => String(row[col] || ''));
                                tableRows.push(new TableRow({
                                    children: rowDataRTL.map(val => new TableCell({
                                        children: [new Paragraph({ text: val, alignment: AlignmentType.CENTER })]
                                    }))
                                }));
                            }
                        });
                        
                        // إضافة الجدول
                        documentChildren.push(new Table({ 
                            rows: tableRows, 
                            width: { size: 100, type: WidthType.PERCENTAGE } 
                        }));
                        
                        // إضافة page break بين الأقسام (ليس بعد القسم الأخير)
                        if (sectionIndex < sections.length - 1) {
                            documentChildren.push(new Paragraph({ 
                                children: [new PageBreak()],
                                spacing: { before: 200 }
                            }));
                        }
                    });
                    
                    const doc = new Document({
                        sections: [{
                            properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
                            children: documentChildren
                        }]
                    });
                    
                    const blob = await Packer.toBlob(doc);
                    saveAs(blob, `${fileName}.docx`);
                    setShowPreview(false);
                } catch (error) {
                    alert('خطأ: ' + error.message);
                }
            };

            const exportProfessional = async () => {
                if (!(await ensureLibs('exceljs'))) return;
                setExporting(true);
                try {
                    const ExcelJS = window.ExcelJS;
                    const workbook = new ExcelJS.Workbook();
                    const names = {all: 'الملاك', shift: 'المناوبين', morning: 'الصباحي', contract: 'العقود', maaMorning: 'الماء-صباحي', maaShift: 'الماء-مناوبين', evaluation: 'التقييم', units: 'الوحدات'};
                const fileName = view && names[view] ? names[view] : 'نتائج-البحث';
                    const worksheet = workbook.addWorksheet(names[view]);
                    
                    const dataRows = previewData.filter(d => d.type === 'data');
                    if (dataRows.length > 0) {
                        const columns = Object.keys(dataRows[0]).filter(k => !['type', 'isFirst', 'location', 'locationSize', 'startRow', 'endRow', 'rowIndex'].includes(k));
                        
                        if (view === 'shift') {
                            worksheet.columns = [{key: 'ت', width: 6}, {key: 'الاسم الكامل', width: 32}, {key: 'الرقم الوظيفي', width: 15}, {key: 'العنوان الوظيفي', width: 23}, {key: 'الموقع', width: 20}, {key: 'نوع المناوبة', width: 17}, {key: 'مبررات التشغيل', width: 14}];
                        } else if (view === 'units') {
                            worksheet.columns = [{key: 'ت', width: 6}, {key: 'الاسم الكامل', width: 35}, {key: 'الرقم الوظيفي', width: 14}, {key: 'العنوان الوظيفي', width: 22}, {key: 'الموقع', width: 22}, {key: 'الحالة', width: 12}];
                        } else if (view === 'morning' || view === 'maaMorning' || view === 'maaShift' || view === 'evaluation') {
                            worksheet.columns = [{key: 'ت', width: 6}, {key: 'الرقم الوظيفي', width: 13}, {key: 'الاسم الكامل', width: 31}, {key: 'العنوان الوظيفي', width: 21}, {key: columns[4], width: 16}];
                        } else if (view === 'contract') {
                            worksheet.columns = [{key: 'ت', width: 6}, {key: 'الاسم الكامل', width: 31}, {key: 'الرقم الوظيفي', width: 13}, {key: 'العنوان الوظيفي', width: 21}];
                        } else {
                            worksheet.columns = columns.map((col, i) => ({ key: col, width: i === 0 ? 6 : i === 1 ? 31 : i === 2 ? 13 : 21 }));
                        }
                        
                        const titleRow = worksheet.addRow([`جدول ${fileName} - شعبة تبريد المركز ومحطة عزل نهر بن عمر`]);
                        worksheet.mergeCells(1, 1, 1, columns.length);
                        titleRow.height = 25;
                        titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6600' } };
                        titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
                        titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
                        
                        const headerRow = worksheet.addRow(columns);
                        headerRow.height = 20;
                        headerRow.eachCell((cell) => {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
                            cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
                            cell.alignment = { horizontal: 'center', vertical: 'middle' };
                            cell.border = { top: {style: 'thin'}, left: {style: 'thin'}, bottom: {style: 'thin'}, right: {style: 'thin'} };
                        });
                        
                        let isEven = false;
                        const locationGroups = {};
                        
                        // تجميع الصفوف حسب الموقع للمناوبين
                        if (view === 'shift') {
                            let currentLoc = null;
                            previewData.forEach((row, idx) => {
                                if (row.type === 'separator') {
                                    currentLoc = null;
                                } else if (row.type === 'data') {
                                    if (!currentLoc || row.location !== currentLoc) {
                                        currentLoc = row.location;
                                        locationGroups[currentLoc] = { start: null, end: null, reason: row['مبررات التشغيل'] };
                                    }
                                }
                            });
                        }
                        
                        let rowNumber = 3; // بعد Title و Header
                        let currentLocation = null;
                        let locationStartRow = null;
                        
                        previewData.forEach((row) => {
                            if (row.type === 'separator') {
                                rowNumber++;
                                const separatorRow = worksheet.addRow([row.content]);
                                worksheet.mergeCells(separatorRow.number, 1, separatorRow.number, columns.length);
                                separatorRow.height = 20;
                                separatorRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6600' } };
                                separatorRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
                                separatorRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
                                isEven = false;
                                currentLocation = null;
                            } else if (row.type === 'data') {
                                rowNumber++;
                                
                                // تسجيل بداية الموقع
                                if (view === 'shift' && row.isFirst) {
                                    locationStartRow = rowNumber;
                                    currentLocation = row.location;
                                }
                                
                                const dataRow = worksheet.addRow(columns.map(col => row[col]));
                                dataRow.height = 18;
                                
                                dataRow.eachCell((cell, colNumber) => {
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF2F2F2' : 'FFFFFFFF' } };
                                    cell.font = { size: 11 };
                                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                                    cell.border = { top: {style: 'thin', color: {argb: 'FFD3D3D3'}}, left: {style: 'thin', color: {argb: 'FFD3D3D3'}}, bottom: {style: 'thin', color: {argb: 'FFD3D3D3'}}, right: {style: 'thin', color: {argb: 'FFD3D3D3'}} };
                                });
                                

                                
                                isEven = !isEven;
                            }
                        });
                    }
                    
                    const buffer = await workbook.xlsx.writeBuffer();
                    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${fileName}_منسق.xlsx`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    const today = new Date().toISOString();
                    safeStorage.setItem('lastBackupDate', today);
                    setLastBackupDate(today);
                    setShowPreview(false);
                } catch (error) {
                    alert('خطأ: ' + error.message);
                } finally {
                    setExporting(false);
                }
            };



                        // إغلاق موحّد بـEsc: مستمع واحد يُسجَّل أثناء ظهور النافذة فقط ويُزال عند إغلاقها
            const useEscapeClose = (active, onClose) => {
                React.useEffect(() => {
                    if (!active) return;
                    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
                    window.addEventListener('keydown', onKey);
                    return () => window.removeEventListener('keydown', onKey);
                }, [active, onClose]);
            };
            useEscapeClose(showSetPinOffer && !!pendingPinOfferUser, () => setShowSetPinOffer(false));
            useEscapeClose(showSyncModal, () => setShowSyncModal(false));
            useEscapeClose(!!selectedEmployeeCard, () => setSelectedEmployeeCard(null));
            useEscapeClose(showLoginModal, () => setShowLoginModal(false));
            useEscapeClose(showUserManagementModal, () => setShowUserManagementModal(false));
            useEscapeClose(showRestoreCenterModal, () => setShowRestoreCenterModal(false));
            useEscapeClose(showPasteModal, () => setShowPasteModal(false));
            useEscapeClose(showHolidaysModal, () => setShowHolidaysModal(false));
            useEscapeClose(!!pendingShiftConfirm, () => setPendingShiftConfirm(null));
            useEscapeClose(!!quickPeriod, () => setQuickPeriod(null));
            useEscapeClose(showUserMenu, () => setShowUserMenu(false));
            useEscapeClose(showPreview, () => setShowPreview(false));
            useEscapeClose(showEditModal && !!editingEmployee, cancelEdit);
            useEscapeClose(showPrintForm, () => setShowPrintForm(false));
            useEscapeClose(!!waterMemoGroup, () => setWaterMemoGroup(null));
            useEscapeClose(showSquadSchedule, () => setShowSquadSchedule(false));


return (
                <div className="min-h-screen bg-gray-50">

                    {/* Splash Screen - نافذة ترحيبية متحركة */}
                    {showWelcome && <WelcomeSplash ctx={{ proceedFromWelcome }} />}

                    <AuthViews.PinScreen ctx={{ showPinScreen, getDevicePinLocks, selectedPinUid, setSelectedPinUid, pinInput, setPinInput, pinError, setPinError, setPinAttempts, isCheckingLogin, handlePinLogin, useAnotherAccount, pendingTakeover, confirmSessionTakeover, cancelSessionTakeover }} />

                    <AuthViews.SetPinOffer ctx={{ showSetPinOffer, pendingPinOfferUser, setShowSetPinOffer, setPendingPinOfferUser, setDevicePinLock, safeStorage }} />

                    {/* رأس الصفحة الكلاسيكي المطور بألوان زاهية وراقية كالسابق */}
                                {/* إشعار طلب الحذف السحابي المعلق لمدير النظام */}
            {pendingDeletionRequest && pendingDeletionRequest.status === 'pending' && <DeletionRequestBanner ctx={{ authorizeWipeApproval, currentUserRole, executeCompleteDatabaseWipe, pendingDeletionRequest, rejectDeletionRequest }} />}
                    <AppHeader ctx={{ AuthViews, clearDevicePinLock, cloudSyncStatus, currentUserIdRef, currentUserName, currentUserRole, fetchAvailableSnapshots, getDevicePinLockFor, handleLogout, handleOpenUserManagement, isDarkTheme, setIsDarkTheme, setShowRestoreCenterModal, setShowSyncModal, setShowUserMenu, showUserMenu, syncStatus }} />
                    
                    {/* ================================================================= */}
                    {/* شريط التنقل: أقسام في الأعلى، وشرائح تصفية داخل القسم            */}
                    {/*                                                                   */}
                    {/* كانت تسعة تبويبات، سبعة منها يرسمها فرع واحد مشترك في هذا الملف   */}
                    {/* (جدول واحد تتبدّل أعمدته وفلاتره بشرط view === 'x'). أي أنها       */}
                    {/* مرشِّحات لا وجهات، وصعودها إلى مستوى الوجهة أفاض الشريط —          */}
                    {/* وoverflow-x مع scrollbar-none كان يُخفي الأواخر بلا أي دليل عليها. */}
                    {/*                                                                   */}
                    {/* الآن: أربعة أقسام = أربع مهام مختلفة فعلاً، والمرشِّحات شرائح       */}
                    {/* داخل قسمها. `view` نفسه لم يتغيّر ولا أيٌّ من شروطه في كل الملف —   */}
                    {/* تغيّر من يضبط قيمته فقط، فلا منطق عرض واحد مسّه هذا التعديل.       */}
                    {/* ================================================================= */}
                    <AppNav ctx={{ observeNavHeight, periodSearchQuery, sectionMemory, setPeriodSearchQuery, setSectionMemory, setUnitsSubView, setView, stats, unitsSubView, view }} />
                    
                    <main className="container mx-auto p-4">
                        {(periodAlerts.endingSoon.length > 0 || periodAlerts.endedUnconfirmed.length > 0) && <PeriodAlerts ctx={{ periodAlerts }} />}
                        {/* حاوية الحركة تلفّ محتوى التبويب وحده — لا تنبيهات الفترات فوقها،
                            فتنبيه «انتهت فترته ولم تُؤكَّد المباشرة» يبقى ثابتاً لا يومض مع كل نقرة */}
                        <div ref={mainContentRef}>
                        {view === 'dashboard' ? (
                            <div className="space-y-5">

                                
            {/* نافذة تفاصيل المزامنة السحابية والمحلية لشعبة تبريد المركز */}
            <AuthViews.SyncModal ctx={{ showSyncModal, setShowSyncModal, cloudSyncStatus, syncStatus, pushDataToServer }} />
    

                                
            
            {/* نافذة معاينة وبطاقة ملف المنتسب الفاخرة قبل الطباعة مع خيارات التخصيص والإخفاء والإظهار التلقائي التنسيق */}
            {/* عبر portal تحت body لا داخل main: قاعدة الطباعة العامة تُخفي main، ولا يلغي
                حفيدٌ display:none على سلفه — فكانت البطاقة تُطبع بيضاء. انظر body.printing-card. */}
            {selectedEmployeeCard && <EmployeeCardModal ctx={{ cardFieldsVisibility, printEmployeeCard, selectedEmployeeCard, setCardFieldsVisibility, setSelectedEmployeeCard, setShowFieldCustomizer, showFieldCustomizer }} />}

            {/* نافذة تسجيل الدخول للنظام بالتعرف التلقائي الذكي على كلمة المرور */}
            {showLoginModal && <LoginModal ctx={{ AuthViews, cancelSessionTakeover, confirmSessionTakeover, handleLogin, isCheckingLogin, loginEmail, loginError, loginInputPin, loginPassword, pendingTakeover, safeStorage, setLoginEmail, setLoginInputPin, setLoginPassword, setShowLoginModal, setShowLoginPassword, showLoginPassword }} />}

            {/* نافذة إدارة المستخدمين والصلاحيات الشاملة (User & Role Management Modal) */}
            {showUserManagementModal && <UserManagementModal ctx={{ AuthViews, activeSessions, currentUserRole, editingUserId, getLocalOfflineAdminPin, handleCancelUserEdit, handleDeleteUser, handleEditUserClick, handleForceEvictSession, handleSaveUser, handleToggleUserActive, isSelfUser, revealedPinUsers, sessionKeyFor, setRevealedPinUsers, setShowUserManagementModal, setShowUserPins, setUserFormLocalPart, setUserFormManualUid, setUserFormName, setUserFormPassword, setUserFormPerms, setUserFormPin, setUserFormPriority, setUserFormRole, setUserFormUid, showUserPins, systemUsers, updateLocalOfflineAdminPin, userFormLocalPart, userFormManualUid, userFormName, userFormPassword, userFormPerms, userFormPin, userFormPriority, userFormRole, userFormUid }} />}

            {/* نافذة مركز الاستعادة والأرشيف الزمني السحابي (Time-Machine Restore Center Modal) */}
            {showRestoreCenterModal && <RestoreCenterModal ctx={{ availableSnapshots, currentUserRole, fetchAvailableSnapshots, handleDownloadSnapshot, handleRestoreSnapshot, isLoadingSnapshots, selectedSnapshotPreview, setSelectedSnapshotPreview, setShowRestoreCenterModal, snapshotsError }} />}

                                <DashboardScreen ctx={{ AuthViews, clearAllData, clearUnifiedSearch, exportBackupJSON, fileInputRef, handleOpenUserManagement, loadFile, openEditModal, performUnifiedSearch, setEditingEmployee, setPreviewData, setSelectedEmployeeCard, setShowEditModal, setShowPasteModal, setShowPreview, setShowPrintForm, setShowUnitDropdown, setUnifiedFilters, setUnifiedQuery, setUnifiedResults, setVisiblePreviewColumns, showBackupWarning, showUnitDropdown, staff, stats, unifiedFilters, unifiedQuery, unifiedResults }} />

                            </div>

) : view === 'units' ? (
                            <UnitsScreen ctx={{ DAY_MATRIX_LEGEND, anchorDate, changeReportDateByDays, dailyReportDate, dailyStats, dailyStatusOverrides, dataEntryOperator, expandedEmpPeriod, exportDailyReportExcel, exportPeriodReportExcel, getDayMatrixCell, getEmployeeDailyStatus, getEmployeeDefaultNaturalStatus, lockedSections, officialHolidays, openEditModal, overtimeIds, overtimeListMonth, periodEndDate, periodReportData, periodReportRows, periodSearchQuery, periodShowMatrix, periodStartDate, periodUnitFilter, periodWorkTypeFilter, printDayMatrix, safeStorage, selectedDailyUnitTab, selectedUnit, setDailyReportDate, setDataEntryOperator, setEmployeeDailyStatusOverride, setExpandedEmpPeriod, setOvertimeIds, setOvertimeListMonth, setPendingShiftConfirm, setPeriodEndDate, setPeriodPreset, setPeriodSearchQuery, setPeriodShowMatrix, setPeriodStartDate, setPeriodUnitFilter, setPeriodWorkTypeFilter, setPreviewData, setPreviewTitle, setSelectedDailyUnitTab, setSelectedUnit, setShowHolidaysModal, setShowPreview, setShowSquadSchedule, setUnitBulkStatus, setUnitsSubView, setVisiblePreviewColumns, staff, threeShiftAnchorSquad, twoShiftAnchorSquad, unitsSubView }} />
                        ) : (
                            <StaffListScreen ctx={{ applySafetyDate, authorizeEmployeeDelete, buildDatePicker, bulkSafetyDate, canEdit, changeStatus, current, currentUserName, exportStandardExcel, getWaterGroupSummary, logAuditEvent, openEditModal, periodSpanJsx, preparePreview, resetWaterGroupDaysToAuto, safetyFilter, safetyGroupCounts, safetyUndo, search, selectedSafetyIds, setBulkSafetyDate, setPeriodHistoryEmpId, setSafetyFilter, setSafetyUndo, setSearch, setSelectedSafetyIds, setShowSizeDetails, setStaff, setWaterGroupDays, setWaterMemoGroup, setWaterMonth, showSizeDetails, staff, stats, tableWrapperRef, undoSafetyDate, updateTombstones, view, waterMonth }} />
                                                )}
                        </div>
                    </main>

                    {showMergeModal && incomingStaff && <MergeModal ctx={{ attendanceValueJsx, cancelMerge, confirmCloudFreshness, handleFullOverwrite, handleSmartMerge, incomingBundle, incomingStaff, mergeAddCount, mergeAddSelection, mergeAnalysis, mergeAttendance, mergeAttendanceCount, mergeAttendancePending, mergeAttendanceSelection, mergeClearDaysSelection, mergeDeleteCount, mergeDeleteSelection, mergePendingPeriodWarnings, mergePeriodCount, mergePeriodSelection, mergeSelectedCount, mergeSelection, mergeTotalChanges, periodRangeJsx, setMergeAddScope, setMergeAttendanceScope, setMergePeriodScope, setMergeScope, toggleMergeAdd, toggleMergeAttendance, toggleMergeClearDays, toggleMergeDelete, toggleMergeField, toggleMergePeriod }} />}

                    {/* نافذة استيراد النص المنسوخ JSON (للهواتف) */}
                    {showPasteModal && <PasteJsonModal ctx={{ pastedJsonText, setIncomingBundle, setIncomingStaff, setPastedJsonText, setShowMergeModal, setShowPasteModal }} />}

                    {/* قالب طباعة مصفوفة الأيام — يظهر أثناء الطباعة فقط (body.printing-matrix) */}
                    <DayMatrixPrint ctx={{ DAY_MATRIX_LEGEND, getDayMatrixCell, periodEndDate, periodReportData, periodReportRows, periodStartDate, periodUnitFilter, periodWorkTypeFilter }} />

                    {showPreview && <PreviewModal ctx={{ ALL_CUSTOM_COLUMNS, dataEntryOperator, exportExcel, exportUnits, getColSpan, isCustomizable, previewData, previewTitle, printOrientation, printPreview, selectedUnit, setPreviewTitle, setPrintOrientation, setShowPreview, setVisiblePreviewColumns, shareViaWhatsApp, updateCell, view, visiblePreviewColumns, waterMonth }} />}
                    
                    
            {/* نافذة تأكيد إعادة ضبط وتثبيت الوجبة الرئيسية */}
            {/* نافذة إدارة العطل الرسمية والأعياد */}
            {showHolidaysModal && <HolidaysModal ctx={{ addOfficialHolidayRange, dailyReportDate, holidayRangeEnd, holidayRangeStart, officialHolidays, setHolidayRangeEnd, setHolidayRangeStart, setShowHolidaysModal, toggleOfficialHolidayDate }} />}

            {pendingHourlyLeave && <HourlyLeaveModal ctx={{ confirmHourlyLeave, pendingHourlyLeave, setPendingHourlyLeave }} />}
            {pendingShiftConfirm && <ShiftConfirmModal ctx={{ dailyReportDate, dailyStatusOverrides, dataEntryOperator, hourlyLeaveRecords, hourlyLeaveTimings, officialHolidays, overtimeHoursRecords, overtimeIds, pendingDeletionRequest, pendingShiftConfirm, pushDataToCloud, safeStorage, setAnchorDate, setPendingShiftConfirm, setThreeShiftAnchorSquad, setTwoShiftAnchorSquad, showCustomAlert, staff, systemUsers, threeShiftAnchorSquad, twoShiftAnchorSquad }} />}

            {pendingReturnPrompt && <ReturnPromptModal ctx={{ confirmReturn, pendingReturnPrompt }} />}

            {quickPeriod && <QuickPeriodModal ctx={{ quickPeriod, saveQuickPeriod, setQuickPeriod }} />}

            {periodHistoryEmpId && <PeriodHistoryModal ctx={{ canEdit, deletePeriodFromHistory, openPeriodEdit, periodHistoryEmpId, periodSpanJsx, setPeriodHistoryEmpId, staff }} />}

            {waterMemoGroup && <WaterMemoModal ctx={{ BOC_LOGO_DATA_URI, amountToArabicWords, getWaterGroupSummary, setWaterMemoGroup, waterMemoGroup, waterMonth }} />}

            {showSquadSchedule && <SquadScheduleModal ctx={{ BOC_LOGO_DATA_URI, getSquadsOnDuty, periodEndDate, periodReportData, periodStartDate, setShowSquadSchedule, squadRosters }} />}

            {showEditModal && editingEmployee && <EditEmployeeModal ctx={{ buildDatePicker, canEdit, cancelEdit, capturePhoto, editingEmployee, saveEmployeeEdit, showCamera, staff, startCamera, stopCamera, updateEditField, videoRef }} />}
                    
                    {showPrintForm && <NewEmployeeFormPrint ctx={{ setShowPrintForm }} />}
                    
                    <footer className="bg-gray-800 text-white mt-12 py-6 text-center">
                        <p>© 2026 شركة نفط البصرة - شعبة تبريد المركز ومحطة عزل نهر بن عمر</p>
                        <p className="text-xs text-blue-300 mt-2">👨‍💻 إعداد: المهندس أسامة خليل هاشم | الإصدار v9.5 Enterprise Cloud Edition</p>
                    </footer>
                </div>
            );
        }
        return StaffSystem;
        }
