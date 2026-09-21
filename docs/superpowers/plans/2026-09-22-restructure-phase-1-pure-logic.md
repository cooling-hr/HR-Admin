# الانتقال الاحترافي — المرحلة 1 (المنطق الصرف) — خطة التنفيذ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** نقل الدوال والثوابت الصرفة (التواريخ، النص العربي، الفترات، حالة التجهيز، الماء، الدمج، الفرز، العقود) من `App.jsx` في النسختين إلى وحدات مشتركة في `app/src/core` و`app/src/domain`، بسلوك مطابق تماماً، ثم إضافة أنواع TypeScript لها.

**Architecture:** أداة نقل آلية (`extract-pure.mjs`) تنقل تصريحات محدَّدة حرفياً بتعليقاتها العربية من الملفين، وترفض النقل إن اختلف النصّان بين النسختين أو إن اعتمد العنصر على شيء لم يُنقل بعد. كل وحدة جديدة تُقارَن بنسختها القديمة بفحص مقارنة صغير لمرة واحدة قبل الالتزام. بعد النقل تُرقّى الوحدات من `.js` إلى `.ts` بأنواع صريحة.

**Tech Stack:** Vite 8 وTypeScript 5.9.3 (موجودان من المرحلة 0). Node 24.

**Spec:** `docs/superpowers/specs/2026-09-21-professional-restructure-design.md`

## Global Constraints

- لا تغيير في السلوك ولا في الشكل ولا في صيغة البيانات. النقل حرفي؛ أي تعديل على منطق دالة ممنوع في هذه المرحلة (حتى لو بدا خطأً: يُسجَّل في التقرير ولا يُصلَح).
- الأوفلاين: صفر إشارات إلى `firebaseio` و`identitytoolkit` و`AIza` في ناتجه (يفحصه `npm run build:offline`).
- لا يُنقَل ما يقرأ حالة المكوّن (`staff` وأخواتها) ولا ما يعيد JSX (يذهب إلى `ui` في المرحلة 3) ولا ما يلمس DOM/الطباعة/التصدير ولا كود Firebase (المرحلة 2). إن ظهر أن عنصراً من هذه الفئات مطلوب لعنصر آخر، **توقف وأبلغ**، لا تُحوِّر الأداة.
- اتجاه الاعتماد: `core` ← `domain`. لا تستورد `core` من `domain`.
- لا `git push` بلا موافقة صريحة في المحادثة. الالتزام بحكمك، ولا سطر `Co-Authored-By`.
- لا اختبارات آلية دائمة (قرار 2026-09-16). فحص المقارنة في هذه الخطة **مؤقت**: يعيش في `app/.scratch/` (خارج Git) ولا يُلتزَم به ولا يُشغَّل تلقائياً بعد المرحلة. أقرّه المستخدم لهذه المرحلة تحديداً (2026-09-22، «استمر»).
- لا بيانات موظفين حقيقية في أي فحص أو رسالة لمساعد خارجي؛ مدخلات مصطنعة فقط.
- مراجعة Codex (البوابة الثالثة) لنصوص الوحدات الجديدة بعد كل مهمة نقل، بلا بيانات حقيقية، محاولة واحدة. تُسجَّل النتيجة في التقرير.
- المخرجات والتقارير بالعربية.

## Rulings

1. **JS أولاً ثم TS:** النقل الحرفي إلى `.js` (لا يحتاج أنواعاً فلا يمكن أن يغيّر السلوك)، ثم المهمة 5 ترقّي إلى `.ts`. الفصل يجعل أي فرق سلوكي من النقل لا من الأنواع.
2. **الأداة تعمل على النسختين معاً وتشترط تطابق النصّين.** 129 دالة متطابقة حرفياً بينهما بحسب فحص 2026-09-22؛ أي عنصر يختلف بينهما يُنقل لاحقاً بقرار منفصل (يخصّ تباين النسختين).
3. **99 مرشحاً صرفاً من 208 تصريحاً** بحسب تحليل المتغيرات الحرة. المرحلة تنقل المجموعات أدناه فقط؛ الباقي (JSX، وطباعة، وتصدير، وFirebase، وأدوات تلمس الحالة) يبقى.

