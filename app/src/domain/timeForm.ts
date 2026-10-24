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

// المرحلة 2 تعيد الرموز الرسمية وحدها؛ تطبيق تعديلات الدليل يأتي مع «دليل الرموز» (المرحلة 3)
export const resolveCodeTable = (_edits?: TimeFormCodeEdits | null): ResolvedCodeTable => {
    const list = OFFICIAL_TIME_CODES.map(c => ({ ...c }));
    const byId: Record<string, TimeCode> = Object.fromEntries(list.map(c => [c.id, c]));
    return { list, byId, extraByMeaning: {} };
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
