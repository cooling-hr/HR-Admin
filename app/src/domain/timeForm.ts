// ===== استمارة ضبط الوقت: الرموز الرسمية وتحويل موقف اليوم إلى رمز =====
// المواصفة docs/superpowers/specs/2026-10-22-time-control-form-design.md، القسمان 4.1 و4.2.
// كل الرموز الافتراضية هنا في جدول واحد، وما يغيّره المستخدم من «دليل الرموز» (4.4) يُطبَّق فوقها
// في resolveCodeTable. المعرّف id هو الحرف الرسمي نفسه، فيبقى ثابتاً لو غيّر المستخدم الحرف.

export type TimeCode = { id: string; letter: string; meaning: string };

const official = (letter: string, meaning: string): TimeCode => ({ id: letter, letter, meaning });

// الرموز الأربعة والثلاثون بترتيب المفتاح الرسمي: العمود الأول ثم الثاني
export const OFFICIAL_TIME_CODES: TimeCode[] = [
    official('L', 'إجازة اعتيادية'),
    official('S', 'إجازة مرضية'),
    official('M', 'إجازة ولادة'),
    official('K', 'إجازة أمومة'),
    official('J', 'إجازة دراسية'),
    official('6', 'إجازة أربع سنوات'),
    official('2', 'مناوبة ثنائية'),
    official('3', 'مناوبة ثلاثية'),
    official('N', 'استراحة مناوبة'),
    official('V', 'استراحة مقيم'),
    official('4', 'مناوبة مختلطة'),
    official('O', 'أيام دوام الإقامة الصباحي'),
    official('7', 'إجازة اعتيادية خارج العراق'),
    official('H', 'إجازة بدون راتب خارج العراق'),
    official('T', 'إجازة بدون راتب داخل العراق'),
    official('C', 'إجازة براتب تام بدون مخصصات'),
    official('R', 'الجمع'),
    official('P', 'إيفاد خارج العراق'),
    official('I', 'إيفاد داخل العراق'),
    official('G', 'دورات داخل المحافظة'),
    official('8', 'استراحة ذوي الإعاقة'),
    official('Z', 'حضور بسبب قطع الطرق'),
    official('A', 'إعانة ذوي الإعاقة'),
    official('E', 'إصابة عمل'),
    official('B', 'أيام بقسم آخر'),
    official('D', 'أيام العدة'),
    official('W', 'أيام الوفاة'),
    official('X', 'أيام الغياب'),
    official('U', 'أيام التفرغ'),
    official('Q', 'أيام خارج الخدمة'),
    official('5', 'سحب يد'),
    official('1', 'تفرغ للحشد الشعبي'),
    official('F', 'تفرغ جزئي بأمر صادر من الهيئة الإدارية'),
    official('Y', 'العطل'),
];

// موقف اليوم كما يعيده getEmployeeDailyStatus ← معرّف رمزه، بالمطابقة التامة (الجدول 4.2).
// الحاضر والاستراحة الأسبوعية والإجازة الاعتيادية لها قواعد في timeFormCodeFor، فليست هنا.
export const STATUS_TO_CODE_ID: Record<string, string> = {
    'عطلة رسمية': 'Y',
    'دوام 24 ساعة': '3',
    'دوام صباحي (12 ساعة)': '2',
    'دوام مسائي (12 ساعة)': '2',
    'استراحة مناوبة': 'N',
    'تعذر حضور': 'Z',
    'غياب': 'X',
    'سحب يد': '5',
    'إجازة مرضية': 'S',
    'إجازة خارج العراق': '7',
    'إجازة بدون راتب': 'T',
    'إجازة أمومة': 'K',
    'إجازة ولادة': 'M',
    'إجازة دراسية': 'J',
    'إجازة أربع أو خمس سنوات': '6',
    'في دورة': 'G',
    'إيفاد': 'I',
    'إيفاد داخل العراق': 'I',
    'إيفاد خارج العراق': 'P',
    'استراحة ذوي الاحتياجات الخاصة': '8',
    'أيام العدة': 'D',
    'أيام بقسم آخر': 'B',
    'خارج الخدمة': 'Q',
    'إصابة عمل': 'E',
};