## بنية الملفات

- Create (مؤقت في المشروع): `app/scripts/extract-pure.mjs` (أصلها `docs/superpowers/plans/assets/extract-pure.mjs`؛ **تُلتزَم** لأنها أداة صيانة قابلة للإعادة)
- Create: `app/src/core/{dates,arabic}.js`، `app/src/domain/{periods,safety,water,merge,sorting,employees}.js` (ثم `.ts` في المهمة 5)، `app/src/domain/types.ts`
- Modify: `app/src/editions/{cloud,offline}/App.jsx` (حذف الأصول المنقولة + سطر استيراد لكل وحدة)
- Create (خارج Git): `app/.scratch/old-loader.mjs`، `app/.scratch/check-<module>.mjs`، `app/.scratch/base.txt`
- Modify: `app/.gitignore` (سطر `.scratch/`)

---

### Task 1: أداة النقل وبنية فحص المقارنة

**Files:**
- Create: `app/scripts/extract-pure.mjs`، `app/.scratch/old-loader.mjs`، `app/.scratch/base.txt`
- Modify: `app/.gitignore`

**Interfaces:**
- Produces: `node scripts/extract-pure.mjs <path-under-src> <name>... [--write]` (بلا `--write` تجربة جافة)؛ و`loadOld(names)` في `.scratch/old-loader.mjs` تعيد كائناً بالدوال القديمة (من الالتزام المسجَّل في `base.txt`) لمقارنتها.

- [ ] **Step 1: سجّل الالتزام الأساسي وأضف `.scratch/` إلى `.gitignore`**

Run (من جذر المستودع):
```bash
git status --short | grep -v docx   # يجب أن يكون فارغاً
mkdir -p app/.scratch && git rev-parse HEAD > app/.scratch/base.txt && cat app/.scratch/base.txt
printf '.scratch/\n' >> app/.gitignore
```
Expected: شجرة العمل نظيفة، ويُطبع رقم الالتزام.

- [ ] **Step 2: انسخ الأداة**

Run: `cp docs/superpowers/plans/assets/extract-pure.mjs app/scripts/extract-pure.mjs`

- [ ] **Step 3: جرّبها تجربة جافة**

Run (من `app/`): `node scripts/extract-pure.mjs core/dates.js localDateStr daysInMonth getDaysBetweenDates getArabicDayName ARABIC_MONTH_NAMES getArabicMonthLabel`
Expected: `تجربة جافة: 6 عنصراً → src/core/dates.js` بلا `توقف:`، ولا يتغير أي ملف (`git status` نظيف).

- [ ] **Step 4: اكتب `app/.scratch/old-loader.mjs`**

```js
// يحمّل النسخ القديمة من الدوال من الالتزام الأساسي، لمقارنتها بالوحدات الجديدة.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import ts from 'typescript';

const BASE = fs.readFileSync(new URL('./base.txt', import.meta.url), 'utf8').trim();

export function loadOld(names) {
  const text = execSync(`git show ${BASE}:app/src/editions/cloud/App.jsx`, { encoding: 'utf8', maxBuffer: 1 << 28 });
  const sf = ts.createSourceFile('old.jsx', text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.JSX);
  const decls = new Map(); // اسم -> نص التصريح
  const take = (st) => {
    if (ts.isVariableStatement(st) && st.declarationList.declarations.length === 1) {
      const d = st.declarationList.declarations[0];
      if (ts.isIdentifier(d.name)) decls.set(d.name.text, st.getText());
    } else if (ts.isFunctionDeclaration(st) && st.name) decls.set(st.name.text, st.getText());
  };
  sf.statements.forEach((st) => {
    take(st);
    if (ts.isFunctionDeclaration(st) && st.name?.text === 'StaffSystem') st.body.statements.forEach(take);
  });
  // إغلاق التبعيات: أي اسم مصرَّح في الملف يرد داخل نص عنصر مطلوب يُضاف
  const need = new Set();
  const queue = [...names];
  while (queue.length) {
    const n = queue.pop();
    if (need.has(n) || !decls.has(n)) continue;
    need.add(n);
    for (const w of decls.get(n).match(/[A-Za-z_$][\w$]*/g) || []) if (decls.has(w) && !need.has(w)) queue.push(w);
  }
  const ordered = [...need].sort((a, b) => text.indexOf(decls.get(a)) - text.indexOf(decls.get(b)));
  const body = ordered.map((n) => decls.get(n)).join('\n') + `\nreturn { ${names.join(', ')} };`;
  return new Function(body)();
}
```

