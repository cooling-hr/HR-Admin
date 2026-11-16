# ترشيح المناوبين ونوع الدوام المؤرَّخ — خطة التنفيذ

> **للمنفّذ:** المهارة المطلوبة: `superpowers:subagent-driven-development` أو `superpowers:executing-plans`. الخطوات بصيغة `- [ ]`. اقرأ الوثيقة قبل أي مهمة.

**الهدف:** يُرشَّح مناوبو الفترة القادمة مسبقاً من تبويب الملاك، ويُوزَّعون على الوجبات عند اقتراب البداية، ويُجدَّد لبعض الحاليين ويعود الباقون صباحيين، دون أن يتغير موقف أي يوم مضى.

**المعمارية:** حقل `workHistory` في سجل الموظف (نقاط تغيير مؤرَّخة لنوع الدوام والوجبة ونوع المناوبة)، وملف `domain/workHistory.ts` بلا React يعطي «حالته في تاريخ كذا». الحسابات المرتبطة بتاريخ تقرأ منه؛ الشاشات بلا تاريخ تقرأ نسخة «اليوم» مشتقة في الذاكرة؛ والترشيح والتوزيع نافذتان جديدتان في `features/shifts/`.

**التقنية:** React 18 وVite وTypeScript للمنطق (`domain/*.ts`) وTailwind 3.4.17 وقت البناء. لا مكتبة جديدة.

**الوثيقة:** `docs/superpowers/specs/2026-11-16-shift-nomination-design.md`

## القيود العامة (تسري على كل مهمة)
- لا اختبارات آلية ولا `scratch/run_suite.sh` (قرار أسامة 2026-09-16، CLAUDE.md). التحقق في كل مهمة: `cd app && npm run typecheck && npm run build`، ثم فحوص ما بعد النقل في CLAUDE.md حين تمس المهمة `StaffSystem.jsx` أو `features/*/*.jsx`: `tsc --checkJs` بحثاً عن TS2304 وTS2552 وTS18004، و`node scripts/compare-ui-strings.mjs <dist> --against .baseline/<edition>.txt` (النقص عطل؛ الزيادة مقبولة)، و`node scripts/check-authviews.mjs` لو لُمس AuthViews. ثم مراجعة Codex (وAntigravity لما يخص الواجهة) على كل التزام.
- بعد كل تعديل: `cd app && npm run build && python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud`.
- التزامات صغيرة بلا سطر `Co-Authored-By` (قرار 2026-09-17). لا `git push` إلا بطلب أسامة الصريح في المحادثة.
- `emp.workType` و`emp.squad` لا يُحذفان. التواريخ `YYYY-MM-DD` وبـ`localDateStr()` لا `toISOString()`.
- كل نص جديد يذكر الشعبة أو وحدة أو موقعاً يُكتب من `org` (`org.terms` وغيره)، لا حرفياً. وأسماء أعمدة Excel (`'الشعبة'` و`'القسم'` و`'الموقع'`) لا تتغير.
- اسم صنف Tailwind يُكتب كاملاً. لون جديد غير مستعمل من قبل يُضاف إلى قائمة الوضع الليلي في `app/hr-offline.html` و`hr-cloud.html` أو يُستعمل لون موجود.
- النوافذ تستعمل نمط التمرير الآمن (`max-height` وتمرير) ونافذة جديدة تُركَّب داخل `main` بنفس ترتيب DOM لنوافذ المشروع (لا غلاف متحرك واحد يحجز الباقي).
- `StaffSystem.jsx` لا يستورد طبقة بيانات. الحالة تبقى فيه، والمكوّن الجديد `({ ctx }) => {...}` و**أي اسم جديد يضاف إلى تفكيكه وإلى `ctx` عند الاستدعاء معاً**.
- التوقيع «إعداد المهندس أسامة خليل هاشم» موجود أصلاً في الواجهة؛ لا تغيير.
- ترتيب الحقول: **كل حساب يقرأ نوع الدوام أو الوجبة بتاريخ معيّن يقرأها من `employeeOn(emp, date)` أو `workOn`**، لا من `emp.workType` مباشرة (يُكتب هذا في CLAUDE.md في المهمة 8).

