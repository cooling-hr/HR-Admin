# استمارة ضبط الوقت — خطة التنفيذ

> **للمنفّذ:** تُنفَّذ مهمةً مهمة بـ superpowers:executing-plans (تنفيذ مباشر في الجلسة). الخطوات بمربعات (`- [ ]`) للتتبّع. **لا اختبارات آلية** في هذا المشروع (قرار أسامة 2026-09-16): التحقق بالبناء وفحوص النقل ومراجعة Codex وتجربة أسامة على نسخة سطح المكتب.

**الهدف:** تُخرج الشعبة «استمارة ضبط الوقت» الشهرية برموزها الرسمية من بيانات النظام، وتحلّ محلّ مصفوفة الأيام، ويكون في النظام دليل رموز قابل للتعديل.

**المعمارية:** الرموز وتحويل الموقف إلى رمز في وحدة domain جديدة بلا React (`timeForm.ts`). الاستمارة تُبنى من `periodReportData` (الموقف النهائي لكل يوم) في `useMemo` داخل `StaffSystem`، وترسمها مكوّنات في `features/units/`. الأنواع المؤرَّخة الجديدة إضافات في `domain/periods.ts` وأخواتها، بلا ترحيل بيانات.

**التقنية:** React 18، Vite، TypeScript في domain، Tailwind 3.4.17 وقت البناء، XLSX من CDN عبر `ensureLibs`.

**المواصفة:** `docs/superpowers/specs/2026-10-22-time-control-form-design.md` (اقرأها مع الخطة؛ أرقام الأقسام أدناه منها).

## القيود العامة

- مصدر واحد للنسختين: كل شيء في `StaffSystem.jsx` و`features/` و`domain/`. طبقتا البيانات تُمسّان في المرحلة 3 وحدها (مفتاح التخزين الجديد).
- `StaffSystem.jsx` لا يستورد طبقة بيانات، ولا نص يذكر Firebase في الجسم المشترك.
- مكوّن الميزة بصيغة `({ ctx }) => { const {...} = ctx; }`. كل اسم جديد يُضاف إلى تفكيكه **وإلى `ctx` عند موضع استدعائه**.
- أصناف Tailwind تُكتب كاملة، لا مركّبة. وكل صنف لوني جديد يُضاف إلى قائمة «الوضع الليلي (Dark Mode)» في `app/hr-offline.html` و`app/hr-cloud.html` معاً، أو يُتحقق أنه فيها.
- التواريخ `YYYY-MM-DD` و`localDateStr()`، لا `toISOString()`.
- البيانات القائمة لا تُرحَّل: كل نوع مخزَّن يبقى بنصّه.
- التوقيع «إعداد المهندس أسامة خليل هاشم» **لا يُطبع على الاستمارة** (وثيقة رسمية).
- لا بيانات حقيقية إلى أي مزوّد خارجي. ملف «تبريد المركز» لا يُنسخ إلى المستودع.
- لا سطر `Co-Authored-By` في الالتزامات. الالتزام بحكمي، و`git push` بموافقة صريحة فقط.

**بوابة نهاية كل مهمة** (يُشار إليها أدناه بـ«البوابة»)، من داخل `app/`:
1. `npm run build` ينجح (ويشمل فحص عزل الأوفلاين).
2. `npx tsc --noEmit --allowJs --checkJs --jsx react-jsx src/app/StaffSystem.jsx src/features/*/*.jsx 2>&1 | grep -E "TS2304|TS2552|TS18004"`: لا ناتج عدا `XLSX` و`saveAs`.
3. `node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --against .baseline/offline.txt` ومثله للسحابية: كل **نقص** يُفحص، فالمقبول وحده نصّ أزالته المهمة عمداً (يُذكر في تقرير المهمة).
4. `python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud`.
5. التزام، ثم مراجعة Codex للالتزام في الخلفية (وكيل `engineering-ai-hub:codex-review`)، وتُعالَج النتائج المقبولة في التزام لاحق.

## محاور المراجعة