- [ ] **Step 5: تحقق أن المحمِّل يعمل على عنصر واحد**

Run (من `app/`): `node -e "import('./.scratch/old-loader.mjs').then(m => { const o = m.loadOld(['localDateStr']); console.log(o.localDateStr(Date.UTC(2026,0,1,21,30))); })"`
Expected: يطبع تاريخاً بصيغة `YYYY-MM-DD` (بتوقيت الجهاز المحلي).

- [ ] **Step 6: Commit (الأداة والـ`.gitignore` فقط)**

```bash
git add app/scripts/extract-pure.mjs app/.gitignore
git commit -m "Add extract-pure tool for moving shared logic out of the edition files"
```

---

### Task 2: `core/dates.js` و`core/arabic.js`

**Files:**
- Create: `app/src/core/dates.js`، `app/src/core/arabic.js`، `app/.scratch/check-core.mjs`
- Modify: `app/src/editions/{cloud,offline}/App.jsx`

**Interfaces:**
- Consumes: `extract-pure.mjs`، `loadOld`.
- Produces: `core/dates.js` تصدّر `localDateStr, daysInMonth, getDaysBetweenDates, getArabicDayName, ARABIC_MONTH_NAMES, getArabicMonthLabel, addMonthsClamped, formatDateToString, parseExcelDate, calculateYearsOfService, ISO_DAY`؛ و`core/arabic.js` تصدّر `normalizeArabic, normalizeArabicForSearch, ARABIC_INDIC_DIGITS, EXTENDED_ARABIC_INDIC_DIGITS, normalizeJobNumber, guessGender, normalizeGender, getThreeName, getTripleName, normalizeArabicText, ARABIC_ONES, ARABIC_TEENS, ARABIC_TENS, ARABIC_HUNDREDS, numberChunkToArabicWords, amountToArabicWords, arabicManualDaysCount, arabicHoursCount, formatMobileNumber, fixPhoneNumber, expandAbbrev`.

- [ ] **Step 1: تجربة جافة للتواريخ ثم الكتابة**

Run (من `app/`):
```bash
node scripts/extract-pure.mjs core/dates.js localDateStr daysInMonth getDaysBetweenDates getArabicDayName ARABIC_MONTH_NAMES getArabicMonthLabel addMonthsClamped formatDateToString parseExcelDate calculateYearsOfService ISO_DAY
```
Expected: `تجربة جافة: 11 عنصراً`. إن ظهر `توقف:` فاقرأ السبب: (أ) «يعتمد على X وهو ليس عالمياً ولا منقولاً» → X إما يُنقل معه في السطر نفسه (إن كان صرفاً وتتبّع بـ`grep -n "const X" src/editions/cloud/App.jsx`) أو يوقف العنصر ويُسجَّل؛ (ب) «النصّان مختلفان» → لا تنقله، سجّله. عندما تنجح التجربة أعد التشغيل نفسه بـ`--write`.

- [ ] **Step 2: تجربة جافة للنص العربي ثم الكتابة**

