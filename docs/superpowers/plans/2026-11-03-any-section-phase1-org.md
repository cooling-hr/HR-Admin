# النسخة المحلية العامة — المرحلة 1: استخراج إعدادات الشعبة (`org`)

> **للمنفّذ:** التنفيذ مهمةً مهمة بـ superpowers:executing-plans. الخطوات بصيغة `- [ ]`.

**الهدف:** كل ما يخص شعبة تبريد المركز في الكود يُقرأ من كائن `org` واحد، ونسختا التبريد تبقيان كما هما حرفاً بحرف في الشاشة والطباعة والتصدير.

**المعمارية:** `src/org/cooling.js` يحمل قيم شعبة التبريد. ملفا المدخل `editions/{offline,cloud}/App.jsx` وحدهما يستوردانه ويمرّرانه إلى `createStaffSystem({ useDataLayer, AuthViews, org })`. الجسم المشترك يضعه في `ctx` لكل مكوّن يحتاجه، ودوال `domain/` تأخذه معاملاً. لا ملف آخر يستورد `cooling.js`.

**التقنية:** React 18، Vite، TypeScript في `domain/`، Tailwind 3.4.17 وقت البناء.

**الوثيقة:** `docs/superpowers/specs/2026-11-01-any-section-local-edition-design.md` (معتمدة 2026-11-03). هذه الخطة للمرحلة 1 وحدها؛ المرحلتان 2 و3 بخطتين لاحقتين.

## قيود عامة
- لا تغيير ظاهر في نسختي التبريد: الشاشات، والطباعة، وملفات Excel وWord، ونص الواتساب، والترتيب.
- لا تغيير في البيانات المحفوظة ولا في مفاتيح الحفظ.
- **ملف `org` بامتداد `.js` لا `.ts`:** `tailwind.config.js` يمسح `./src/**/*.{js,jsx}` فقط، وأصناف `gradient` للبطاقات ستعيش فيه. تكتب كاملة (`from-blue-500 to-blue-600`).
- `StaffSystem.jsx` ومكوّنات `features/` ودوال `domain/` لا تستورد `src/org/cooling.js` أبداً.
- **أسماء أعمدة Excel والبيانات لا تتغير ولا تمر بـ `org`:** `'الشعبة'` و`'القسم'` و`'الموقع'` في الاستيراد والتصدير (StaffSystem 800 و3359 و3496 و4540 و4585 و4592، UnitsScreen 1100، Dashboard 450، `merge.ts` 17) أسماء حقول، والاستيراد يقرؤها.
- **خارج المرحلة 1 (المرحلة 2، نوع المناوبة):** كل شرط `includes('نهر بن عمر')` و`=== 'تبريد نهر بن عمر'`، و`isTripleShiftSite`، و`DOUBLE_DUTY_UNIT_ORDER` وفاصلا ورقة المناوبين (StaffSystem 4441–4492)، و«المناوبة الثلاثية (نهر بن عمر)» في `SquadScheduleModal.jsx`. تبقى كما هي.
- **خارج المرحلة 1 (المرحلة 3):** طبقتا البيانات (`'إداري الشعبة 1'` وما معه)، و`editions/cloud/AuthViews.jsx` (السحابية خاصة بالتبريد)، وقالبا `hr-*.html`.
- التعليقات لا تُعدَّل.
- لا اختبارات Playwright ولا البوابتان (قرار أسامة 2026-09-16). التحقق: البناء، و`typecheck`، و`tsc --checkJs` بالرموز الثلاثة، و`compare-ui-strings`، وفحص grep في المهمة 5، ومراجعة Codex لكل التزام، وتجربة أسامة.
- لا سطر Co-Authored-By. لا `git push` إلا بموافقة أسامة.

## شكل `org` (المهمة 1 تعرّفه، والباقي يستعمله)