ما لا تكشفه البوابة وأرجح أن يصيب المستخدم. كل محور مذكور في المهمة التي تملك كوده، ويُرسل إلى Codex مع الالتزام، ويُعطى لأسامة في قائمة التجربة:
1. **جمعة وسبت بعد إجازة يومية** (الخميس والأحد اعتيادية بتعديل يومي): يُكتبان L لا C، لأنهما لم يأتيا من فترة مؤرَّخة (المهمة 5).
2. **يوم إضافي بلا ساعات في `overtimeHoursRecords`**: الصف الثاني فارغ بلا تنبيه (حالة نادرة تُكمَل يدوياً، قرار أسامة). تقرير الفترة يفترض له 2 أو 3 ساعات، والاستمارة لا تأخذ هذا الافتراض (المهمة 5).
3. **فترة قائمة تُفتح للتعديل:** «إجازة اعتيادية» تُعرض «إجازة براتب» وتُحفظ بالنوع نفسه، و«إيفاد» يُعرض «إيفاد داخل العراق» ويُحفظ «إيفاد»، و«إجازة طويلة» القديمة تبقى كما هي (المهمة 2).
4. **رمز مضاف بمعنى يطابق حالة موجودة** (مثل «غياب»)، أو بحرف مكرر: يُرفض الحفظ برسالة (المهمة 9).
5. **تعديل الدليل على جهاز في النسخة السحابية:** يصل الأجهزة الأخرى ولا يمحوه حفظ تلقائي من جهاز لم يتلقّه بعد (المهمة 10).

---

## المرحلة 1: الأنواع الجديدة وأثرها

### المهمة 1: الأنواع في domain (الفترات، الأعداد، الماء)

**الملفات:**
- تعديل: `app/src/domain/types.ts` (`PeriodType`، السطر 6–15)
- تعديل: `app/src/domain/periods.ts` (`PERIOD_TYPES`، `QUICK_STATUS_OPTIONS`)
- تعديل: `app/src/domain/dailyCounts.ts`
- تعديل: `app/src/domain/water.ts` (السطران 11 و18)
- تعديل: `CLAUDE.md` (قسم «اصطلاحات البيانات والتاريخ»، فقرة الأنواع الثمانية)

**الواجهات:**
- ينتج: `PERIOD_TYPES` بـ17 نوعاً، و`STATUS_BUTTON_GROUPS`، و`statusButtonLabel(type: string): string`، و`LONG_ABSENCE_TYPES: string[]`، والفئة `'detached'` في `DailyCategory`.

- [ ] **الخطوة 1: أضف الأنواع التسعة** إلى `PeriodType` وإلى `PERIOD_TYPES` بنصوصها حرفياً:
  `إجازة خارج العراق` (نوع واحد بلا تمييز براتب أو بدونه، قرار أسامة 2026-10-24)، `إجازة دراسية`، `إجازة أربع أو خمس سنوات`، `إجازة ولادة`، `إيفاد خارج العراق`، `أيام العدة`، `أيام بقسم آخر`، `خارج الخدمة`، `إصابة عمل`.
  التفرّغ بأنواعه الثلاثة **ليس منها** (قرار أسامة 2026-10-24): يُفعَّل من دليل الرموز في المرحلة 3.
  و`OPEN_ENDED_PERIOD_TYPES` لا يتغير. وحدّث تعليق «الأنواع الثمانية» في الملفين ليذكر أن القائمة وُسِّعت بطلب أسامة 2026-10-22.

- [ ] **الخطوة 2: استبدل `QUICK_STATUS_OPTIONS`** بـ:
  ```ts
  export type StatusButtonOption = { value: string; label: string };
  export const STATUS_BUTTON_GROUPS: Array<{ label: string | null; options: StatusButtonOption[] }>;
  export const STATUS_BUTTON_VALUES: string[];          // كل value مسطّحةً، ومنها 'نشط'
  export const statusButtonLabel = (type: string): string; // التسمية المعروضة، أو النص نفسه إن لم يكن في الزر
  ```
  المجموعات والتسميات والقيم كما في جدول القسم 5 من المواصفة حرفياً. والمجموعة الأولى `label: null` فيها «نشط» وحده. القيمة المخزَّنة لخيار «إجازة براتب تام داخل العراق» هي `إجازة اعتيادية`، ولخيار «إيفاد داخل العراق» هي `إيفاد`.

- [ ] **الخطوة 3: أضف `LONG_ABSENCE_TYPES`** في `periods.ts` للتقييم وحده: كل `PERIOD_TYPES` عدا `في دورة` و`إيفاد` و`إيفاد خارج العراق` و`غياب` و`سحب يد` (القسم 6.4). و`isLongOrMaternityLeave` تبقى كما هي في التصنيف وفي الإخفاء من الكشف اليومي.

- [ ] **الخطوة 4: الفئة `'detached'` في `dailyCounts.ts`:**
  - تُضاف إلى `DailyCategory`، وفي `DAILY_CATEGORY_ORDER` بعد `'mission'`.
  - `const DETACHED_STATUSES = ['أيام بقسم آخر', 'خارج الخدمة']`، وتسميتها المعروضة «خارج الشعبة»، و`const EXTRA_LEAVE_STATUSES = ['أيام العدة', 'إصابة عمل']`.
  - في `dailyStatusCategory` يُفحصان بالمطابقة التامة **قبل** أي `includes` (لأن «خارج الخدمة» قد تقع في فحص لاحق).