Run:
```bash
node scripts/extract-pure.mjs core/arabic.js ARABIC_INDIC_DIGITS EXTENDED_ARABIC_INDIC_DIGITS normalizeArabic normalizeArabicForSearch normalizeJobNumber guessGender normalizeGender getThreeName getTripleName normalizeArabicText ARABIC_ONES ARABIC_TEENS ARABIC_TENS ARABIC_HUNDREDS numberChunkToArabicWords amountToArabicWords arabicManualDaysCount arabicHoursCount formatMobileNumber fixPhoneNumber expandAbbrev
```
نفس قواعد التعامل مع `توقف:`. عند النجاح أعد بـ`--write`. (الاستيراد من `dates.js` يُضاف تلقائياً إن لزم؛ **`core` لا يستورد من `domain`**: إن طلبت الأداة ذلك فتوقف.)

- [ ] **Step 3: ابنِ**

Run: `npm run build`
Expected: `OK` للنسختين. خطأ `X is not defined` وقت التحميل يعني استعمالاً لم يلتقطه التحليل: **لا تُصلحه بتعديل الدالة**؛ أرجع النقل (`git checkout -- src/editions && rm -rf src/core`) وسجّل العنصر.

- [ ] **Step 4: اكتب `app/.scratch/check-core.mjs` (فحص مقارنة، لا يُلتزَم)**

```js
import assert from 'node:assert/strict';
import { loadOld } from './old-loader.mjs';
import * as dates from '../src/core/dates.js';
import * as ar from '../src/core/arabic.js';

// TZ=Asia/Baghdad عند التشغيل. مدخلات مصطنعة فقط.
const stamps = [0, 86400000, Date.UTC(2026, 0, 1, 21, 30), Date.UTC(2026, 1, 28, 23, 59), Date.UTC(2028, 1, 29, 0, 0), Date.UTC(2026, 11, 31, 20, 59), '2026-09-22', '2026-03-01T00:30:00+03:00'];
const old = loadOld(['localDateStr', 'getArabicMonthLabel', 'amountToArabicWords', 'normalizeArabic', 'normalizeJobNumber', 'formatMobileNumber']);
let n = 0;
const eq = (label, a, b) => { assert.deepEqual(a, b, label); n++; };
for (const s of stamps) eq(`localDateStr(${s})`, dates.localDateStr(s), old.localDateStr(s));
for (const m of [0, 1, 5, 11]) eq(`monthLabel ${m}`, dates.getArabicMonthLabel(m), old.getArabicMonthLabel(m));
for (const v of [0, 1, 11, 100, 1250, 25000, 1000000, 987654]) eq(`amount ${v}`, ar.amountToArabicWords(v), old.amountToArabicWords(v));
for (const t of ['أحمد', 'إبراهيم', 'مُحَمَّد', 'آمنة', 'هُدى', '  فاطمة  ', '', null, undefined]) eq(`normalizeArabic ${t}`, ar.normalizeArabic(t), old.normalizeArabic(t));
for (const j of ['123', '١٢٣', '۱۲۳', ' 45 ', null, '']) eq(`job ${j}`, ar.normalizeJobNumber(j), old.normalizeJobNumber(j));
for (const p of ['07701234567', '7701234567', '+9647701234567', '٠٧٧٠١٢٣٤٥٦٧', '123', '', null]) eq(`mobile ${p}`, ar.formatMobileNumber(p), old.formatMobileNumber(p));
console.log('OK', n, 'مقارنة');
```
**ملاحظة للمنفّذ:** هذا مثال للنمط؛ اقرأ تواقيع الدوال الفعلية (`daysInMonth`، `getDaysBetweenDates`، `addMonthsClamped`، `parseExcelDate`، `calculateYearsOfService`، `getArabicDayName`، `guessGender`، `getThreeName`، `expandAbbrev`…) وأضف لكل واحدة **12 حالة على الأقل** تشمل: حدود الشهر (28/29/30/31 وسنة كبيسة)، منتصف الليل والثالثة فجراً بتوقيت بغداد، القيم الفارغة/`null`/`undefined`، أرقاماً عربية-هندية، نصوصاً بتشكيل وهمزات وياء/ألف مقصورة. أي دالة تعيد `Date` أو كائناً: قارن بـ`JSON.stringify`. أي دالة تعتمد على الساعة الحالية: مرّر التاريخ صراحةً أو تجاوزها مع تسجيل ذلك.