## مراجعة النقاط الخمس الأخطر (تُدرج في طلب المراجعة، وتُجرَّب يدوياً على نسخة سطح المكتب)
1. **الاستيراد من Excel والدمج يمسحان السجل:** كائن الموظف في الاستيراد (`StaffSystem.jsx` نحو 3418–3450) يُبنى حقلاً حقلاً ويحمل `statusPeriods` من الموجود صراحةً؛ فإن لم يحمل `workHistory` بالطريقة نفسها فكل استيراد يمحو الترشيحات والتواريخ بصمت. وكذلك تطبيق الدمج.
2. **حدّ النقطة:** من بلغ `until` يعود صباحياً في اليوم التالي له، وأيام ما قبل `until` تبقى مناوبة؛ ومن `from` المرشح قبل بدايته صباحي في كل الحسابات (الموقف، الماء، الإضافي، ضبط الوقت).
3. **مرشح بلا وجبة بعد بدء الفترة:** يظهر «مناوب (الوجبة غير محددة)» ولا ينهار جدول الإطعام ولا كشف الوجبات، ويبقى التنبيه.
4. **امتداد إجازة المناوب** (`getShiftLeaveCarry`) عبر نقطة تغيير: إجازة تمتد إلى ما بعد عودته صباحياً لا تُنتج أيام استراحة مناوبة بعد التاريخ.
5. **تعديل يدوي «اعتباراً من»:** يغيّر ما بعد التاريخ وحده، ولا يغيّر مواقف يوم قبله؛ ولا ينشئ نقطتين بالتاريخ نفسه (الثانية تحل محل الأولى).

---

### المهمة 1: المنطق المؤرَّخ `domain/workHistory.ts` (بلا أثر ظاهر)

**الملفات:**
- إنشاء: `app/src/domain/workHistory.ts`
- تعديل: `app/src/domain/types.ts` (نوع النقطة وحقل `workHistory?` في `Employee`)

**الواجهات (تُستعمل في المهام اللاحقة بهذه الأسماء حرفياً):**
```ts
export type ShiftKind = '24h' | '12h';
export interface WorkPoint { from: string; workType: 'صباحي' | 'مناوب'; squad: string; shiftKind?: ShiftKind; until?: string }
export interface WorkState { workType: string; squad: string; shiftKind?: ShiftKind }
export const NOMINATION_ALERT_DAYS = 7;
export const workOn = (emp: Employee, date: string): WorkState
export const employeeOn = (emp: Employee, date: string): Employee
export const isThreeShiftOn = (emp: Employee, date: string): boolean
export const nominate = (emp: Employee, p: { start: string; until: string; shiftKind: ShiftKind }): Employee
export const cancelNomination = (emp: Employee, start: string): Employee
export const assignSquad = (emp: Employee, start: string, squad: string): Employee
export const renewShift = (emp: Employee, p: { start: string; until: string; squad: string; shiftKind?: ShiftKind }): Employee
export const returnToMorning = (emp: Employee, start: string): Employee
export const setWorkFrom = (emp: Employee, from: string, patch: { workType?: string; squad?: string; shiftKind?: ShiftKind; until?: string }): Employee
export interface NominationCycle { start: string; until: string; nominees: Employee[]; outgoing: Employee[] }
export const pendingNominations = (staff: Employee[], today: string): NominationCycle[]
```