// الإجازة الاعتيادية الآتية من فترة مؤرَّخة هي «إجازة براتب تام بدون مخصصات» (المواصفة 4.3)،
// والآتية من تعديل يومي تبقى L. يُغيَّر هنا بسطر واحد.
export const LONG_PAID_LEAVE_CODE = 'C';

// موقف لا رمز له: علامة حمراء على الشاشة لا فراغ، فلا يضيع يوم بصمت
export const UNKNOWN_CODE = '؟';

export type TimeFormCodeEdits = {
    overrides: Record<string, { letter?: string; meaning?: string }>;
    removed: string[];
    custom: TimeCode[];
    activated: string[];
};

// extraByMeaning: الرموز المضافة، والرسمية التي فعّلها المستخدم حالةً يومية، مفهرسة بمعناها
export type ResolvedCodeTable = { list: TimeCode[]; byId: Record<string, TimeCode>; extraByMeaning: Record<string, TimeCode> };

// حالات النظام التي تُكتب بالرمز: من STATUS_TO_CODE_ID، ومن القواعد الخاصة في codeIdFor (L وC وR وY).
// الرمز المربوط لا يُحذف من الدليل (4.4)، ويُعرض أمامه ما يُكتب به.
const RULE_STATUSES: Record<string, string[]> = {
    L: ['إجازة اعتيادية (تعديل يومي)'],
    [LONG_PAID_LEAVE_CODE]: ['إجازة براتب تام داخل العراق (فترة مؤرَّخة)'],
    R: ['استراحة نهاية الأسبوع (الجمعة)'],
    Y: ['استراحة نهاية الأسبوع (السبت)'],
};

export const linkedStatusesOf = (id: string): string[] => [
    ...(RULE_STATUSES[id] || []),
    ...Object.keys(STATUS_TO_CODE_ID).filter(s => STATUS_TO_CODE_ID[s] === id),
];

// الرسمية بتعديلات المستخدم (الحرف والمعنى المعروض)، بلا المحذوفة، ثم المضافة.
// المربوط لا يُحذف حتى لو وصل في removed (حزمة قديمة أو ملف معدَّل يدوياً).
export const resolveCodeTable = (edits?: TimeFormCodeEdits | null): ResolvedCodeTable => {
    const overrides = edits?.overrides || {};
    const removed = new Set(edits?.removed || []);
    const activated = new Set(edits?.activated || []);
    const officialList = OFFICIAL_TIME_CODES
        .filter(c => !removed.has(c.id) || linkedStatusesOf(c.id).length > 0)
        .map(c => ({ ...c, ...(overrides[c.id] || {}), id: c.id }));
    const custom = (edits?.custom || []).map(c => ({ ...c }));
    const list = [...officialList, ...custom];
    const byId: Record<string, TimeCode> = Object.fromEntries(list.map(c => [c.id, c]));
    // بلا نموذج أصلي: المعنى نص يكتبه المستخدم، فـ«constructor» أو «__proto__» يبقى مفتاحاً عادياً
    const extraByMeaning: Record<string, TimeCode> = Object.create(null);
    for (const c of officialList) if (activated.has(c.id) && !linkedStatusesOf(c.id).length) extraByMeaning[c.meaning] = c;
    for (const c of custom) extraByMeaning[c.meaning] = c;
    return { list, byId, extraByMeaning };
};