- [ ] **Step 5: شغّل الفحص**

Run (من `app/`): `TZ=Asia/Baghdad node .scratch/check-core.mjs`
Expected: `OK <عدد> مقارنة`. أي `AssertionError` = اختلاف سلوكي حقيقي: أرجع النقل لذلك العنصر وحلّله (لا تعدّل الوحدة الجديدة لتطابق فحصاً خاطئاً قبل أن تتأكد أيهما الصحيح).

- [ ] **Step 6: مراجعة Codex**

أرسل نصّي `src/core/dates.js` و`src/core/arabic.js` عبر `review_code` (بلا بيانات حقيقية) واطلب البحث عن: اعتماد خفي على متغيرات عالمية، وأخطاء حدّية في التواريخ. تحقّق من كل ملاحظة قبل تطبيقها؛ **لا تغيّر منطقاً**، سجّل ما يُقترح كملاحظة للمستخدم.

- [ ] **Step 7: Commit**

```bash
git add app/src
git commit -m "Move date and Arabic-text helpers into shared core modules"
```

---

### Task 3: `domain/periods.js` و`domain/safety.js` و`domain/water.js`

**Files:**
- Create: `app/src/domain/{periods,safety,water}.js`، `app/.scratch/check-domain.mjs`
- Modify: `app/src/editions/{cloud,offline}/App.jsx`

**Interfaces:**
- Consumes: `core/dates.js` (تُستورد تلقائياً عند الحاجة).
- Produces: `periods.js`: `PERIOD_TYPES, OPEN_ENDED_PERIOD_TYPES, QUICK_STATUS_OPTIONS, periodsOf, getActivePeriod, periodEndOf, periodsOverlap, periodIdentityOf, periodMergeKeyOf, samePeriodDates, samePeriodExtras, periodPhaseOf, quickPeriodEnd, isLongOrMaternityLeave`؛ `safety.js`: `getSafetyStatus, isInSafetyRoster, safetyFilterGroup`؛ `water.js`: `getWaterSeasonalRate, WATER_LEAVE_TALLY_TYPES, isShiftOnDutyStatus`.

- [ ] **Step 1: الفترات — تجربة جافة ثم `--write`**

```bash
node scripts/extract-pure.mjs domain/periods.js PERIOD_TYPES OPEN_ENDED_PERIOD_TYPES QUICK_STATUS_OPTIONS periodsOf getActivePeriod periodEndOf periodsOverlap periodIdentityOf periodMergeKeyOf samePeriodDates samePeriodExtras periodPhaseOf quickPeriodEnd isLongOrMaternityLeave
```
(نفس قواعد `توقف:` كما في المهمة 2.) **قيد المشروع:** `PERIOD_TYPES` ثمانية أنواع ثابتة، و`OPEN_ENDED_PERIOD_TYPES` نوعان؛ لا تغيّرهما.

- [ ] **Step 2: السلامة والماء — تجربة جافة ثم `--write`**

```bash
node scripts/extract-pure.mjs domain/safety.js getSafetyStatus isInSafetyRoster safetyFilterGroup
node scripts/extract-pure.mjs domain/water.js getWaterSeasonalRate WATER_LEAVE_TALLY_TYPES isShiftOnDutyStatus
```

- [ ] **Step 3: ابنِ** — `npm run build`، Expected `OK` للنسختين.

- [ ] **Step 4: اكتب `app/.scratch/check-domain.mjs` على نمط المهمة 2**

