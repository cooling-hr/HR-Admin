import { getActivePeriod, periodEndOf, periodIdentityOf, periodMergeKeyOf, periodsOf, periodsOverlap, samePeriodDates, samePeriodExtras } from './periods.js';
import { normalizeArabicText, normalizeJobNumber } from '../core/arabic.js';
import { ISO_DAY } from '../core/dates.js';

// ===== دوال الدمج الذكي والطباعة الفردية والدورات =====
export const FIELD_NAMES_AR = {
    name: 'الاسم الكامل',
    jobTitle: 'العنوان الوظيفي',
    department: 'القسم',
    section: 'الشعبة',
    location: 'الموقع',
    unit: 'الوحدة',
    workType: 'طبيعة العمل',
    squad: 'الوجبة',
    workPhone: 'هاتف العمل',
    birthDate: 'التولد',
    workNumber: 'رقم العمل',
    hireDate: 'تاريخ التعيين',
    education: 'التحصيل الدراسي',
    graduationYear: 'سنة التخرج',
    specialization: 'الاختصاص',
    gender: 'الجنس',
    bank: 'التوطين',
    mobile: 'النقال',
    status: 'الحالة',
    vacationDays: 'أيام الإجازة',
    uniformSize: 'قياس البدلة',
    shoeSafetySize: 'قياس حذاء السلامة',
    lastSafetyDelivery: 'تاريخ آخر تجهيز',
    email: 'البريد الإلكتروني',
    relativePhone: 'هاتف احد ذوي الموظف',
    address: 'عنوان السكن'
};

// ===== انتقاء فروقات الدمج حقلاً حقلاً =====
//
// تحليل الدمج يُحسب هنا لا داخل نافذة العرض: كان يُعاد حسابه في كل رسم،
// ومربّعات الاختيار تحتاج تحليلاً ثابتاً تُبنى عليه.
// وموضعه بعد normalizeArabicText مقصود — analyzeMerge صارت تستدعيه للمقارنة،
// وقيمة useMemo تُنفَّذ أثناء الرسم فتقرأه قبل تعريفه لو وُضع أعلاه (TDZ).
export const mergeKeyOf = (jobNumber, field) => `${jobNumber}::${field}`;

export const ownKey = (obj, k) => !!obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, k);

export const ATTENDANCE_PARTS = [['status', 'dailyStatusOverrides'], ['hourly', 'hourlyLeaveRecords'], ['overtime', 'overtimeHoursRecords']];

// قيمة صالحة: الموقف نصّ غير فارغ؛ والساعات عدد موجب لا يتجاوز 24 — ملف مشوَّه لا يُكتب في بيانات الحضور
export const isValidAttendanceValue = (part, value) => part === 'status'
    ? (typeof value === 'string' && value.trim() !== '' && value.length <= 60)
    : ((typeof value === 'number' || (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim()))) && Number(value) > 0 && Number(value) <= 24);