- [ ] **الخطوة 5: قوائم الماء** (القسم 6.2): أضف `إيفاد خارج العراق` إلى `WATER_NEXT_MONTH_TYPES`. وأضف إلى `WATER_LEAVE_TALLY_TYPES` كل الأنواع الجديدة عدا `إيفاد خارج العراق`. غيّر نوع القائمتين إلى `string[]` إن احتاج الأمر، لأن `إجازة خارج العراق` تأتي من التعديل اليومي أيضاً.

- [ ] **الخطوة 6: CLAUDE.md:** اكتب في فقرة الأنواع أنها صارت 17 نوعاً بطلب أسامة (2026-10-22)، وأن مرجع قائمتها `PERIOD_TYPES`، مع بقاء قاعدة «لا نوع جديد إلا بطلب صريح».

- [ ] **الخطوة 7: البوابة** (الالتزام: «Add the official long statuses as dated period types, with their daily-count category and water lists»).

### المهمة 2: زر الحالة ونافذة الفترة بلا باب «إجازة طويلة»

**الملفات:**
- تعديل: `app/src/features/staffList/StaffListScreen.jsx:770-795` (القائمة والشارة)
- تعديل: `app/src/features/periods/QuickPeriodModal.jsx:12-37`
- تعديل: `app/src/app/StaffSystem.jsx` (`openPeriodEdit` حوالي 3931–3962، `saveQuickPeriod` حوالي 3996–4004)

**الواجهات:**
- يستهلك: `STATUS_BUTTON_GROUPS`، `STATUS_BUTTON_VALUES`، `statusButtonLabel` (المهمة 1).

- [ ] **الخطوة 1: القائمة في جدول الملاك** تُرسم من `STATUS_BUTTON_GROUPS` (`optgroup` لكل مجموعة لها `label`). الخيار الإضافي للحالة الخارجة عن الزر يبقى بشرط `!STATUS_BUTTON_VALUES.includes(resolvedStatus)`. والشارة غير القابلة للتعديل تعرض `statusButtonLabel(resolvedStatus)`.
- [ ] **الخطوة 2: احذف الباب «إجازة طويلة»** من `QuickPeriodModal` (كتلة «صنف الإجازة»)، ومن `saveQuickPeriod`: النوع المحفوظ هو `quickPeriod.category` دائماً. واحذف من `openPeriodEdit` المتغيّر `isSplit` والحقلين `keepType` و`paid`: الفئة هي `period.type` كما هو مخزَّن. فيبقى «إجازة طويلة» القديم بنصّه (محور المراجعة 3).
- [ ] **الخطوة 3: عنوان النافذة** يعرض `statusButtonLabel(quickPeriod.category)`. ورسالة «المدة مطلوبة» تبقى كما هي، لأنها تنطبق على الأنواع الجديدة.
- [ ] **الخطوة 4: ابحث** `grep -n "'إجازة طويلة'\|keepType\|quickPeriod.paid" src -r`: لا يبقى إلا ما في مصفوفة الأيام (`getDayMatrixCell` و`DAY_MATRIX_LEGEND`، تُحذف في المهمة 6) وفي التقييم (المهمة 4).
- [ ] **الخطوة 5: البوابة.** النصّان «براتب (إجازة اعتيادية)» و«صنف الإجازة:» ينقصان عمداً (الالتزام: «Give every long status its own status-button option and drop the long-leave branch»).

### المهمة 3: ربط الجمعة والسبت بالإجازة من النوع نفسه

**الملفات:**
- تعديل: `app/src/app/StaffSystem.jsx:1024-1028` (`getEmployeeDailyStatus`) و`:1263-1266` (تنبيه تسليط الإجازة على الجمعة أو السبت)
- تعديل: `نظام_ادارة_الملاك_الدليل_الشامل_للقواعد.md` القسم 4.2

- [ ] **الخطوة 1:** شرط الربط يصير `isLeaveType(thuStatus) && thuStatus === sunStatus`، ويُعاد `thuStatus`. و`isLeaveType` تبقى كما هي، فلا تُوسَّع في هذه المهمة.
- [ ] **الخطوة 2:** التنبيه عند 1263 يظهر بالشرط نفسه معكوساً: `!(isLeaveType(thuStatus) && thuStatus === sunStatus)`. ويُكمَل نصّه بأن الإجازة يجب أن تكون «من النوع نفسه» يومي الخميس والأحد.
- [ ] **الخطوة 3:** حدّث الدليل 4.2 بالشرط الجديد، ومعه مثال: خميس اعتيادية وأحد مرضية تُكتب فيهما الجمعة R والسبت Y.
- [ ] **الخطوة 4: البوابة** (الالتزام: «Bridge Friday and Saturday into leave only when Thursday and Sunday carry the same leave type»).