يقارن كل دالة بنسختها القديمة عبر `loadOld`، بموظفين **مصطنعين** (أسماء مثل «موظف اختبار 1»). الحالات الإلزامية:
- `getActivePeriod`: موظف بلا `statusPeriods` وبـ`status:'نشط'` ثم بـ`status:'إجازة طويلة'` (مسار الرجوع القديم، يجب أن يعيد فترة `legacy: true`)؛ موظف بفترتين متتاليتين؛ تاريخ يساوي `from` وتاريخ يساوي `to` وتاريخ بعد `to`؛ فترة مفتوحة النهاية (`to: ''` و`to: null`) من نوع `غياب` و`سحب يد`؛ `emp` أو `dateStr` فارغان.
- `getSafetyStatus`: تاريخ فارغ؛ اليوم؛ قبل 360 و365 و366 و700 يوماً من تاريخ مرجعي ثابت (مرّر التاريخ المرجعي إن كانت الدالة تقبله، وإلا ثبّت `Date` بتجاوز `globalThis.Date` مؤقتاً في الفحص فقط)؛ تواريخ في المستقبل. يجب أن تغطي المخرجات الأنواع الستة: `ok, due-never, due-both, alert-both, due-uniform, alert-uniform`.
- `safetyFilterGroup` و`isInSafetyRoster`: لكل نوع من الستة، ولموظف بلا `lastSafetyDelivery`.
- `getWaterSeasonalRate`: الأشهر الاثنا عشر.
- الباقي: 10 حالات لكل دالة بحسب توقيعها الفعلي.

- [ ] **Step 5: شغّل** `TZ=Asia/Baghdad node .scratch/check-domain.mjs` — Expected `OK <عدد> مقارنة`. وأثبت في تقريرك أن الأنواع الستة لـ`getSafetyStatus` ظهرت كلها فعلاً في المخرجات المُقارَنة.

- [ ] **Step 6: مراجعة Codex** لنصوص الوحدات الثلاث (بلا بيانات حقيقية)، ونفس قيد «لا تغيّر منطقاً».

- [ ] **Step 7: Commit**

```bash
git add app/src
git commit -m "Move dated-period, safety and water rules into domain modules"
```

---

### Task 4: `domain/merge.js` و`domain/sorting.js` و`domain/employees.js`

**Files:**
- Create: `app/src/domain/{merge,sorting,employees}.js`، `app/.scratch/check-domain2.mjs`
- Modify: `app/src/editions/{cloud,offline}/App.jsx`

**Interfaces:**
- Consumes: `core/*` و`domain/periods.js`.
- Produces: `merge.js`: `FIELD_NAMES_AR, mergeKeyOf, ownKey, ATTENDANCE_PARTS, isValidAttendanceValue, analyzeMergePeriods, analyzeMergeAttendance, analyzeMerge`؛ `sorting.js`: `getJobRank, sortByJobNumber, sortByJobTitleHierarchy, ensureTopTwo, sortByUnit`؛ `employees.js`: `CONTRACT_TITLES, isContractEmployee, contractTypeOf, getMissingFields`.

- [ ] **Step 1: تجربة جافة لكل وحدة ثم `--write`**

```bash
node scripts/extract-pure.mjs domain/merge.js FIELD_NAMES_AR mergeKeyOf ownKey ATTENDANCE_PARTS isValidAttendanceValue analyzeMergePeriods analyzeMergeAttendance analyzeMerge
node scripts/extract-pure.mjs domain/sorting.js getJobRank sortByJobNumber sortByJobTitleHierarchy ensureTopTwo sortByUnit
node scripts/extract-pure.mjs domain/employees.js CONTRACT_TITLES isContractEmployee contractTypeOf getMissingFields
```
**متوقع:** قد تعتمد `analyzeMerge*` على مساعدي JSX (`periodRangeJsx`, `attendanceValueJsx`) — هي **ليست** في القائمة عمداً لأنها واجهة. إن ظهر ذلك في `توقف:` فلا تنقل `analyzeMerge*`؛ انقل ما عداها، وسجّل ذلك في التقرير بوضوح (يؤجَّل إلى المرحلة 3).

