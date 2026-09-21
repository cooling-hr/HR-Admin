// أنواع البيانات المشتركة لوحدات core وdomain، مستخرجة من الاستعمال الفعلي في هذه
// الوحدات وحدها (كل حقل تقرؤه إحداها). كل حقل غير مؤكّد يُعلَن اختيارياً، وفهرس
// [key: string]: unknown في Employee يغطّي بقية حقول السجل التي لا تقرؤها هذه الوحدات
// (ولا تُحذف من البيانات) — فالسجلات الحقيقية أوسع من هذه القائمة.

// الأنواع الثمانية ثابتة تماماً وتطابق PERIOD_TYPES حرفياً؛ لا تاسع لها.
export type PeriodType =
  | 'إجازة اعتيادية'
  | 'في دورة'
  | 'إيفاد'
  | 'إجازة بدون راتب'
  | 'إجازة طويلة'
  | 'إجازة أمومة'
  | 'غياب'
  | 'سحب يد';

export interface StatusPeriod {
  // المعرّف اختياري: فترات قديمة بلا معرّف قائمة فعلاً (periodIdentityOf يتعامل معها)
  id?: string;
  // string إلى جانب PeriodType: حالات قديمة جاءت من استيراد Excel أو من emp.status
  type: PeriodType | string;
  from: string;                                 // YYYY-MM-DD
  to?: string | null;                           // فارغة/null = مفتوحة النهاية
  note?: string;
  // يُقرأ بالتحقق من صحته فقط (!!)؛ الواجهة تكتبه true، والقديم قد يكون تاريخاً
  confirmedReturn?: boolean | string | null;
  legacy?: boolean;                             // فترة مشتقّة من emp.status، غير مخزَّنة
}

export interface Employee {
  id: string | number;
  name?: string;
  status?: string;                              // النص القديم قبل الفترات المؤرَّخة — لا يُحذف أبداً
  statusPeriods?: StatusPeriod[];
  jobNumber?: string;
  jobTitle?: string;
  gender?: string;
  unit?: string;
  lastSafetyDelivery?: string;
  bank?: string;
  birthDate?: string;
  education?: string;
  hireDate?: string;
  mobile?: string;
  squad?: string;
  workType?: string;
  lastModified?: string;
  [key: string]: unknown;                       // بقية الحقول تُعلَن عند الحاجة
}

// مسوّدة الفترة في نافذة الإجراء السريع: count نصّ لأنه يأتي من input.value مباشرة
export interface PeriodDraft {
  from?: string;
  to?: string;
  mode?: string;                                // 'date' = تُقرأ النهاية، غير ذلك = تُحتسب من المدة
  count?: string;
  unit?: string;                                // 'months' أو غيره (أيام)
  [key: string]: unknown;
}

export type SafetyStatusType =
  | 'ok'
  | 'due-never'
  | 'due-both'
  | 'alert-both'
  | 'due-uniform'
  | 'alert-uniform';

export interface SafetyStatus {
  label: string;
  type: SafetyStatusType;
  color: string;
}

// ===== الدمج =====

// المواقف اليومية المثبَّتة: تاريخ ← معرّف الموظف ← قيمة الموقف
export type OverridesMap = Record<string, Record<string, string>>;

export interface MergeFieldChange {
  field: string;
  fieldNameAr: string;
  oldVal: string;
  newVal: string;
  wasEmpty: boolean;
  cosmeticOnly: boolean;
}

export interface MergeContradictingDay {
  date: string;
  value: string;
}

export interface MergePeriodItem {
  key: string;
  jobNumber: string;
  name?: string;
  empId: Employee['id'];
  incoming: StatusPeriod;
  local: StatusPeriod | null;
  overlaps: StatusPeriod[];
  legacy: string | null;
  days: MergeContradictingDay[];
  gainOnly: boolean;
  kind?: string;
  deletedLocally?: boolean;
}

export interface MergeLocalOnlyPeriod {
  key: string;
  jobNumber: string;
  name?: string;
  period: StatusPeriod;
}

export interface MergePeriodsResult {
  items: MergePeriodItem[];
  localOnly: MergeLocalOnlyPeriod[];
}

export interface MergeUpdatedEmployee {
  name?: string;
  jobNumber: string;
  changes: MergeFieldChange[];
  existingObject: Employee;
  incomingObject: Employee;
}

export interface MergeDeletedElsewhere {
  jobNumber: string;
  name: string;
  at: string;
}

export interface MergeResult {
  added: Employee[];
  updated: MergeUpdatedEmployee[];
  periods: MergePeriodItem[];
  localOnlyPeriods: MergeLocalOnlyPeriod[];
  deletedElsewhere: MergeDeletedElsewhere[];
  previouslyDeleted: Record<string, unknown>;
  ambiguousJobs: string[];
  totalIncoming: number;
}

export interface MergeAttendanceItem {
  key: string;
  date: string;
  jobNumber: string;
  empId: Employee['id'];
  name?: string;
  emp: Employee;
  incoming: Record<string, unknown>;
  local: Record<string, unknown>;
  period?: StatusPeriod | null;
  kind?: string;
  deletedLocally?: boolean;
}

export interface MergeHolidayItem {
  key: string;
  date: string;
}

export interface MergeSettingItem {
  key: string;
  kind: string;
  local: unknown;
  incoming: unknown;
  values: Record<string, string>;
}

export interface MergeAttendanceResult {
  items: MergeAttendanceItem[];
  holidays: MergeHolidayItem[];
  settings: MergeSettingItem[];
  orphans: number;
  ambiguous: number;
  invalid: number;
  forNewEmployees: number;
}

// حالة الحضور على الجهاز كما تمرّرها الواجهة إلى analyzeMergeAttendance
export interface LocalAttendanceState {
  overrides?: unknown;
  hourly?: unknown;
  overtime?: unknown;
  tombstones?: Record<string, unknown> | null;
  holidays?: string[] | null;
  anchorDate?: string;
  threeShiftAnchorSquad?: string;
  twoShiftAnchorSquad?: string;
  dataEntryOperator?: string;
}

// شواهد الحذف: موظفون وفترات حُذفوا على أحد الجهازين
export interface Tombstones {
  employees?: Record<string, { name?: string; at?: string } | undefined>;
  periods?: Record<string, unknown>;
  [key: string]: unknown;
}