### المهمة 4: الاستبعاد من التقييم، وأعمدة تقرير الفترة

**الملفات:**
- تعديل: `app/src/app/StaffSystem.jsx` (حوالي 2653 و2795، و`periodReportData` 1566–1704، و`exportPeriodReportExcel`)
- تعديل: `app/src/features/units/UnitsScreen.jsx` (`DAILY_COUNT_CHIPS` السطر 47 وما بعده، وجدول إجمالي تقرير الفترة)
- تعديل: الدليل الشامل 3.3 و4.1 و4.3 و8.1 و8.3

**الواجهات:**
- يستهلك: `LONG_ABSENCE_TYPES`، والفئة `'detached'`.
- ينتج: الحقل `detached: number` في كل عنصر من `periodReportData.employees`.

- [ ] **الخطوة 1: الكشف اليومي لا يُمسّ** (قرار أسامة 2026-10-24): أصحاب المواقف الطويلة يظهرون فيه بحالتهم، ومواضع `isLongOrMaternityLeave` للإخفاء (1818، وUnitsScreen 400 و423) تبقى كما هي.
- [ ] **الخطوة 2:** التقييم (2653 و2795): `!(p && LONG_ABSENCE_TYPES.includes(p.type))`.
- [ ] **الخطوة 3: `periodReportData`:**
  - عدّاد `detached` لـ`dailyStatusCategory(status) === 'detached'`، يُفحص قبل فرع الإجازات.
  - فرع الإجازات يشمل أيضاً `إجازة بدون راتب` و`إجازة دراسية` و`إجازة ولادة` و`إجازة أربع أو خمس سنوات` و`أيام العدة` و`إصابة عمل`. أما «خارج العراق» فيلتقط الإجازتين خارج العراق كما هو اليوم.
  - تأكد أن `إيفاد خارج العراق` يقع في `deputations` لا في الإجازات: فرع الإجازات يفحص «خارج العراق» قبل فرع الإيفاد، فيجب استثناء ما فيه «إيفاد».
  - تُضاف `officialHolidays` و`overtimeHoursRecords` و`hourlyLeaveRecords` إلى اعتماديات `useMemo`.
- [ ] **الخطوة 4:** عمود «خارج الشعبة» في جدول الإجمالي على الشاشة وفي `exportPeriodReportExcel`، بعد «الإيفادات».
- [ ] **الخطوة 5:** شارة «خارج الشعبة» في `DAILY_COUNT_CHIPS`، تظهر عند وجودها فقط. ولونها من أصناف موجودة في قائمة الوضع الليلي، أو يُضاف صنفها إليها.
- [ ] **الخطوة 6:** حدّث الدليل الشامل: 8.1 (قائمة المستبعدين من التقييم، والظهور في الكشف اليومي)، و8.3 (قائمتا الماء)، و3.3 و4.1 و4.3 (الأنواع الجديدة وزر الحالة).
- [ ] **الخطوة 7: البوابة** (الالتزام: «Exclude long statuses from the evaluation by an explicit list, and count the new statuses in the period report»).

**نهاية المرحلة 1:** تقرير لأسامة بقائمة التجربة (محور المراجعة 3، وظهور صاحب الإجازة الطويلة في الكشف واستبعاده من التقييم والماء)، والرفع بموافقته.

---

## المرحلة 2: الاستمارة

### المهمة 5: الرموز وتحويل اليوم إلى رمز

**الملفات:**
- إنشاء: `app/src/domain/timeForm.ts`
- تعديل: `app/src/app/StaffSystem.jsx` (`dailyLog` في `periodReportData`، و`useMemo` جديد بعده)

**الواجهات:**
- ينتج من `timeForm.ts`:
  ```ts
  export type TimeCode = { id: string; letter: string; meaning: string };
  export const OFFICIAL_TIME_CODES: TimeCode[];          // 34 رمزاً من جدول 4.1، و id = الحرف الرسمي
  export const STATUS_TO_CODE_ID: Record<string, string>; // جدول 4.2 بالمطابقة التامة
  export const LONG_PAID_LEAVE_CODE = 'C';
  export const UNKNOWN_CODE = '؟';
  export type TimeFormCodeEdits = { overrides: Record<string, { letter?: string; meaning?: string }>; removed: string[]; custom: TimeCode[]; activated: string[] };
  export type ResolvedCodeTable = { list: TimeCode[]; byId: Record<string, TimeCode>; extraByMeaning: Record<string, TimeCode> }; // extra = المضافة والرسمية المفعَّلة حالةً يومية
  export const resolveCodeTable = (edits?: TimeFormCodeEdits | null): ResolvedCodeTable;
  export type TimeFormDayInput = { status: string; dateStr: string; fromPeriod: boolean; isShift: boolean; naturalStatus: string };
  export const timeFormCodeFor = (day: TimeFormDayInput, table: ResolvedCodeTable): string; // '' فراغ، أو حرف، أو UNKNOWN_CODE
  ```