export const analyzeMergePeriods = (inc, existing, jobNumber, overrides, deletedPeriods = null) => {
    const valid = (p) => p && p.type && p.from;
    // نسخة مكرّرة حرفياً داخل الملف نفسه تُعرض وتُطبَّق مرة واحدة
    const seenInFile = {};
    const incList = (Array.isArray(inc.statusPeriods) ? inc.statusPeriods : []).filter(valid).filter(p => {
        const fingerprint = JSON.stringify([periodIdentityOf(p), p.type, p.from, p.to || '', p.note || '', !!p.confirmedReturn]);
        if (seenInFile[fingerprint]) return false;
        seenInFile[fingerprint] = true;
        return true;
    });
    const locList = periodsOf(existing).filter(valid);
    // حالة قديمة بلا فترات تغطي كل التواريخ: أول فترة تُضاف تُسقط الرجوع إليها في getActivePeriod
    const legacy = (periodsOf(existing).length === 0 && existing.status && existing.status !== 'نشط') ? existing.status : null;
    // أيام مثبَّتة يدوياً لهذا الموظف داخل الفترة بقيمة غير نوعها: التثبيت اليومي يسبق الفترة في العرض
    const contradictingDays = (p) => Object.keys(overrides || {})
        .filter(d => d >= p.from && d <= periodEndOf(p) && overrides[d] && overrides[d][existing.id] && overrides[d][existing.id] !== p.type)
        .sort()
        .map(d => ({ date: d, value: overrides[d][existing.id] }));
    // مفتاح فريد لكل سطر: ملف مشوَّه قد يحمل معرّفاً واحداً لفترتين مختلفتين
    const uniqueKeyMaker = () => {
        const used = {};
        return (p) => {
            const k = periodMergeKeyOf(jobNumber, p);
            used[k] = (used[k] || 0) + 1;
            return used[k] === 1 ? k : `${k}#${used[k]}`;
        };
    };
    const itemKeyOf = uniqueKeyMaker();
    const items = [];
    incList.forEach(ip => {
        // النظير المحلي: المعرّف نفسه، أو النوع والتواريخ نفسها بمعرّف آخر (الفترة نفسها أُدخلت في الجهازين)
        const twin = (ip.id && locList.find(lp => lp.id === ip.id)) || locList.find(lp => samePeriodDates(lp, ip)) || null;
        if (twin && samePeriodDates(twin, ip) && samePeriodExtras(twin, ip)) return;
        const base = { key: itemKeyOf(ip), jobNumber, name: existing.name, empId: existing.id,
                       incoming: ip, local: null, overlaps: [], legacy: null, days: [], gainOnly: false };
        if (twin) {
            // النوع والتواريخ نفسها، والفرق ملاحظة أو تأكيد مباشرة كان فارغاً لديك ⇒ كسب لا تعارض
            const gainOnly = samePeriodDates(twin, ip)
                && (!(twin.note || '') || (twin.note || '') === (ip.note || ''))
                && (!twin.confirmedReturn || !!ip.confirmedReturn);
            // تواريخ جديدة قد تمسّ فترات أخرى لديك: تُعرض مع الفترة وتُستبدل إن اختيرت، كأي فترة واردة
            const overlaps = gainOnly ? [] : locList.filter(lp => lp !== twin && periodsOverlap(lp, ip));
            items.push({ ...base, kind: 'changed', local: twin, gainOnly, overlaps, days: gainOnly ? [] : contradictingDays(ip) });
            return;
        }
        const overlaps = locList.filter(lp => periodsOverlap(lp, ip));
        const days = contradictingDays(ip);
        const kind = overlaps.length > 0 ? 'overlap' : legacy ? 'legacy' : days.length > 0 ? 'days' : 'new';
        items.push({ ...base, kind, overlaps, legacy, days, deletedLocally: !!deletedPeriods && Object.prototype.hasOwnProperty.call(deletedPeriods, periodIdentityOf(ip)) });
    });
    // فترات الجهاز غير الموجودة في الملف تبقى ويُنبَّه إليها. ما يُعرض منها مع فترة واردة (نظيراً أو تداخلاً) لا يُكرَّر هنا
    // مجموعة لا كائن: معرّف مثل «constructor» يطابق خاصية موروثة في الكائن فيُخفي فترة من التنبيه
    const shownWithItems = new Set();
    items.forEach(it => {
        if (it.local) shownWithItems.add(periodIdentityOf(it.local));
        it.overlaps.forEach(p => shownWithItems.add(periodIdentityOf(p)));
    });
    const localKeyOf = uniqueKeyMaker();
    const localOnly = locList
        .filter(lp => !shownWithItems.has(periodIdentityOf(lp)) && !incList.some(ip => (lp.id && ip.id === lp.id) || samePeriodDates(ip, lp)))
        .map(lp => ({ key: localKeyOf(lp), jobNumber, name: existing.name, period: lp }));
    return { items, localOnly };
};