- [ ] **الخطوة 1:** عرّف الأنواع في `types.ts` (`WorkPoint` و`workHistory?: WorkPoint[]`) والتصديرات أعلاه في `workHistory.ts` مع تعليق عربي مختصر لكل دالة.
- [ ] **الخطوة 2: `workOn`.** النقاط مرتبة بـ`from` (`''` أقدم من كل تاريخ). تختار آخر نقطة `from <= date`. إن كانت `until` وتجاوزها التاريخ (`date > until`) فالنتيجة `{ workType:'صباحي', squad:'' }`. بلا سجل أو بلا نقطة منطبقة: `{ workType: emp.workType||'', squad: emp.squad||'', shiftKind: undefined }`.
- [ ] **الخطوة 3: `employeeOn`** ترجع `emp` نفسه (المرجع نفسه) إن لم يكن لها `workHistory` أو كانت النتيجة مطابقة لحقليه؛ وإلا نسخة `{...emp, workType, squad, shiftKind}`. **`isThreeShiftOn`:** `shiftKind==='24h'` إن وُجد، و`'12h'` يعني ثنائية، وإلا `!!(emp.location && emp.location.includes('نهر بن عمر'))` كما في الكود اليوم، وتُستدعى بعد `workOn`.
- [ ] **الخطوة 4: دوال التحرير** كلها تُرجع نسخة جديدة وتحفظ ترتيب النقاط ولا تنشئ نقطتين بالتاريخ نفسه (الأحدث تحل محل الأقدم):
  - `nominate`: يضيف `{from:''}` بحقليه الحاليين إن لم يكن له سجل، ثم `{from:start, workType:'مناوب', squad:'', shiftKind, until}`. يرفض (يُرجع `emp` كما هو) من كان مناوباً في `start`.
  - `cancelNomination`: يحذف نقطة `from===start` وحدها إن كانت `squad===''`.
  - `assignSquad`: يضبط `squad` في نقطة `from===start`.
  - `renewShift`: نقطة `{from:start, workType:'مناوب', squad, shiftKind, until}`.
  - `returnToMorning`: نقطة `{from:start, workType:'صباحي', squad:''}`.
  - `setWorkFrom`: نقطة بتاريخ `from` تدمج `patch` فوق حالته وقتها (`workOn(emp, from)`).
- [ ] **الخطوة 5: `pendingNominations(staff, today)`:** تجمع المرشحين (لهم نقطة `workType:'مناوب'` و`squad:''` وتاريخ بدايتها `from`) في دورات حسب زوج (`from`,`until`)، وتُرجع الدورة إن `from <= today + NOMINATION_ALERT_DAYS` ولم تُوزَّع كل وجباتها. `outgoing`: من كان `workOn(emp, يوم قبل from).workType==='مناوب'` من وحدات المرشحين ولم تُسجَّل له نقطة بتاريخ `from`. الترتيب بالأقدم أولاً.
- [ ] **الخطوة 6: التحقق:** `cd app && npm run typecheck` يمرّ بلا أخطاء.
- [ ] **الخطوة 7: الالتزام** `Add dated work history domain (no UI change yet)`، ثم مراجعة Codex.

---

### المهمة 2: قراءة نوع الدوام والوجبة بالتاريخ في حسابات `StaffSystem.jsx` (محايدة حتى يوجد سجل)

**الملفات:** تعديل `app/src/app/StaffSystem.jsx`، و`app/src/features/units/DutyMealsScreen.jsx`، و`app/src/domain/dutyMeals.ts`، و`app/src/features/units/UnitsScreen.jsx` (حيث يُقرأ نوع الموظف في تاريخ).

**الواجهات:** يستهلك `employeeOn` و`isThreeShiftOn` من المهمة 1. ينتج: كل دالة تاريخية تقرأ حالة الموظف بتاريخها.