- ينتج في `periodReportData.employees[].dailyLog[]`: الحقلان `fromPeriod: boolean` و`otRecordedHours: number | null`.
- ينتج في `StaffSystem`: `timeFormData` (انظر الخطوة 4).

- [ ] **الخطوة 1: `timeForm.ts`:** الجدولان حرفياً من المواصفة 4.1 و4.2. وفي هذه المرحلة تُعيد `resolveCodeTable(null)` الرموز الرسمية وحدها، والمرحلة 3 تطبّق عليها التعديلات.
- [ ] **الخطوة 2: قواعد `timeFormCodeFor`، بهذا الترتيب:**
  1. المناوب (`isShift`) إن كان موقفه فيه «إضافي» يُحوَّل بموقفه الطبيعي `naturalStatus` (6.5).
  2. الموقف الحاضر (دوام صباحي، حضور فعلي، ورقة عمل، مكلف بواجب، إجازة زمنية، وكل ما فيه «إضافي») فراغ.
  3. «استراحة نهاية الأسبوع»: يوم الجمعة R، ويوم السبت Y، حسب `dateStr`.
  4. `إجازة اعتيادية`: إن جاءت من فترة (`fromPeriod`) فالرمز `LONG_PAID_LEAVE_CODE`، وإلا L.
  5. `STATUS_TO_CODE_ID`، ثم `extraByMeaning`، ثم `UNKNOWN_CODE`.

  ويُعاد دائماً `table.byId[id].letter`. فإن حُذف الرمز من الجدول أُعيد `UNKNOWN_CODE`.
- [ ] **الخطوة 3: `dailyLog`:**
  - `fromPeriod` = لا تعديل يومي لذلك اليوم، و`getActivePeriod(emp, dateStr)?.type === status`. فالجمعة والسبت المربوطان بإجازة يومية لا يُعدّان من فترة (محور المراجعة 1).
  - `otRecordedHours` = قيمة `overtimeHoursRecords[dateStr]?.[emp.id]` إن وُجدت، وإلا `null`. و`otHours` الافتراضي لا يُمسّ، لأن تقرير الفترة يستعمله.
- [ ] **الخطوة 4: `timeFormData = useMemo(...)`** من `periodReportData`:
  - الشكل: `{ year, month, daysInMonth, staffRows, contractRows, warnings: { staff, contracts } }`.
  - كل صف: `{ employee, cells: Array<{ day: number; code: string; hours: number | null; inMonth: boolean; isFuture: boolean }>, totalHours: number }`، و`cells` طولها 31 دائماً.
  - كل تحذير: `{ unknown: Array<{ name: string; days: number[] }> }`.
  - الصفوف مرتّبة بـ`sortByJobNumber`، وتُقسم بـ`isContractEmployee`.
  - `hours` = `otRecordedHours` لليوم الذي فيه «إضافي» في الموقف، وإلا `null` (محور المراجعة 2: لا افتراض ولا تنبيه).
  - `totalHours` جمع `hours`.
  - الشهر يُؤخذ من `periodStartDate`.