export const analyzeMergeAttendance = (bundle, incomingList, currentStaff, local) => {
    const result = { items: [], holidays: [], settings: [], orphans: 0, ambiguous: 0, invalid: 0, forNewEmployees: 0 };
    if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) return result;
    // موظفو الحزمة نفسها أولاً: مفاتيح قيمها معرّفاتهم
    const staffList = Array.isArray(bundle.staff) ? bundle.staff : Array.isArray(bundle.staffData) ? bundle.staffData : incomingList;
    const jobByIncomingId = new Map();
    (Array.isArray(staffList) ? staffList : []).forEach(e => {
        if (e && e.id !== undefined && e.id !== null) jobByIncomingId.set(String(e.id), normalizeJobNumber(e.jobNumber));
    });
    // رقم وظيفي مكرر لدى الجهاز: لا يُعرف لمن تذهب القيمة، فلا تُعرض ولا تُطبَّق
    const localByJob = new Map();
    const ambiguousJobs = new Set();
    currentStaff.forEach(e => {
        const k = normalizeJobNumber(e.jobNumber);
        if (!k) return;
        if (localByJob.has(k)) ambiguousJobs.add(k); else localByJob.set(k, e);
    });
    const byKey = new Map();
    ATTENDANCE_PARTS.forEach(([part, bundleKey]) => {
        const records = bundle[bundleKey];
        if (!records || typeof records !== 'object' || Array.isArray(records)) return;
        Object.keys(records).forEach(date => {
            const row = records[date];
            if (!ISO_DAY.test(date) || !row || typeof row !== 'object' || Array.isArray(row)) return;
            Object.keys(row).forEach(incomingId => {
                const value = row[incomingId];
                if (value === undefined || value === null || value === '') return;
                if (!isValidAttendanceValue(part, value)) { result.invalid++; return; }
                const job = jobByIncomingId.get(incomingId);
                if (!job) { result.orphans++; return; }
                if (ambiguousJobs.has(job)) { result.ambiguous++; return; }
                const emp = localByJob.get(job);
                // موظف في الملف ليس لديك: قيمه تأتي معه إن اختير إضافته
                if (!emp) { result.forNewEmployees++; return; }
                const key = `${date}::${job}`;
                if (!byKey.has(key)) byKey.set(key, { key, date, jobNumber: job, empId: emp.id, name: emp.name, emp, incoming: {}, local: {} });
                byKey.get(key).incoming[part] = value;
            });
        });
    });
    const localRecords = { status: local.overrides, hourly: local.hourly, overtime: local.overtime };
    byKey.forEach(item => {
        let differs = false;
        let allSame = true;
        Object.keys(item.incoming).forEach(part => {
            const recs = localRecords[part];
            const lv = ownKey(recs, item.date) && ownKey(recs[item.date], item.empId) ? recs[item.date][item.empId] : undefined;
            if (lv === undefined || lv === null || lv === '') { allSame = false; return; }
            item.local[part] = lv;
            if (String(lv) !== String(item.incoming[part])) { differs = true; allSame = false; }
        });
        if (allSame) return;
        // الموقف اليومي وحده يُخفي الفترة في العرض؛ الساعات وحدها لا، فتتبع قاعدتي «ليس لديك» و«قيمة أخرى»
        const period = getActivePeriod(item.emp, item.date);
        const againstPeriod = !!period && item.incoming.status !== undefined && item.incoming.status !== period.type;
        item.period = againstPeriod ? period : null;
        item.kind = againstPeriod ? 'period' : differs ? 'different' : 'new';
        // يوم حذفه المستخدم من جهازه وعاد في الملف: لا يُؤشَّر، ويُنبَّه إليه
        item.deletedLocally = !!local.tombstones && Object.prototype.hasOwnProperty.call(local.tombstones, `${item.date}::${item.jobNumber}`)
            && Object.keys(item.incoming).some(part => item.local[part] === undefined);
        result.items.push(item);
    });
    result.items.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
    const localHolidays = new Set(Array.isArray(local.holidays) ? local.holidays : []);
    const seenHolidays = new Set();
    (Array.isArray(bundle.officialHolidaysList) ? bundle.officialHolidaysList : []).forEach(d => {
        if (typeof d !== 'string' || !ISO_DAY.test(d) || localHolidays.has(d) || seenHolidays.has(d)) return;
        seenHolidays.add(d);
        result.holidays.push({ key: `holiday::${d}`, date: d });
    });
    result.holidays.sort((a, b) => a.date < b.date ? -1 : 1);
    const localAnchor = { shiftAnchorDate: local.anchorDate || '', threeShiftAnchorSquad: local.threeShiftAnchorSquad || '', twoShiftAnchorSquad: local.twoShiftAnchorSquad || '' };
    const anchorValues = {};
    Object.keys(localAnchor).forEach(k => {
        if (typeof bundle[k] === 'string' && bundle[k] && bundle[k] !== localAnchor[k]) anchorValues[k] = bundle[k];
    });
    if (Object.keys(anchorValues).length > 0) {
        result.settings.push({ key: 'setting::anchor', kind: 'anchor', local: localAnchor, incoming: { ...localAnchor, ...anchorValues }, values: anchorValues });
    }
    if (typeof bundle.dataEntryOperator === 'string' && bundle.dataEntryOperator && bundle.dataEntryOperator !== (local.dataEntryOperator || '')) {
        result.settings.push({ key: 'setting::operator', kind: 'operator', local: local.dataEntryOperator || '', incoming: bundle.dataEntryOperator,
                               values: { dataEntryOperator: bundle.dataEntryOperator } });
    }
    return result;
};