- [ ] **الخطوة 1:** استورد `employeeOn` و`isThreeShiftOn`. في أول `getEmployeeDefaultNaturalStatus` (نحو 950) و`getShiftCycleStatus` (975) و`getShiftLeaveCarry` (1014) و`getEmployeeDailyStatus` (نحو 1030–1100) و`getEmployeeDailyStatus`-المرتبطة بـ`workType` في 1279 و1529–1561 (تطبيق الحالة على الوحدة) استبدل `emp` بـ`const e = employeeOn(emp, dateStr)` وبدّل القراءات `emp.workType`/`emp.squad` بـ`e.`، وشرط `location.includes('نهر بن عمر')` في 977 و1019 بـ`isThreeShiftOn(emp, dateStr)`.
- [ ] **الخطوة 2:** مرشّحات الموقف اليومي بنوع المناوبة (نحو 1172–1199 `getAutoWaterAttendanceDays` و`getWaterGroupSummary`): القراءة بـ`employeeOn(s, firstDayOfMonth)` و`isThreeShiftOn(s, firstDayOfMonth)` حيث `firstDayOfMonth = monthStr + '-01'` (قرار أسامة: الدخول من الشهر التالي). `getAutoWaterAttendanceDays` تحسب أيام الدوام بـ`getEmployeeDefaultNaturalStatus` لكل يوم فتبقى صحيحة.
- [ ] **الخطوة 3:** تقرير الفترة (نحو 1782 و1864 `item.employee.workType`) وتصدير الموقف اليومي (نحو 1981–2040) وكل موضع يعالج `workType` مع تاريخ يومه: القراءة بـ`employeeOn(emp, dateStr)`. أما فلتر نوع الدوام في تقرير الفترة (1720) فيقرأ نوعه في `periodEndDate` (قراري؛ السطر بلا تاريخ يوم).
- [ ] **الخطوة 4:** `dutyMeals.siteSquadMembers(staff, unit, squad)` يأخذ تاريخاً: توقيعه `siteSquadMembers(staff: Emp[], unit: string, squad: string, date: string): Emp[]` ويقرأ `employeeOn`؛ و`buildDutyMealDay` يمرر تاريخ اليوم الذي يرسمه، و`DutyMealsScreen` يمرر تاريخه حيث يستدعي `siteSquadMembers` لقائمة اختيار المخولين (تاريخ اليوم).
- [ ] **الخطوة 5:** لا تغيير في ما لا يملك تاريخاً (المهمة 3).
- [ ] **الخطوة 6: التحقق:** typecheck + build + `tsc --checkJs` على `StaffSystem.jsx` و`features/*/*.jsx` + `compare-ui-strings` لكلتا النسختين (النتيجة: لا نقص). السلوك متطابق مع السابق لأن لا موظف له `workHistory` بعد.
- [ ] **الخطوة 7:** نسخة سطح المكتب، ثم **أسامة أو أنا نفتح الموقف اليومي لتاريخ اعتيادي ونقارن بنسخة الإنتاج** (بلا فرق). الالتزام `Read work type and squad by date in time calculations`، ثم Codex.

---

### المهمة 3: نسخة «اليوم» المشتقة للشاشات بلا تاريخ، وكشف الوجبات بتاريخ بداية الفترة

**الملفات:** تعديل `StaffSystem.jsx` (حول 825 و730 وحول تركيب `ctx` للشاشات)، `features/shifts/SquadScheduleModal.jsx`، `features/staffList/StaffListScreen.jsx`.

**الواجهات:** ينتج `staffToday: Employee[]` في `StaffSystem`.

- [ ] **الخطوة 1:** في `StaffSystem.jsx` أضف `const todayStr = localDateStr()` (يتجدد بالتبويب/اليوم كما تفعل بقية الواجهة؛ إن وُجد متغير اليوم الحالي فاستعمله) و`const staffToday = useMemo(() => staff.map(s => employeeOn(s, todayStr)), [staff, todayStr])`.
- [ ] **الخطوة 2:** مرِّر `staff: staffToday` و`staffRaw: staff` في `ctx` للشاشات والنوافذ القارئة وحدها: `DashboardScreen` و`StaffListScreen` و`UnitsScreen` و`EmployeeCardModal` و`DutyMealsScreen`؛ و**في `StaffListScreen.jsx` نحو السطر 706 (`setStaff(staff.filter(...))`) اقرأ `staffRaw`** لئلا تُكتب قيم مشتقة في السجل. تحقق بـ`Grep` أن هذه المكوّنات لا تكتب `staff` في موضع آخر.
- [ ] **الخطوة 3:** العدادات والتصدير داخل `StaffSystem.jsx` (نحو 2922–2933 و3030–3061 و3092–3093 و4432–4436 و4530–4531 و1934 و2039) تقرأ `staffToday` بدل `staff`.
- [ ] **الخطوة 4:** `squadRosters` (نحو 825) يأخذ `periodStartDate`: يبني من `employeeOn(s, periodStartDate)` ويستعمل `isThreeShiftOn`؛ وتُضاف `periodStartDate` إلى مصفوفة اعتماد `useMemo`. (تُمرَّر للنافذة أصلاً.)
- [ ] **الخطوة 5:** `openEditModal(emp)` يفتح **السجل الخام**: `staff.find(s => s.id === emp.id) || emp`. (نافذة التعديل تحرر الخام لا المشتق.)
- [ ] **الخطوة 6: التحقق** كالمهمة 2. الالتزام `Derive today's work type for read-only screens`، ثم Codex.