```js
// src/org/cooling.js
export const coolingOrg = {
  ministry: 'وزارة النفط',
  company: 'شركة نفط البصرة',
  companyLegal: 'شركة نفط البصرة (شركة عامة)',
  department: 'قسم التكييف والتبريد',
  departmentShort: 'قسم التبريد',
  departmentBare: 'التكييف والتبريد',          // خانة القسم في جدول الوجبات
  section: 'شعبة تبريد المركز ومحطة عزل نهر بن عمر',
  sectionShort: 'شعبة تبريد المركز',            // عنوان استمارة ضبط الوقت
  terms: { the: 'الشعبة', forThe: 'للشعبة', whole: 'كلها' },
  units: [ /* بالترتيب: مقر الشعبة، تبريد باب الزبير، ورشة التبريد، تبريد المكينة، تبريد نهر بن عمر، تبريد المركز الثقافي */
    { name: 'مقر الشعبة', shortName: 'مقر الشعبة', tabLabel: '📍 مقر الشعبة', cardIcon: '🏢', cardGradient: 'from-blue-500 to-blue-600', isHeadquarters: true },
    // ... الخمس الباقية بقيمها الحالية من UnitsScreen.jsx 335–340 و1019–1024، وshortName = ناتج dutyMealSiteLabel اليوم
  ],
  locations: [ /* نهر بن عمر، باب الزبير، المركز الثقافي النفطي، المكينة — مع justification من StaffSystem 63–66 */ ],
  dutyMealSites: ['تبريد باب الزبير', 'تبريد المكينة', 'تبريد المركز الثقافي', 'تبريد نهر بن عمر'],
  shiftUnitOrder: ['تبريد نهر بن عمر', 'تبريد باب الزبير', 'تبريد المركز الثقافي', 'تبريد المكينة'],
  shiftViewLocationOrder: ['وحدة تبريد نهر بن عمر', 'وحدة تبريد باب الزبير', 'وحدة تبريد المركز الثقافي', 'وحدة تبريد المكينة', 'دار استراحة المشروع السكني'],
};
```

`shiftViewLocationOrder` يُنقل حرفياً من StaffSystem 3040 و3071. قيمه لا تطابق قيم `location` المحفوظة (`'نهر بن عمر'`...)، فترتيب «المناوبون» حسب الموقع لا يعمل اليوم. يُنقل كما هو ولا يُصلح في هذه المرحلة، ويُبلَّغ أسامة به ليقرر.

الأنواع والمساعدات في `src/domain/org.ts`:
- `interface Org`، `OrgUnit`، `OrgLocation`، `OrgTerms` بالحقول أعلاه.
- `unitNames(org: Org): string[]`
- `headquartersUnit(org: Org): string | undefined` — اسم الوحدة ذات `isHeadquarters`.
- `locationNames(org: Org): string[]`
- `locationJustification(org: Org, location: string): string | undefined`

## نقاط المراجعة (ما لا يكشفه البناء)
1. **حقل بإملاء خاطئ يطبع «undefined»:** `org.sectoin` لا يفشل به البناء ولا `tsc` في ملفات JSX، ويظهر «undefined» في عنوان مطبوع. `coolingOrg` يحمل `/** @type {import('../domain/org').Org} */` فتُفحص قيمه، أما المستعمِلون فيفحصهم Codex: كل `org.<حقل>` في الفرق معرّف في `interface Org`. ويُطلب ذلك منه صراحةً في كل مراجعة.
2. **أصناف Tailwind للبطاقات:** بعد المهمة 2، في `dist/offline/hr-offline.html` توجد `from-cyan-500` و`to-teal-600` (فحص grep). غيابها يعني بطاقات بلا لون.
3. **موظف بوحدة خارج القائمة** (نسخة احتياطية قديمة، أو وحدة كُتبت خطأً): يبقى آخر القائمة بترتيب الرقم الوظيفي كما في `sortByUnit` اليوم.
4. **`ensureTopTwo`** يبقى مطبَّقاً على «مقر الشعبة» وحده في الموقف اليومي الموحد وفي تصدير Excel (StaffSystem 2034 و3487).
5. **عناوين مركّبة من أجزاء** (`${org.company} - ${org.section}`): الفاصل والمسافات كما في النص القديم حرفاً. المرجع: قائمة «الناقص» في `compare-ui-strings`.

---

### المهمة 1: تحديث `.baseline`، وملف `org`، وتمريره

**الملفات:**
- إنشاء: `app/src/org/cooling.js`، `app/src/domain/org.ts`
- تعديل: `app/src/editions/offline/App.jsx`، `app/src/editions/cloud/App.jsx`، `app/src/app/StaffSystem.jsx:75`
- تحديث: `app/.baseline/offline.txt`، `app/.baseline/cloud.txt`

**الواجهات:**
- تنتج: `coolingOrg` (شكله أعلاه)، `createStaffSystem({ useDataLayer, AuthViews, org })`، والمساعدات الأربع في `domain/org.ts`. `org` متاح داخل `StaffSystem` اسماً بهذا اللفظ.