- [ ] **Step 2: ابنِ** — `npm run build`، Expected `OK` للنسختين.

- [ ] **Step 3: فحص المقارنة لما فيه منطق**

اكتب `app/.scratch/check-domain2.mjs` على النمط نفسه لـ`sortBy*` (قوائم مصطنعة من 15 موظفاً بمسميات وظيفية ووحدات وأرقام وظيفية متنوعة، بينها أرقام عربية-هندية وفراغات؛ قارن ترتيب المعرّفات الناتج)، و`getMissingFields` و`contractTypeOf` و`isContractEmployee` (موظفون مصطنعون بحقول ناقصة)، و`isValidAttendanceValue` وأي دالة `analyzeMerge*` نُقلت (بنسختين مصطنعتين من قائمة موظفين: مضافون، محذوفون، معدّلون، وفترات متطابقة ومتداخلة).

- [ ] **Step 4: شغّل** `TZ=Asia/Baghdad node .scratch/check-domain2.mjs` — Expected `OK <عدد> مقارنة`.

- [ ] **Step 5: مراجعة Codex** لنصوص الوحدات (بلا بيانات حقيقية).

- [ ] **Step 6: Commit**

```bash
git add app/src
git commit -m "Move merge, sorting and employee helpers into domain modules"
```

---

### Task 5: ترقية الوحدات إلى TypeScript

**Files:**
- Rename: `app/src/core/*.js` → `.ts`، `app/src/domain/*.js` → `.ts`
- Create: `app/src/domain/types.ts`
- Modify: `app/tsconfig.json` (إن لزم)، سطور الاستيراد إن تغيّرت الامتدادات

**Interfaces:**
- Produces: `domain/types.ts` تصدّر `StatusPeriod` و`Employee` (كل الحقول غير المؤكدة اختيارية).

- [ ] **Step 1: أنشئ `app/src/domain/types.ts` من الاستعمال الفعلي**

ابدأ بهذا الهيكل ثم أكمله بكل حقل تقرؤه الوحدات المنقولة فعلاً (ابحث بـ`grep -o "emp\.[a-zA-Z]*\|employee\.[a-zA-Z]*\|p\.[a-zA-Z]*" src/domain/*.js | sort -u`)، **وكل حقل غير مؤكد يُعلَن اختيارياً**:

```ts
export type PeriodType =
  | 'إجازة اعتيادية' | 'في دورة' | 'إيفاد' | 'إجازة بدون راتب'
  | 'إجازة طويلة' | 'إجازة أمومة' | 'غياب' | 'سحب يد';

export interface StatusPeriod {
  id: string;
  type: PeriodType | string;   // string: حالات قديمة من استيراد Excel
  from: string;                // YYYY-MM-DD
  to?: string | null;          // فارغ = مفتوحة النهاية
  note?: string;
  confirmedReturn?: string | null;
  legacy?: boolean;
}

export interface Employee {
  id: string | number;
  name?: string;
  status?: string;             // النص القديم — لا يُحذف أبداً
  statusPeriods?: StatusPeriod[];
  lastSafetyDelivery?: string;
  lastModified?: string;
  [key: string]: unknown;      // بقية الحقول تُعلَن عند الحاجة
}
```

- [ ] **Step 2: أعد التسمية وأضف أنواع المعاملات والقيم المُعادة، وحدة وحدة**

لكل ملف: `git mv src/core/dates.js src/core/dates.ts` وهكذا، ثم أضف أنواعاً **دون تغيير أي سطر منطقي**. ثم `npm run typecheck`. اجعل المعاملات المجهولة `unknown` أو `any` صراحةً حين لا يُعرف نوعها بيقين (لا تخمّن)، وسجّل عدد `any` المتبقي في التقريرـ فهو ما يُشدَّد لاحقاً. Expected: `typecheck` ينجح بنمط `strict`.