---

### المهمة 4: ترشيح المناوبين (الزر والنافذة)

**الملفات:**
- إنشاء: `app/src/features/shifts/NominateShiftModal.jsx`
- تعديل: `app/src/features/units/UnitsScreen.jsx` (عمود ملاك الوحدة نحو 1158–1182، ونتائج البحث نحو 982–989)، و`StaffSystem.jsx` (الحالة والمعالج وتركيب النافذة وتمرير `ctx`).

**الواجهات:** يستهلك `nominate` و`cancelNomination` و`pendingNominations`. ينتج في `StaffSystem`: `nominateEmployees(ids: string[], p: { start: string; until: string; shiftKind: ShiftKind }): void` و`cancelNominationFor(id: string, start: string): void` وكلتاهما تكتبان `staff` المحفوظ (`setStaff` ثم `pushDataToCloud` كما في `saveEmployeeEdit`) وتشترطان `canEdit('staffMaster')`.

- [ ] **الخطوة 1:** في صف كل **صباحي** بجدول ملاك الوحدة وفي نتائج البحث زر «🎯 ترشيح للمناوبة» بجانب «➕ إضافة»، وللمرشح شارة «مرشح من {from}» ينقر عليها لإلغاء الترشيح (قبل البداية فقط). الزر في كل الوحدات. (يُقرأ نوعه من `employeeOn` أي من `staff` المشتقة.)
- [ ] **الخطوة 2: النافذة** `NominateShiftModal({ ctx })`: تاريخ البداية، والمدة (6 أشهر / 3 أشهر / تاريخ نهاية يدوي → يحسب `until` بدقة التقويم الميلادي، يوم قبل الذكرى)، ونوع المناوبة لكل مرشح (افتراضياً `isTripleShiftSite(unit)` أي ثلاثية `24h` أو ثنائية `12h`)، وقائمة المرشحين بالاسم. إن وُجدت دورة مفتوحة (`pendingNominations`) فاقترح تاريخيها افتراضياً.
- [ ] **الخطوة 3:** المعالجان أعلاه يستدعيان `nominate`/`cancelNomination` لكل معرّف. شريط أعلى ملاك الوحدات يعرض «🎯 ترشيح المناوبين: N مرشحاً للفترة من … إلى …» وزراً لتعديل تاريخي الدورة (يستدعي `setWorkFrom` لكل مرشح فيها بنقطته نفسها) ولإلغاء الجميع.
- [ ] **الخطوة 4: التحقق** typecheck + build + فحوص النقل. جرّب على نسخة سطح المكتب ببيانات تجريبية: رشّح اثنين لشهر قادم؛ تأكد أن الموقف اليومي لأي يوم قبل البداية لم يتغير، وأن العداد في الرئيسية لم يتغير، وأن الإلغاء يعيدهما كما كانا.
- [ ] **الخطوة 5:** الالتزام `Nominate shift workers in advance from the roster tab`، ثم Codex وAntigravity.

---

### المهمة 5: تنبيه تبويب «الوحدات والموقف» ونافذة التوزيع والتجديد

**الملفات:**
- إنشاء: `app/src/features/shifts/ShiftAssignmentModal.jsx`
- تعديل: `UnitsScreen.jsx` (شريط التنبيه أعلى الشاشة قبل فروع `unitsSubView` عند السطر 103)، و`StaffSystem.jsx`.

**الواجهات:** يستهلك `pendingNominations(staffRaw, todayStr)` و`assignSquad` و`renewShift` و`returnToMorning`. ينتج `applyShiftAssignments(changes: Array<{ id: string; action: 'squad' | 'renew' | 'morning'; squad?: string; start: string; until?: string; shiftKind?: ShiftKind }>): void` (حفظ واحد مجمَّع كالمهمة 4).