- [ ] **الخطوة 1:** قبل أي تعديل، من `app/`: `npm run build`، ثم `node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --save .baseline/offline.txt` ومثله للسحابية. السبب: `.baseline` متأخر عن `7b5c564` و`0f457c4`. التزام: `Refresh UI-string baseline before org extraction`.
- [ ] **الخطوة 2:** كتابة `domain/org.ts` و`org/cooling.js` بكل القيم، منسوخة من مواضعها الحالية نسخاً لا كتابةً.
- [ ] **الخطوة 3:** `createStaffSystem` يقبل `org`، وملفا المدخل يمرّران `coolingOrg`. لا يُستعمل `org` بعد.
- [ ] **الخطوة 4:** `npm run build` و`npm run typecheck` ينجحان، و`compare-ui-strings` للنسختين: لا ناقص. الزائد المقبول وحده نصوص `cooling.js` الجديدة إن لم تكن موجودة من قبل.
- [ ] **الخطوة 5:** التزام `Org config: cooling values in one file, passed to createStaffSystem`.

### المهمة 2: الوحدات والمواقع من `org`

**الملفات:** `domain/sorting.ts:239` · `domain/dutyMeals.ts:9-16,74` · `features/units/UnitsScreen.jsx:335-340,397,413,643,951,1019-1024` · `features/units/DutyMealsScreen.jsx` · `features/employees/EditEmployeeModal.jsx:86-104` · `features/dashboard/DashboardScreen.jsx:308,621` · `app/StaffSystem.jsx:63-68,1969,2034,3040,3071,3102,3476,4394,4513-4518,4763-4768`

**الواجهات:**
- تستهلك: `unitNames`، `headquartersUnit`، `locationNames`، `locationJustification`.
- تنتج: `sortByUnit(arr: Employee[], unitOrder: string[]): Employee[]` (كل المستدعين الخمسة في StaffSystem يمرّرون `unitNames(org)`)؛ `buildDutyMealDay({ ..., sites: string[], siteLabel: (unit: string) => string })` بدل `DUTY_MEAL_SITES` و`dutyMealSiteLabel`؛ `DUTY_MEAL_SECTION` يُحذف ويُقرأ `org.departmentBare`.

- [ ] **الخطوة 1:** كل قائمة وحدات حرفية تصير `unitNames(org)`، وأزرار الوحدات وبطاقاتها تُبنى من `org.units` (`tabLabel` و`cardIcon` و`cardGradient`)، وخيارات الوحدة والموقع في تعديل الموظف من `org.units` و`org.locations`.
- [ ] **الخطوة 2:** `unitName === 'مقر الشعبة'` قبل `ensureTopTwo` يصير `unitName === headquartersUnit(org)`، و`LOCATION_JUSTIFICATIONS` و`LOCATION_ORDER` من `org.locations`، و3040/3071 من `org.shiftViewLocationOrder`، و3102 من `org.shiftUnitOrder`.
- [ ] **الخطوة 3:** جدول الوجبات: `isTripleShiftSite` يبقى كما هو (المرحلة 2)، والمواقع والتسمية من `org.dutyMealSites` و`shortName`.
- [ ] **الخطوة 4:** البناء و`typecheck` و`tsc --checkJs` على `StaffSystem.jsx` و`src/features/*/*.jsx` (TS2304 وTS2552 وTS18004: المقبول `XLSX` و`saveAs` وحدهما)؛ `compare-ui-strings`: لا ناقص ولا زائد؛ grep على الناتج يجد `from-cyan-500` و`to-teal-600`.
- [ ] **الخطوة 5:** التزام `Units and locations read from org`، ثم مراجعة Codex.

### المهمة 3: أسماء الجهة في العناوين والمطبوعات

**الملفات:** `features/shell/AppHeader.jsx:18` · `features/auth/WelcomeSplash.jsx:35-48` · `features/employees/EmployeeCardModal.jsx:23` · `features/employees/NewEmployeeFormPrint.jsx:25-59` · `features/water/WaterMemoModal.jsx:34-51` · `features/shifts/SquadScheduleModal.jsx:28-29,86-87` · `features/units/DutyMealsScreen.jsx:117` · `features/units/UnitsScreen.jsx:927` · `features/dashboard/DashboardScreen.jsx:728-729` · `domain/timeForm.ts:223-225` · `app/StaffSystem.jsx:3614,4625,4649,4848-4849,4942,5175`

**الواجهات:**
- تنتج: `timeFormTitle(kind: string, org: Org): string` = `'أستمارة ضبط الوقت ' + org.sectionShort`، ويُضاف `' — موظفو العقود'` للعقود. يُحذف الثابتان `TIME_FORM_TITLE` و`TIME_FORM_CONTRACTS_TITLE`، وكل مستدعٍ يمرّر `org`.