- [ ] **الخطوة 5: البوابة.** لا واجهة بعد، فيكفي أن ينجح البناء (الالتزام: «Map each day's final status to its official time-form code»).

### المهمة 6: شاشة الاستمارة بدل مصفوفة الأيام

**الملفات:**
- إنشاء: `app/src/features/units/TimeFormView.jsx`
- تعديل: `app/src/features/units/UnitsScreen.jsx:720-800` (المبدّل وجسم المصفوفة)
- تعديل: `app/src/app/StaffSystem.jsx` (الحالة `periodShowMatrix`، وحذف `getDayMatrixCell` و`DAY_MATRIX_LEGEND`، و`ctx` لـ`UnitsScreen` في السطر 4846)

**الواجهات:**
- يستهلك: `timeFormData` و`OFFICIAL_TIME_CODES` (أو `resolveCodeTable(null).list`).
- ينتج: الحالة `periodView: 'summary' | 'timeForm'` بدل `periodShowMatrix`، و`timeFormKind: 'staff' | 'contracts'`، و`selectTimeFormMonth(ym: string): void` (تضبط البداية على أول الشهر والنهاية على آخره).

- [ ] **الخطوة 1:** يصير المبدّل «📊 إجمالي / 📋 استمارة ضبط الوقت». وعند اختيار الاستمارة، إن لم تكن الفترة شهراً كاملاً، يُستدعى `selectTimeFormMonth` بشهر `periodStartDate`. وفي شريط الاستمارة حقل `<input type="month">` مربوط بـ`selectTimeFormMonth`.
- [ ] **الخطوة 2: `TimeFormView`** يرسم:
  - مفتاح «الملاك / العقود».
  - سطر التنبيه: عدد خانات `؟` وأسماء أصحابها وأيامها.
  - العنوان كما في 3، ثم الجدول بصفّين لكل موظف. الأعمدة الأربعة الأولى و«مجموع الساعات» بـ`rowSpan={2}`. والصف الثاني خلفيته `#ccffff` بخاصية `style`، لا بصنف.
  - الأيام خارج الشهر مظللة، والأيام القادمة بنقطة باهتة، وخانة `؟` حمراء.
  - تحت الجدول مفتاح الرموز على الشاشة فقط.
  - ألوان خانات الرموز: صنف كامل لكل فئة من `dailyStatusCategory`، تُعرَّف في خريطة ثابتة داخل الملف. وكل صنف ليس في قائمة الوضع الليلي يُضاف إليها في القالبين.
- [ ] **الخطوة 3: احذف المصفوفة:** `getDayMatrixCell`، و`DAY_MATRIX_LEGEND`، وجسمها في `UnitsScreen`، وأسماءها من التفكيك ومن `ctx`.
- [ ] **الخطوة 4: البوابة.** نصوص المصفوفة تنقص عمداً (الالتزام: «Replace the day matrix with the time-control form on screen»).

### المهمة 7: طباعة الاستمارة

**الملفات:**
- إنشاء: `app/src/features/units/TimeFormPrint.jsx` (بدل `DayMatrixPrint.jsx`، الذي يُحذف)
- تعديل: `app/src/app/StaffSystem.jsx` (`printDayMatrix` حوالي 2370 يصير `printTimeForm`، والاستيراد في السطر 45، وموضع رسم `DayMatrixPrint`)
- تعديل: `app/hr-offline.html:383-410` و`app/hr-cloud.html` (الكتلة نفسها)

**الواجهات:**
- يستهلك: `timeFormData` و`timeFormKind`.
- ينتج: `printTimeForm(): void`، والصنفان `printing-timeform` على body و`timeform-print-only` على القالب.

- [ ] **الخطوة 1: `TimeFormPrint`:**
  - العنوان «أستمارة ضبط الوقت شعبة تبريد المركز»، أو عنوان العقود (القسم 3)، وتحته الشهر والسنة.
  - رأس الجدول في `<thead>`، و`<tbody>` لكل موظف يضمّ صفّيه.
  - بلا مفتاح رموز. وفي أسفل الورقة خانتا «منظّم الاستمارة» و«مسؤول الشعبة» بلا أسماء.
  - بلا توقيع النظام. والطباعة بالأسود إلا لون الصف الثاني.
- [ ] **الخطوة 2: `printTimeForm`** بنمط `printDayMatrix` نفسه: يُحقن `@page { size: A4 landscape }` ثم يُزال. وكتلة CSS في القالبين تُعاد تسميتها إلى `printing-timeform` و`timeform-print-only`، وتُضاف إليها `thead { display: table-header-group }` و`tbody { break-inside: avoid; page-break-inside: avoid }`. ويُضاف `-webkit-print-color-adjust: exact` على الصف الثاني ليُطبع لونه.
- [ ] **الخطوة 3:** زر «🖨️ طباعة الاستمارة» يحلّ محل «طباعة المصفوفة». واحذف `DayMatrixPrint.jsx`.
- [ ] **الخطوة 4: البوابة** (الالتزام: «Print the time-control form on landscape A4 with repeating headers»).

### المهمة 8: تصدير Excel، والإصدار، والدليل

**الملفات:**
- تعديل: `app/src/app/StaffSystem.jsx` (دالة جديدة بجانب `exportPeriodReportExcel`)
- تعديل: `TimeFormView.jsx` (زر التصدير)
- تعديل: كل ملف فيه `v9.5`، وهي: `StaffSystem.jsx`، و`editions/*/AuthViews.jsx`، و`features/auth/WelcomeSplash.jsx`، و`hr-offline.html`، و`hr-cloud.html`
- تعديل: الدليل الشامل (قسم جديد للاستمارة)

**الواجهات:**
- ينتج: `exportTimeFormExcel(): Promise<void>`.

- [ ] **الخطوة 1: `exportTimeFormExcel`** تحمّل XLSX عبر `ensureLibs` ثم تبني الورقة بـ`aoa_to_sheet`:
  - صف العنوان، ثم صف الشهر، ثم رأس الأعمدة، ثم صفّان لكل موظف.
  - `ws['!merges']` يدمج الأعمدة 0–3 والعمود الأخير عمودياً على صفّي كل موظف.
  - اسم الملف `استمارة_ضبط_الوقت_<الملاك|العقود>_<YYYY-MM>.xlsx`.
- [ ] **الخطوة 2:** ارفع الإصدار إلى `v9.6` في كل المواضع (`grep -rn "v9\.5" src hr-*.html`: لا ناتج بعد التعديل).
- [ ] **الخطوة 3:** في الدليل الشامل قسم «استمارة ضبط الوقت»: من تشمل كل استمارة، والرموز، والجمعة والسبت، والمناوبون، والتنبيهات.
- [ ] **الخطوة 4: البوابة** (الالتزام: «Export the time-control form to Excel and bump the version to v9.6»).

**نهاية المرحلة 2:** قائمة تجربة لأسامة: محورا المراجعة 1 و2، وشهر شباط، وموظف عقد، ومناوب نهر بن عمر، وطباعة صفحتين أو أكثر. والرفع بموافقته.

---

## المرحلة 3: دليل الرموز

### المهمة 9: تطبيق التعديلات على جدول الرموز والتحقق منها

**الملفات:**
- تعديل: `app/src/domain/timeForm.ts`

**الواجهات:**
- ينتج:
  ```ts
  export const linkedStatusesOf = (id: string): string[];      // حالات النظام المربوطة بالرمز (من STATUS_TO_CODE_ID وقاعدة R/Y وC)
  export const validateCodeEdit = (table: ResolvedCodeTable, edit: { id?: string; letter: string; meaning: string }, reservedStatuses: string[]): string | null; // رسالة الخطأ أو null
  ```

- [ ] **الخطوة 1: `resolveCodeTable(edits)`** يطبّق `overrides` على الرسمي (الحرف والمعنى المعروض)، ويُسقط `removed`، ثم يُلحق `custom`. ويُبنى `extraByMeaning` من `custom` ومن الرسمية التي معرّفها في `activated` (بمعناها بعد التعديل). مثال ذلك تفعيل U «أيام التفرغ».
- [ ] **الخطوة 2: `validateCodeEdit`** يرفض:
  - الحرف الفارغ، أو الأطول من خانتين.
  - الحرف المستعمل لرمز آخر.
  - في الرمز المضاف: المعنى الفارغ، أو المعنى الذي يطابق حالة في `reservedStatuses` أو معنى رمز مضاف آخر (محور المراجعة 4).
- [ ] **الخطوة 3: البوابة** (الالتزام: «Apply user edits to the time-form code table and validate them»).

### المهمة 10: حفظ التعديلات ومزامنتها

**الملفات:**
- تعديل: `app/src/app/StaffSystem.jsx` (حالة جديدة بجانب `hourlyLeaveTimings` حوالي 234، والحفظ حوالي 520، والاستعادة حوالي 2015، وكل حزمة تُبنى يدوياً)
- تعديل: `app/src/data/offline/useOfflineDataLayer.js` و`app/src/data/cloud/useCloudDataLayer.js`
- تعديل: `app/src/data/types.ts`، و`app/src/domain/merge.ts` (بجانب `officialHolidaysList` في السطر 233)

**الواجهات:**
- ينتج: `timeFormCodeEdits: TimeFormCodeEdits` و`updateTimeFormCodeEdits(next: TimeFormCodeEdits): void` (يحفظ محلياً ويبثّ). ومفتاح التخزين ومفتاح الحزمة كلاهما `timeFormCodeEdits`.

- [ ] **الخطوة 1:** الحالة تُقرأ من `safeStorage`، والقيمة الافتراضية `{ overrides: {}, removed: [], custom: [], activated: [] }`. و`updateTimeFormCodeEdits` يكتب ويبثّ بنمط `toggleOfficialHolidayDate` (السطر 298).
- [ ] **الخطوة 2: المزامنة:** في كل موضع يُبنى فيه كائن حزمة فيه `hourlyLeaveTimings:`، يُضاف `timeFormCodeEdits` بجانبه. اعثر على المواضع بالأمر `grep -n "hourlyLeaveTimings" src/app/StaffSystem.jsx src/data/*/*.js`، ومنها `buildCloudBundle` في الطبقة السحابية. ثم:
  - يُضاف المفتاح إلى `CLOUD_SIGNATURE_KEYS`.
  - يُضاف إلى تطبيق الحزمة الواردة في الطبقتين (بجانب `officialHolidaysList` عند 931 و1688)، وإلى الاستعادة في `StaffSystem` (حوالي 2015).
  - يُضاف إلى اعتماديات الحفظ التلقائي (1048 و1811)، وإلى `deps` الطبقتين.
  - حزمة أقدم بلا المفتاح **لا تمحو** التعديلات المحلية (محور المراجعة 5).
- [ ] **الخطوة 3: الدمج من ملف JSON** (`merge.ts`): تعديلات الجهاز تغلب. والرموز المضافة في الملف تُضاف إن لم يكن معرّفها ولا حرفها لدى الجهاز.
- [ ] **الخطوة 4:** `timeFormData` تستعمل `resolveCodeTable(timeFormCodeEdits)`، وتُضاف إلى اعتمادياتها.
- [ ] **الخطوة 5: البوابة،** ومعها `grep -c "firebaseio\|identitytoolkit\|AIza" dist/offline/hr-offline.html` = 0 (الالتزام: «Store and sync the time-form code edits like the official holidays»).

### المهمة 11: نافذة دليل الرموز، والرموز في الموقف اليومي

**الملفات:**
- إنشاء: `app/src/features/units/CodesGuideModal.jsx`
- تعديل: `app/src/features/units/UnitsScreen.jsx:11-34` (`DAILY_STATUS_GROUPS`) و`TimeFormView.jsx` (الزر)
- تعديل: `app/src/app/StaffSystem.jsx` (الحالة `showCodesGuide`، وموضع رسم النافذة بجانب `HolidaysModal` في السطر 4866)
- تعديل: الدليل الشامل، و`نظام_ادارة_الملاك_دليل_الصلاحيات_وحسابات_المستخدمين.md`، وكل ملف فيه الإصدار

**الواجهات:**
- يستهلك: `resolveCodeTable` و`linkedStatusesOf` و`validateCodeEdit` (المهمة 9)، و`timeFormCodeEdits` و`updateTimeFormCodeEdits` (المهمة 10).
- ينتج: `countCodeUsage(meaning: string): number` في `StaffSystem`، وتعدّ الأيام في `dailyStatusOverrides` التي قيمتها هذا المعنى.

- [ ] **الخطوة 1: `CodesGuideModal`:** جدول كل الرموز (الحرف، والمعنى، وحالات النظام المربوطة)، وفيه إضافة رمز، وتعديل الحرف أو المعنى. ويُحذف الرمز وفق قواعد 4.4:
  - المربوط لا يُحذف.
  - المضاف يُحذف إن كان `countCodeUsage` صفراً، وإلا ظهرت رسالة بعدد الأيام التي تحمله.
  - معنى المضاف يُقفل بعد أول استعمال.

  وأمام كل رمز رسمي بلا حالة زر «استعماله حالةً يومية» (يضيف معرّفه إلى `activated`)، ويُلغى بقاعدة حذف المضاف: إن كان `countCodeUsage` صفراً. ومعنى الرمز المفعَّل يُقفل بعد أول استعمال. وفيه «استعادة الافتراضي» لكل رمز رسمي. ونمط النافذة نمط النوافذ القائمة (`max-h-[92vh]` مع تمرير، والإغلاق بـEsc).
- [ ] **الخطوة 2: التعديل والقراءة:** يعدّل الدليل من يعدّل العطل الرسمية. فإن كان `lockedSections['dailyReport']` بيد مستخدم آخر تُعطَّل أزرار التعديل وتبقى القراءة. و`reservedStatuses` لـ`validateCodeEdit` = كل قيم `DAILY_STATUS_GROUPS` و`PERIOD_TYPES` ومفاتيح `STATUS_TO_CODE_ID`.
- [ ] **الخطوة 3: الموقف اليومي:** تُلحق بـ`DAILY_STATUS_GROUPS` عند الرسم مجموعة «رموز أخرى» من قيم `extraByMeaning`، إن وُجد فيها شيء. والقيمة المخزَّنة هي المعنى. ولونها صنف موجود في قائمة الوضع الليلي.
- [ ] **الخطوة 4:** زر «📖 دليل الرموز» في شريط الاستمارة. وارفع الإصدار إلى `v9.7`، وحدّث الدليلين (القسم 4.4 من المواصفة، ومن يعدّل الدليل).
- [ ] **الخطوة 5: البوابة** (الالتزام: «Add the editable codes guide; added codes become daily statuses»).

**نهاية المرحلة 3:** قائمة تجربة لأسامة: إضافة W «أيام الوفاة» وتفعيل U «أيام التفرغ»، وتسجيلهما ليوم ثم ظهورهما في الاستمارة، ومحاولة حذفهما أو إلغاء تفعيلهما بعد ذلك، وتغيير حرف L، ومحور المراجعة 4. ومحور المراجعة 5 على جهازين في النسخة السحابية. ثم الرفع بموافقته، وبعده الجواب عن السؤال المؤجل (المواصفة 11).