- [ ] **الخطوة 1:** شريط أحمر/كهرماني أعلى `UnitsScreen` في كل شاشاته الفرعية حين تعيد `pendingNominations` دورة: «🎯 N مرشحاً ينتظرون توزيعهم على الوجبات (تبدأ الفترة {start})» وزر «توزيع وقرارات».
- [ ] **الخطوة 2: النافذة** `ShiftAssignmentModal`: لكل وحدة فيها مرشحون: **المرشحون** وأمام كل اسم قائمة الوجبة (A–D)؛ و**المناوبون الحاليون** (`cycle.outgoing` في تلك الوحدة) وأمام كل اسم «يُجدَّد له» (مع وجبته المقترحة = وجبته الحالية وقائمة لتغييرها، و`until` الدورة الجديدة) أو «يعود صباحياً»، بلا اختيار افتراضي. «حفظ» لا يُفعَّل إلا بقرار لكل من في القائمة أو بترك من لم يُقرَّر له (فيعود صباحياً بنهاية `until` الحقيقية، وتُعرض ملاحظة بذلك). الحفظ يستدعي `applyShiftAssignments`.
- [ ] **الخطوة 3:** بعد التوزيع يزول التنبيه (انتفاء `squad===''`). تحقق أن مرشحاً بلا وجبة بعد بدء الفترة يظهر «مناوب (الوجبة غير محددة)» والتنبيه باقٍ (النقطة 3 من المراجعة).
- [ ] **الخطوة 4: التحقق** كالمهمة 4 + تجربة: وزّع المرشحين وجدّد لواحد وأعد واحداً صباحياً في تاريخ بداية قريب ثم افتح الموقف اليومي لتاريخ قبل البداية ولتاريخ بعده، والماء لشهر البداية وللشهر التالي، وجدول الإطعام، وكشف الوجبات.
- [ ] **الخطوة 5:** الالتزام `Alert and assignment dialog for pending shift nominations`، ثم Codex وAntigravity.

---

### المهمة 6: «اعتباراً من» في نافذة تعديل الموظف وعرض السجل

**الملفات:** تعديل `features/employees/EditEmployeeModal.jsx` (نحو 100–125) و`StaffSystem.jsx` (`updateEditField` نحو 3955 و`saveEmployeeEdit` نحو 3793).

**الواجهات:** يستهلك `setWorkFrom`. ينتج في `ctx` للنافذة: `editWorkFrom: string` و`setEditWorkFrom(date: string): void`.

- [ ] **الخطوة 1:** عند تغيير `workType` أو `squad` (أو نوع المناوبة `shiftKind` أو `until` الجديدين) في الموظف **المحفوظ مسبقاً** (لا الجديد) يظهر حقل «اعتباراً من» (افتراضياً اليوم). `updateEditField` لهذه الحقول يحدّث نسخة التحرير بـ`setWorkFrom(editingEmployee, editWorkFrom, {...})` بدل تغيير الحقل الخام وحده؛ وتبقى الحقول الخام `workType`/`squad` في نسخة التحرير مطابقة لحالة اليوم (`workOn(…, today)`) لتبقى بقية النافذة صحيحة.
- [ ] **الخطوة 2:** حقل `shiftKind` (اختياري «حسب الموقع/ثلاثية/ثنائية») و`until` يظهران للمناوب فقط.
- [ ] **الخطوة 3:** عرض مختصر للسجل للقراءة في النافذة: «صباحي حتى …، مناوب (C، ثنائية) من … إلى …».
- [ ] **الخطوة 4:** الموظف الجديد (إضافة) يُحفظ بلا `workHistory` كما اليوم. `saveEmployeeEdit` يحفظ `workHistory` ضمن `employeeToSave` (ينتقل بالنسخ ولا يحتاج سطراً خاصاً)، مع تحقق: لا نقطتان بتاريخ واحد.
- [ ] **الخطوة 5: التحقق** typecheck + build + فحوص. جرّب: غيّر وجبة موظف «اعتباراً من» يوم في منتصف الشهر؛ تأكد أن ما قبل اليوم لم يتغير في الموقف اليومي.
- [ ] **الخطوة 6:** الالتزام `Effective-from date when changing work type or squad`، ثم Codex وAntigravity.

---

### المهمة 7: الاستيراد والدمج والمزامنة تحفظ السجل

**الملفات:** تعديل `StaffSystem.jsx` (الاستيراد نحو 3360–3450)، و`domain/merge.ts`، وطبقتي البيانات إن لزم.