- [ ] **الخطوة 1:** كل نص يذكر الوزارة أو الشركة أو القسم أو الشعبة يُركَّب من حقول `org` بالفاصل نفسه (`·` أو `-` أو `/` أو مسافة) كما هو اليوم. `alt` الشعار في الترحيب = `'شعار ' + org.company`.
- [ ] **الخطوة 2:** البناء و`typecheck` و`tsc --checkJs`. في `compare-ui-strings` يظهر ناقص وزائد متوقعان لأن النصوص الكاملة صارت أجزاء. اكتب في رسالة الالتزام كل نص ناقص وبجانبه التعبير الذي يعيد بناءه. المقبول: لا نص ناقص بلا تعبير يطابقه حرفاً، ولا زائد إلا أجزاء تلك التعابير.
- [ ] **الخطوة 3:** التزام `Organization names in titles and prints read from org`، ثم مراجعة Codex على القائمة في الرسالة.

### المهمة 4: كلمة «الشعبة» من `org.terms`

**الملفات:** `features/units/UnitsScreen.jsx:47,119,265,268,388,692,778,894,896` · `features/dashboard/DashboardScreen.jsx:43,59,79,181,656` · `features/preview/PreviewModal.jsx:110,170` · `features/units/TimeFormPrint.jsx:86` · `features/water/WaterMemoModal.jsx:105` · `features/shifts/SquadScheduleModal.jsx:73,128` · `features/employees/EditEmployeeModal.jsx:77` · `features/employees/NewEmployeeFormPrint.jsx:58` · `features/shell/AppNav.jsx:125` · `features/restore/RestoreCenterModal.jsx:108` · `app/StaffSystem.jsx:1946,1958,2057,4014,4668`

**القاعدة:** `terms.the` للمعرّف («مسؤول الشعبة»، «خارج الشعبة»، «كامل الشعبة»)، و`terms.forThe` بعد اللام («للشعبة»)، و`terms.whole` بعد «الشعبة كلها» حتى تصير «القسم كله». «الشعبة:» في استمارة الموظف الجديد = `` `${terms.the}:` ``؛ وقيمتها `org.section` (من المهمة 3). مفتاح العمود `'خارج الشعبة (يوم)'` في 1946 عنوان عمود معاينة لا حقل استيراد، فيُركَّب من `terms.the`. وكل ما في «قيود عامة» عن أعمدة Excel لا يُلمس.

- [ ] **الخطوة 1:** استبدال المواضع أعلاه. موضع يذكر «الشعبة» في نص مرئي ولم يرد في القائمة يُستبدل بالقاعدة نفسها ويُذكر في رسالة الالتزام.
- [ ] **الخطوة 2:** التحقق والالتزام كالمهمة 3: `The section word comes from org.terms`، ثم مراجعة Codex.

### المهمة 5: الفحص الختامي والتسليم لأسامة

- [ ] **الخطوة 1:** من `app/`، بحث عن أسماء التبريد في الكود خارج `src/org/` والتعليقات:
  `grep -rnE "تبريد|نهر بن عمر|باب الزبير|المكينة|المركز الثقافي|نفط البصرة|شعبة" src --include=*.js --include=*.jsx --include=*.ts | grep -vE "^src/org/|^src/data/|^src/editions/cloud/|:\s*(//|\*|/\*|\{/\*)"`
  المقبول وحده: مواضع المرحلة 2 المذكورة في «قيود عامة»، وأسماء أعمدة Excel. أي سطر آخر يُستبدل.
- [ ] **الخطوة 2:** `grep -rn "org/cooling" src` لا يجد إلا ملفي المدخل.
- [ ] **الخطوة 3:** `npm run build && python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud`.
- [ ] **الخطوة 4:** تحديث `CLAUDE.md` بسطر في «المشروع والنسختان»: أن ما يخص الشعبة في `src/org/cooling.js` ويصل بـ`ctx.org`، وأن نصاً جديداً يذكر الشعبة أو وحدة يُكتب من `org` لا حرفياً.
- [ ] **الخطوة 5:** التزام، ثم تقرير لأسامة: ما يجرّبه على نسختي سطح المكتب (أزرار الوحدات وبطاقاتها بألوانها، والموقف اليومي الموحد وطباعته، وتصدير Excel للملاك، وكشف الإضافي، واستمارة ضبط الوقت، ومذكرة الماء، وجدول الوجبات وملفه، وبطاقة الموظف، واستمارة الموظف الجديد، ونص الواتساب، وشاشة الترحيب)، وخلل ترتيب «المناوبون» حسب الموقع ليقرر فيه. لا رفع إلا بموافقته.