// رسالة الخطأ أو null. edit.id غائب = رمز يُضاف. والمعنى يُفحص بقواعد الحالة اليومية (محور المراجعة 4)
// في الرمز المضاف وفي الرسمي المفعَّل، لأن معناهما هو النص المخزَّن في التعديل اليومي.
export const validateCodeEdit = (
    table: ResolvedCodeTable,
    edit: { id?: string; letter: string; meaning: string },
    reservedStatuses: string[],
): string | null => {
    const letter = String(edit.letter || '').trim();
    const meaning = String(edit.meaning || '').trim();
    if (!letter) return 'اكتب حرف الرمز.';
    if (Array.from(letter).length > 2) return 'الحرف خانة واحدة أو خانتان.';
    if (!meaning) return 'اكتب معنى الرمز.';
    const sameLetter = table.list.find(c => c.id !== edit.id && c.letter.toUpperCase() === letter.toUpperCase());
    if (sameLetter) {
        const official = OFFICIAL_TIME_CODES.some(c => c.id === sameLetter.id);
        const hint = official && !linkedStatusesOf(sameLetter.id).length
            ? ' ولاستعمال هذا الرمز حالةً يومية فعّله من سطره في الدليل.'
            : '';
        return `الحرف «${sameLetter.letter}» مستعمل للرمز «${sameLetter.meaning}».${hint}`;
    }
    const isExtra = !edit.id || Object.values(table.extraByMeaning).some(c => c.id === edit.id);
    if (isExtra) {
        if (reservedStatuses.includes(meaning)) return `«${meaning}» حالة موجودة في النظام، ولها رمزها. اختر معنى آخر.`;
        const sameMeaning = table.extraByMeaning[meaning];
        if (sameMeaning && sameMeaning.id !== edit.id) return `المعنى «${meaning}» مستعمل للرمز «${sameMeaning.letter}».`;
    }
    return null;
};

export type TimeFormDayInput = { status: string; dateStr: string; fromPeriod: boolean; isShift: boolean; naturalStatus: string };

// المواقف الحاضرة تُترك خانتها فارغة (الجدول 4.2، السطر الأول)
const PRESENT_STATUSES = ['دوام صباحي', 'حضور فعلي', 'ورقة عمل', 'مكلف بواجب', 'إجازة زمنية'];
const isOvertime = (s: string): boolean => s.includes('إضافي');

const weekDayOf = (dateStr: string): number => {
    const [y, m, d] = String(dateStr || '').split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
};

const codeIdFor = (day: TimeFormDayInput, table: ResolvedCodeTable): string | null => {
    // المناوب لا إضافي له (6.5): الموقف الإضافي يُكتب برمز وجبته الطبيعية
    const s = String((day.isShift && isOvertime(day.status) ? day.naturalStatus : day.status) || '');
    if (PRESENT_STATUSES.includes(s) || isOvertime(s)) return '';
    if (s === 'استراحة نهاية الأسبوع') {
        const wd = weekDayOf(day.dateStr);
        return wd === 5 ? 'R' : wd === 6 ? 'Y' : null;
    }
    if (s === 'إجازة اعتيادية') return day.fromPeriod ? LONG_PAID_LEAVE_CODE : 'L';
    // صيغ تعذر الحضور القديمة تُعامَل في بقية النظام تعذّراً (dailyStatusCategory)، فتأخذ رمزه
    if (s.includes('تعذر') || s.includes('توقف موقع')) return 'Z';
    if (STATUS_TO_CODE_ID[s]) return STATUS_TO_CODE_ID[s];
    if (table.extraByMeaning[s]) return table.extraByMeaning[s].id;
    return null;
};

// '' فراغ، أو حرف الرمز، أو UNKNOWN_CODE لموقف بلا رمز أو لرمز حُذف من الدليل
export const timeFormCodeFor = (day: TimeFormDayInput, table: ResolvedCodeTable): string => {
    const id = codeIdFor(day, table);
    if (id === '') return '';
    if (id === null) return UNKNOWN_CODE;
    return table.byId[id] ? table.byId[id].letter : UNKNOWN_CODE;
};

// عنوان الاستمارة كما في الملف الرسمي (بالألف في «أستمارة»)
export const TIME_FORM_TITLE = 'أستمارة ضبط الوقت شعبة تبريد المركز';
export const TIME_FORM_CONTRACTS_TITLE = 'أستمارة ضبط الوقت شعبة تبريد المركز — موظفو العقود';
export const timeFormTitle = (kind: string): string => kind === 'contracts' ? TIME_FORM_CONTRACTS_TITLE : TIME_FORM_TITLE;