- [ ] **الخطوة 1: الاستيراد من Excel:** كائن الموظف الناتج (نحو 3418–3450) يحمل `workHistory: existingEmp ? existingEmp.workHistory : undefined` كما يحمل `statusPeriods`. وإن اختلف `طبيعة العمل` أو `الوجبة` المستورد عن حالة اليوم لموظف له سجل، تُضاف نقطة `setWorkFrom(existing, اليوم, {...})` ولا يُكتب الحقلان وحدهما (فلا يتجاهلهما السجل).
- [ ] **الخطوة 2: الدمج:** أضف `workHistory: 'سجل طبيعة العمل'` إلى `FIELD_NAMES_AR` في `merge.ts`، وعامله حقلاً **منظَّماً** يُقارن بنصّ JSON مرتَّب ويُطبَّق كما هو (كالحقول المكتوبة بنوعها في `TYPED_MERGE_FIELDS`؛ أضف نوع `'json'` أو معالجة خاصة دون كسر الأنواع الحالية)، ولا يُعرض `[object Object]` في معاينة الدمج.
- [ ] **الخطوة 3:** تحقق في `data/cloud/useCloudDataLayer.js` و`data/offline/useOfflineDataLayer.js` أن سجل الموظف يُحفظ ويُسترد كاملاً (لا قائمة بيضاء لحقوله)، وأن `CLOUD_SIGNATURE_KEYS` تغطي `staffData` فتتغير البصمة بتغيير السجل (لا إعداد مشترك جديد هنا).
- [ ] **الخطوة 4: التحقق** typecheck + build + فحوص. جرّب: رشّح موظفاً، صدّر Excel، استورده ثانية بالدمج؛ تأكد أن الترشيح باقٍ (النقطة 1 من المراجعة).
- [ ] **الخطوة 5:** الالتزام `Keep work history through Excel import and merge`، ثم Codex.

---

### المهمة 8: الإصدار والتوثيق

**الملفات:** تعديل `StaffSystem.jsx` (نص الإصدار عند 3539 و5156)، و`نظام_ادارة_الملاك_الدليل_الشامل_للقواعد.md`، و`CLAUDE.md` (المشروع)، و`app/.baseline/*.txt`.

- [ ] **الخطوة 1:** الإصدار `v9.8` → `v9.9` في الموضعين (وفي أي ملف يذكره: ابحث بـ`Grep "v9\.8"`).
- [ ] **الخطوة 2:** أضف إلى الدليل الشامل قسم «ترشيح المناوبين ونوع الدوام المؤرَّخ»: السجل، وقواعد التواريخ (`until` شاملة، التغيير يسري إلى الأمام)، والتنبيه (7 أيام)، والتجديد والعودة، وقراءة الماء من أول الشهر.
- [ ] **الخطوة 3:** أضف إلى `CLAUDE.md` سطرين: «كل حساب يقرأ نوع الدوام أو الوجبة بتاريخ معيّن يقرأها من `employeeOn`/`workOn` لا من `emp.workType`، وإلا عاد الخطأ الصامت»، و«الشاشات بلا تاريخ تقرأ `staffToday` ولا تكتب منه؛ الكتابة من `staff` الخام».
- [ ] **الخطوة 4:** بعد أن يجرّب أسامة ويوافق: حدّث `.baseline` (`compare-ui-strings.mjs` يوثّق الأوامر) قبل الرفع. الرفع نفسه بطلبه الصريح.
- [ ] **الخطوة 5:** الالتزام `Bump to v9.9 and document shift nomination`.

---

## مراجعة التغطية
كل بند في الوثيقة له مهمة: السجل (1)، القراءة بالتاريخ والماء من أول الشهر وكشف الوجبات (2، 3)، الترشيح والدورة المشتقة (4)، التنبيه في تبويب الوحدات والتوزيع والتجديد والعودة (5)، «اعتباراً من» وعرض السجل (6)، الاستيراد والدمج والمزامنة (7)، الإصدار والتوثيق (8). ونوع المناوبة المرن في 1 و4 و6، ونهاية الفترة الحقيقية في `workOn` (1). والغائب عمداً هو ما في قائمة «ليس في النسخة الأولى».