export const analyzeMerge = (incoming, currentStaff, overrides = {}, tombstones = null, incomingTombstones = null) => {
    // رقم وظيفي يحمله أكثر من موظف لديك: لا يُعرف أيّهم المقصود، فلا يُقارَن ولا يُعدّ جديداً — تُنبّه إليه النافذة.
    // والفهرس بلا نموذج أولي: رقم مثل «constructor» لا يطابق خاصية موروثة
    const currentMap = Object.create(null);
    const ambiguousJobs = new Set();
    currentStaff.forEach(s => {
        const key = normalizeJobNumber(s.jobNumber);
        if (!key) return;
        if (key in currentMap) ambiguousJobs.add(key); else currentMap[key] = s;
    });

    const added = [];
    const updated = [];
    const periodItems = [];
    const localOnlyPeriods = [];
    const fieldsToCompare = Object.keys(FIELD_NAMES_AR);
    // الحذف اتجاهان: ما حُذف على الجهاز الآخر وما زال لديك، وما حذفتَه أنت وما زال الملف يحمله
    const tombEmployeesOf = (t) => (t && typeof t === 'object' && t.employees && typeof t.employees === 'object') ? t.employees : {};
    const incTombEmployees = tombEmployeesOf(incomingTombstones);
    const localTombEmployees = tombEmployeesOf(tombstones);
    const incomingJobs = new Set();
    const previouslyDeleted = Object.create(null);

    incoming.forEach(inc => {
        const key = normalizeJobNumber(inc.jobNumber);
        if (!key) return;
        incomingJobs.add(key);

        if (ambiguousJobs.has(key)) return;
        const existing = currentMap[key];
        if (!existing) {
            added.push(inc);
            // موظف حذفتَه أنت والملف ما زال يحمله: يُعرض موسوماً وبلا تأشير، لا كإضافة عادية
            if (localTombEmployees[key]) previouslyDeleted[key] = localTombEmployees[key];
        } else {
            const employeeChanges = [];
            fieldsToCompare.forEach(field => {
                const incVal = String(inc[field] || '').trim();
                const extVal = String(existing[field] || '').trim();

                // فرق «إملائي» = يتطابقان بعد التطبيع ويختلفان حرفياً: مسافة زائدة،
                // أو "ة" مقابل "ه". لا يُسقَط — فقد يكون الملف يحمل تصحيحاً مقصوداً،
                // وإسقاطه يترك المستخدم بلا أي طريق لتطبيقه — بل يُعرَض موسوماً وبلا
                // تأشير تلقائي، فلا يُغرق القائمة بضجيج ولا يختفي.
                const isCosmetic = extVal !== '' &&
                    normalizeArabicText(incVal) === normalizeArabicText(extVal);
                if (incVal !== '' && incVal !== extVal) {
                    employeeChanges.push({
                        field: field,
                        fieldNameAr: FIELD_NAMES_AR[field],
                        oldVal: extVal || 'فارغ',
                        newVal: incVal,
                        // علامة صريحة لا استنتاج من نص "فارغ": قد تكون قيمةً حقيقية لحقل ما
                        wasEmpty: extVal === '',
                        cosmeticOnly: isCosmetic
                    });
                }
            });

            // الفترات المؤرخة تُقارَن سجلاً سجلاً بمعرّفها، لا كحقل
            const periodDiff = analyzeMergePeriods(inc, existing, key, overrides, tombstones && tombstones.periods);
            periodDiff.items.forEach(it => periodItems.push(it));
            periodDiff.localOnly.forEach(lo => localOnlyPeriods.push(lo));

            if (employeeChanges.length > 0) {
                updated.push({
                    name: existing.name,
                    jobNumber: key,
                    changes: employeeChanges,
                    existingObject: existing,
                    incomingObject: inc
                });
            }
        }
    });

    // شاهدة حذف في الملف لموظف ما زال لديك — إلا أن يكون الملف نفسه يحمله، فالقائمة أحدث من الشاهدة
    const deletedElsewhere = Object.keys(incTombEmployees)
        .map(job => String(job).trim())
        .filter(job => job && currentMap[job] && !ambiguousJobs.has(job) && !incomingJobs.has(job))
        .map(job => ({
            jobNumber: job,
            name: currentMap[job].name || (incTombEmployees[job] && incTombEmployees[job].name) || '',
            at: (incTombEmployees[job] && incTombEmployees[job].at) || ''
        }));

    return { added, updated, periods: periodItems, localOnlyPeriods, deletedElsewhere, previouslyDeleted, ambiguousJobs: Array.from(ambiguousJobs), totalIncoming: incoming.length };
};