- [ ] **Step 3: أعد فحص المقارنة بعد إعادة التسمية**

المحمِّل القديم يقرأ من Git فلا يتأثر، والوحدات الجديدة `.ts` لا يستوردها Node مباشرة: استعمل `npx --yes tsx .scratch/check-core.mjs` (أو أي مُشغِّل TypeScript متاح دون تثبيته في المشروع) — إن لم يتوفّر فابنِ الوحدات إلى مجلد مؤقت بـ`npx tsc --outDir .scratch/out --module esnext --target es2020 src/core/*.ts src/domain/*.ts` وقارن الناتج. Expected: كل الفحوص `OK` كما قبل.

- [ ] **Step 4: ابنِ** — `npm run build` ثم `npm run typecheck`. Expected: `OK` للنسختين ونجاح الأنواع.

- [ ] **Step 5: Commit**

```bash
git add app/src app/tsconfig.json
git commit -m "Type the shared core and domain modules in TypeScript"
```

---

### Task 6: تجربة المستخدم والإقفال

- [ ] **Step 1: تحقّق شامل**

Run (من `app/`): `npm run build && npm run typecheck`. وسجّل: عدد الأسطر التي حُذفت من كل `App.jsx`، عدد الوحدات والعناصر المنقولة، عدد التصريحات التي بقيت غير منقولة مع سبب كل فئة، وعدد `any` المتبقي.

- [ ] **Step 2: انسخ النسختين إلى سطح المكتب**

```bash
python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud
```

- [ ] **Step 3: اطلب من المستخدم التجربة بقائمة تركّز على ما نُقل**

1. الموقف اليومي وتقرير الفترة (الفترات وحالات الإجازة والغياب وسحب اليد).
2. السلامة (الحالات الستة والفلتر والتاريخ الجماعي).
3. الماء (الأشهر والموسم والإجازات المحتسبة).
4. الدمج الذكي عند استيراد JSON.
5. الفرز حسب الرقم الوظيفي والمسمى والوحدة.
6. الأرقام المكتوبة بالكلمات في كشف الماء، وأرقام الموبايل، وأسماء الأيام والأشهر.
7. حالات العقود والحقول الناقصة.
والمقارنة مع النسخة المعتمدة على سطح المكتب جنباً إلى جنب.

- [ ] **Step 3ب: انتظر إقرار المستخدم.** أي اختلاف يُصلَح بنقل العنصر المعني إلى مكانه الأصلي (لا بتعديل منطقه).

- [ ] **Step 4: حدّث الذاكرة الدائمة** (`hr-admin-pending-work.md`: المرحلة 1 مكتملة وبأي التزامات، وما بقي غير منقول، وقرار المرحلة التالية)، ولا `git push` قبل موافقة صريحة.

---

## مراجعة ذاتية

- **تغطية المواصفة (المرحلة 1: المنطق الصرف إلى `core`/`domain` بأنواع، السلوك مطابق، `tsc` نظيف):** المهام 2–4 للنقل، 5 للأنواع، 1 و2–4 للتحقق من التطابق.
- **مصير الباقي:** ما يعيد JSX أو يلمس DOM أو الحالة أو Firebase مؤجَّل صراحةً (Ruling 3، والقيود العامة)؛ لا شيء منه ضمن هذه المرحلة.
- **ما لم أتحقق منه بعد:** لم أجرّب النقل على المجموعات كلها، جرّبته على 10 عناصر (تواريخ وفترات) ونجح بناؤه ثم تراجعت عنه. قد يرفض التحليل بعض العناصر ضمن قوائم المهام (تبعيات لم أرها)، وهذا مقصود ومعالَج بقواعد `توقف:`. ولم أجرّب `tsx` أو `tsc --outDir` على الوحدات (Task 5 Step 3): طريقتان بديلتان مذكورتان لهذا السبب.
