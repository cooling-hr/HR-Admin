# المرحلة 2أ: استخراج طبقة البيانات (دخول/حفظ/مزامنة) — خطة تنفيذ

> **للمنفِّذين الآليين:** أداة فرعية مطلوبة: استخدم `superpowers:subagent-driven-development` لتنفيذ هذه الخطة مهمة تلو أخرى.

**الهدف:** نقل كود الدخول والجلسات وحفظ/جلب البيانات والمزامنة — المكرَّر بصيغتين مختلفتين تماماً بين `offline/App.jsx` و`cloud/App.jsx` — إلى ملفَّي hook منفصلين (`data/offline/useOfflineDataLayer.ts` و`data/cloud/useCloudDataLayer.ts`) بأداة استخراج آلية، حرفياً بلا تغيير سلوك، فيصغر كل `App.jsx` بمقدار ~800–1700 سطر ويصبح كود المزامنة الحسّاس (الذي سبّب فعلياً اختفاء حسابي مستخدمين قبل إصلاحه) معزولاً ومقروءاً في ملف واحد بدل مدفون وسط الشاشات.

**المعمارية:** كل نسخة تبقى ملفَّها الخاص (`App.jsx` منفصل لكل من الأوفلاين والسحابية — لا دمج للواجهة في هذه المرحلة، ذلك عمل مرحلة 2ب لاحقة منفصلة). الفرق الوحيد: القسم الكبير من الحالة/التأثيرات/الدوال الخاصة بالدخول والحفظ يُستبدَل باستدعاء واحد لـ hook يُعيد كل الأسماء التي يستعملها باقي الملف بنفس الأسماء تماماً — فلا حاجة لتعديل أي سطر آخر في الملفين الضخمين (~11–13 ألف سطر لكل منهما).

**Tech Stack:** أداة استخراج جديدة (Node + TypeScript compiler API، بنفس أسلوب `scripts/extract-pure.mjs` من المرحلة 1) تعمل على **نطاق أسطر محدَّد بعلامتين نصيتين** (`@data-layer:start` / `@data-layer:end`) بدل قائمة أسماء — لأن هذا النطاق يحوي تأثيرات (`React.useEffect`) بلا اسم، لا دوال/ثوابت مسمّاة فقط كما في المرحلة 1.

**Spec:** `docs/superpowers/specs/2026-09-21-professional-restructure-design.md` (صف «2 طبقة البيانات» في جدول المراحل).

## قيود عامة (تنطبق على كل مهمة أدناه)

- **بلا تغيير سلوك إطلاقاً.** كل سطر يُنقَل يُنقَل حرفياً (نفس النص تماماً، فقط إزاحة المسافة البادئة). أي تحسين أو تبسيط أو إصلاح عطل قديم يُلاحَظ أثناء العمل يُسجَّل في تقرير المهمة ولا يُطبَّق.
- **كود المزامنة السحابية (`pushDataToCloud`) حسّاس فعلياً:** تعليقات الكود نفسه تذكر حادثة إنتاجية حقيقية (اختفاء حسابي مستخدمين) نتجت عن سباق تزامن أُصلح لاحقاً بمنطق `writeClaim`/ETag دقيق. **يُمنَع تبسيط أو إعادة ترتيب أي جزء من هذا المنطق أثناء النقل.**
- **`tsc` لا يكشف مرجعاً مفقوداً هنا:** ملفات `App.jsx` غير مفحوصة بصرامة (`checkJs: false`)، فنسيان اسم واحد في قائمة الإرجاع من الـhook لا يظهر كخطأ بناء — يظهر شاشة بيضاء أو عطلاً صامتاً وقت التشغيل فقط. **البناء الناجح وحده لا يكفي دليل صحة لهذه المرحلة تحديداً** — التجربة الفعلية في المتصفح (تسجيل الدخول، الحفظ، فتح تبويبين) إلزامية قبل أي التزام يُعتبَر جاهزاً للرفع.
- **مراجعة Codex إلزامية** على القسمين (الأداة نفسها، وكل ناتج تشغيلها) قبل الالتزام — هذا تغيير منطق قائم بمعنى قواعد المشروع رغم أنه نقل حرفي، لحساسية الكود المنقول.
- بعد كل تعديل: `cd app && npm run build && python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud`.
- لا `git push` بلا موافقة صريحة من المستخدم في المحادثة.
- لا سطر Co-Authored-By في أي التزام (قرار مشروع سابق).

## المراحل ومعايير القبول

| المهمة | المحتوى | معيار القبول |
|---|---|---|
| 1 | علامات الحدود + `data/types.ts` | العلامات في مكانها الصحيح؛ `DataBundle` يطابق الحزمة الفعلية المستعملة في كلا الملفين |
| 2 | أداة `extract-hook.mjs` | تجربة جافة على الأوفلاين تطبع قائمة معاملات/مُخرَجات معقولة يدوياً |
| 3 | تشغيل الأداة على الأوفلاين + تحقق | `npm run build:offline` ناجح، `check-shell.mjs` ناجح (عزل Firebase سليم)، تجربة متصفح فعلية للدخول والحفظ |
| 4 | تشغيل الأداة على السحابية + تحقق | `npm run build:cloud` ناجح، `check-shell.mjs` ناجح، تجربة متصفح فعلية (دخول بريد+كلمة مرور، رمز سريع، حفظ، تبويبان) |
| 5 | مراجعة Codex + تقرير الفروق السلوكية | لا فروقاً غير مُبرَّرة؛ كل ملاحظة Codex عولجت أو سُجِّلت بقرار |

---

### مهمة 1: علامات حدود طبقة البيانات + نوع `DataBundle` المشترك

**الملفات:**
- Modify: `app/src/editions/offline/App.jsx`
- Modify: `app/src/editions/cloud/App.jsx`
- Create: `app/src/data/types.ts`

**الواجهات:**
- Produces: نوع `DataBundle` (يستورده كلا ملفَّي الـhook في المهمتين 3 و4).
- Produces: علامتا `// @data-layer:start` و`// @data-layer:end` كتعليقين مستقلَّين (سطر خاص بهما، لا نهاية سطر كود) داخل دالة `StaffSystem` في كلا الملفين — تحدِّدان بالضبط النطاق الذي تنقله المهمتان 3 و4.

- [ ] **الخطوة 1: أضِف `app/src/data/types.ts`**

الحزمة الفعلية (كما تُبنى في `buildCloudBundle` بالسحابية و`pushDataToServer` بالأوفلاين، وتُقرأ في `applyDataBundleToState` بكلا الملفين) لها هذا الشكل بالضبط — انسخه حرفياً:

```typescript
// شكل حزمة البيانات المتبادَلة بين الواجهة وطبقة التخزين (Firebase أو التخزين المحلي).
// مطابق تماماً لما يبنيه buildCloudBundle (سحابية) وpushDataToServer (أوفلاين)، ولما
// تقرأه applyDataBundleToState في كلا الملفين — لا تُضِف حقلاً هنا لم يكن موجوداً هناك.
export interface DataBundle {
  staffData?: unknown[];
  systemUsersList?: unknown[];
  officialHolidaysList?: string[];
  hourlyLeaveRecords?: Record<string, unknown>;
  overtimeHoursRecords?: Record<string, unknown>;
  dailyStatusOverrides?: Record<string, unknown>;
  shiftAnchorDate?: string;
  threeShiftAnchorSquad?: unknown;
  twoShiftAnchorSquad?: unknown;
  dataEntryOperator?: string;
  overtimeSelectedIds?: unknown;
  lastCloudUpdate?: string;
  pendingDeletionRequest?: unknown;
  // حقول سحابية إضافية تظهر فقط في حزم السحابية (لقطات الأرشيف وقفل الكتابة)
  writeClaim?: string;
}
```

- [ ] **الخطوة 2: أضِف علامتَي الحدود في `offline/App.jsx`**

النطاق يبدأ عند تصريح `defaultSystemUsers` (المصفوفة التي تُستعمَل بذرة أولية لحالة `systemUsers`) وينتهي عند إغلاق تأثير البث التلقائي الذي يراقب `[staff, officialHolidays, hourlyLeaveRecords, overtimeHoursRecords, dailyStatusOverrides, anchorDate, dataEntryOperator]`. بالبحث عن هذين الموضعين في الملف الحالي (رقم السطر تقريبي فقط — البحث بالنص هو المرجع، لا الرقم):

- أدرِج `// @data-layer:start` **قبل** السطر `const defaultSystemUsers = [` مباشرة (بنفس مستوى المسافة البادئة لذلك السطر)، بسطر خاص به.
- أدرِج `// @data-layer:end` **بعد** السطر `}, [staff, officialHolidays, hourlyLeaveRecords, overtimeHoursRecords, dailyStatusOverrides, anchorDate, dataEntryOperator]);` مباشرة (الذي يُغلق تأثير `React.useEffect` الأخير في هذه السلسلة — تحقّق أنه فعلاً الإغلاق الصحيح بقراءة السياق، فالملف قد يحوي أكثر من تأثير بنفس مصفوفة اعتماديات مشابهة).

بين العلامتين يجب أن يقع **بالضبط**: `defaultSystemUsers`، `systemUsers`/`setSystemUsers` وتأثير حفظه، `currentUserName`/`setCurrentUserName` وتأثيره، كل حالات نموذج المستخدم (`showUserManagementModal`, `editingUserId`, `userForm*`, `showUserPins`, `revealedPinUsers`)، `canEdit`، `getLocalOfflineAdminPin`، `updateLocalOfflineAdminPin`، `isAdminPin`، `isOperatorPin`، `handleOpenUserManagement`، `currentUserRole`/`setCurrentUserRole`، `pendingDeletionRequest` وتأثيره، ثوابت `FIREBASE_*`، `currentSessionIdRef`، `currentUserIdRef`، `activeSessions`، `isCheckingLogin`، حالات مركز الاستعادة (`showRestoreCenterModal`, `availableSnapshots`, `isLoadingSnapshots`, `selectedSnapshotPreview`, `isRestoringSnapshot`)، `loginInputRole`، `loginInputPin`، `loginError`، `isDarkTheme`، `handleLogin`، `handleLogout`، تأثير النبض، تأثير تحرير الجلسة عند الإغلاق، تأثير جلب الجلسات، `handleForceEvictSession`، `handleSaveUser`، `handleEditUserClick`، `handleCancelUserEdit`، `handleDeleteUser`، `handleToggleUserActive`، `isViewer`، `syncStatus`، `cloudSyncStatus`، مراجع `lastCloudTimeRef`/`isInitialCloudLoadCompleteRef`، `fetchCloudData`، `pushDataToCloud`، `fetchAvailableSnapshots`، `handleRestoreSnapshot`، `handleDownloadSnapshot`، تأثير قفل أدوات المطوّرين، تأثيرا بدء وإعادة المزامنة السحابية، `serverVersionRef`/`isSyncingRef`، `pushDataToServer`، `applyDataBundleToState`، تأثير الاستطلاع كل 3 ثوانٍ، تأثير البث التلقائي الأخير.

**لا تُدرِج** `isDarkTheme` إن وجدته مستعملاً لاحقاً بمنطق غير متعلق بالبيانات (فحص فقط — إن كان الأمر كذلك فعلاً يبقى داخل النطاق بلا ضرر، الـhook سيُعيده وحسب).

- [ ] **الخطوة 3: أضِف نفس العلامتين في `cloud/App.jsx`**

نفس المبدأ: `// @data-layer:start` قبل `const defaultSystemUsers = [`، و`// @data-layer:end` بعد إغلاق تأثير البث الأخير المكافئ (ابحث عن نفس نمط مصفوفة الاعتماديات؛ الملف السحابي أطول ويحوي إضافات لا وجود لها في الأوفلاين — `hashDevicePin`، `getDevicePinLock*`، `signInWithEmail`/`signUpWithEmail`، `refreshIdTokenIfNeeded`، `cloudFetch`، `logAuditEvent`، `proceedAfterAuth`، `completeLogin`، `handlePinLogin`، `useAnotherAccount`، `confirmSessionTakeover`، `cancelSessionTakeover`، `pendingTakeover`، `currentUserPermissions`، `lockedSections`، `peerLockTick`، `buildCloudBundle`/`buildCloudBundleRef`، `knownServerUpdateRef`، `isPushingRef`/`pendingPushRef`/`pendingBundleRef`/`lastSyncedSignatureRef`، `CLOUD_SIGNATURE_KEYS`/`cloudPayloadSignature`، `isFetchingCloudRef`، `showSyncModal` — كل هذه تقع بين نفس العلامتين، وتُضاف لقائمة عناصر النطاق أعلاه بالإضافة لا بدلاً منها).

**لا تُدرِج** استدعاءات `setShowSetPinOffer`/`setPendingPinOfferUser` نفسها (هذه حالة عرض نافذة اقتراح الرمز، معرَّفة خارج هذا النطاق على الأرجح) — إن كانت `handleLogin` تستدعيها، فهذا يعني أن هذين الاسمين يدخلان ضمن **معاملات** الـhook (قيم قادمة من خارج النطاق)، لا مُخرَجاته. تحقّق من مكان تعريفهما الفعلي بالبحث في الملف قبل افتراض أي شيء.

- [ ] **الخطوة 4: تحقّق يدوي بسيط**

```bash
cd app
grep -c "@data-layer:start\|@data-layer:end" src/editions/offline/App.jsx src/editions/cloud/App.jsx
```

يجب أن يطبع `2` لكل ملف. ثم اقرأ السطرين المحيطين بكل علامة في كلا الملفين للتأكد أنهما في المكان الصحيح فعلاً (بداية `defaultSystemUsers`، ونهاية تأثير البث الأخير) — هذه العلامات أساس المهمتين 3 و4، فخطأ هنا ينتقل تلقائياً إليهما.

- [ ] **الخطوة 5: التزام**

```bash
git add app/src/data/types.ts app/src/editions/offline/App.jsx app/src/editions/cloud/App.jsx
git commit -m "Mark the data-layer boundary in both editions and add the shared DataBundle type"
```

---

### مهمة 2: أداة `extract-hook.mjs`

**الملفات:**
- Create: `app/scripts/extract-hook.mjs`

**الواجهات:**
- Consumes: العلامتين من المهمة 1.
- Produces: عند `--write`، يكتب `app/src/data/<edition>/use<Edition>DataLayer.ts` ويعدِّل `app/src/editions/<edition>/App.jsx` باستبدال النطاق باستدعاء الـhook.

هذه الأداة تُبنى على نفس أسلوب `app/scripts/extract-pure.mjs` من المرحلة 1 (تحليل TypeScript compiler API لحساب المتغيرات الحرة)، لكن بفارقين جوهريين يلزم تطبيقهما معاً:

1. **تحديد النطاق بعلامتَي نص لا بقائمة أسماء** — لأن النطاق يحوي تأثيرات `React.useEffect` بلا اسم تصريح.
2. **حساب اتجاهين لا واحد**: (أ) المتغيرات الحرة التي يستعملها النطاق من خارجه (معاملات الدخول اللازمة للـhook)، و(ب) الأسماء المُصرَّحة داخل النطاق والمُستعملة في بقية الملف خارجه (ما يجب أن يُعيده الـhook). المرحلة 1 احتاجت الاتجاه الأول فقط (نقل لوحدة مستوردة، لا استدعاء hook)؛ هذه المهمة تحتاج الاثنين معاً لأن الاستدعاء يستبدل مكانه الأصلي ويجب أن يبقى كل اسم مُستعمَل لاحقاً متاحاً بنفس الاسم.

- [ ] **الخطوة 1: اكتب الأداة**

```javascript
// أداة نقل: تنقل النطاق بين علامتي @data-layer:start/end داخل StaffSystem لنسخة واحدة
// إلى hook مستقل، حرفياً، بمعاملات صريحة بدل الإغلاق الضمني على حالة المكوّن.
// الاستعمال: node scripts/extract-hook.mjs <offline|cloud> [--write]
// بلا --write: تجربة جافة تطبع قائمة المعاملات والمُخرَجات المُستنتَجة فقط، بلا كتابة.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(appDir, 'src');
const args = process.argv.slice(2);
const write = args.includes('--write');
const edition = args.find((a) => a !== '--write');
if (!edition || !['offline', 'cloud'].includes(edition)) {
  console.error('usage: extract-hook.mjs <offline|cloud> [--write]');
  process.exit(2);
}

const GLOBALS = new Set(['Math','Date','JSON','Object','Array','String','Number','Boolean','Set','Map','Promise','parseInt','parseFloat','isNaN','isFinite','console','window','document','navigator','undefined','NaN','Infinity','Error','RegExp','encodeURIComponent','decodeURIComponent','alert','confirm','prompt','setTimeout','clearTimeout','setInterval','clearInterval','Intl','Symbol','structuredClone','React','ReactDOM','XLSX','ExcelJS','docx','saveAs','Blob','URL','FileReader','fetch','arguments','localStorage','TextEncoder','crypto','requestAnimationFrame','Uint8Array','btoa','atob','escape','unescape','print','open','location','history','performance','Event','CustomEvent','Image','HTMLElement','Node','Element','getComputedStyle','Response']);

const collect = (n, set) => {
  if (ts.isIdentifier(n)) set.add(n.text);
  else if (ts.isObjectBindingPattern(n) || ts.isArrayBindingPattern(n)) n.elements.forEach((e) => e.name && collect(e.name, set));
};

// نفس زائر المتغيرات الحرة من extract-pure.mjs حرفياً (انظره هناك للتعليقات) — يُستعمَل هنا
// مرتين: مرة على عقدة اصطناعية تضم كل عبارات النطاق (اتجاه المعاملات)، ومرة على عقدة تضم
// كل عبارات المكوّن خارج النطاق (اتجاه المُخرَجات، بعد قصر النتيجة على أسماء النطاق فقط).
function freeVars(statements, declaredOutsideAsScope) {
  const free = new Set();
  const scopes = [new Set(declaredOutsideAsScope || [])];
  const declare = (n) => collect(n, scopes[scopes.length - 1]);
  const isDeclared = (nm) => scopes.some((s) => s.has(nm));
  function visit(n) {
    if (ts.isFunctionLike(n)) {
      scopes.push(new Set());
      if (n.name && ts.isIdentifier(n.name) && (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n))) scopes[scopes.length - 1].add(n.name.text);
      n.parameters.forEach((p) => declare(p.name));
      if (n.body) visit(n.body);
      scopes.pop();
      return;
    }
    if (ts.isBlock(n) || ts.isForStatement(n) || ts.isForOfStatement(n) || ts.isForInStatement(n) || ts.isCatchClause(n) || ts.isCaseBlock(n)) {
      scopes.push(new Set());
      if (ts.isCatchClause(n) && n.variableDeclaration) declare(n.variableDeclaration.name);
      ts.forEachChild(n, visit);
      scopes.pop();
      return;
    }
    if (ts.isVariableDeclaration(n)) { declare(n.name); if (n.initializer) visit(n.initializer); return; }
    if (ts.isFunctionDeclaration(n) && n.name) scopes[scopes.length - 1].add(n.name.text);
    if (ts.isPropertyAccessExpression(n)) { visit(n.expression); return; }
    if (ts.isPropertyAssignment(n)) { if (ts.isComputedPropertyName(n.name)) visit(n.name.expression); visit(n.initializer); return; }
    if (ts.isShorthandPropertyAssignment(n)) { if (!isDeclared(n.name.text)) free.add(n.name.text); return; }
    if (ts.isJsxAttribute(n)) { if (n.initializer) visit(n.initializer); return; }
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tn = n.tagName;
      if (ts.isIdentifier(tn) && /^[A-Z]/.test(tn.text) && !isDeclared(tn.text)) free.add(tn.text);
      n.attributes.properties.forEach(visit);
      return;
    }
    if (ts.isJsxClosingElement(n)) return;
    if (ts.isIdentifier(n)) { if (!isDeclared(n.text)) free.add(n.text); return; }
    ts.forEachChild(n, visit);
  }
  statements.forEach(visit);
  return free;
}

function topLevelDeclaredNames(statements) {
  const names = new Set();
  for (const st of statements) {
    if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach((d) => collect(d.name, names));
    if (ts.isFunctionDeclaration(st) && st.name) names.add(st.name.text);
  }
  return names;
}

const file = path.join(srcDir, 'editions', edition, 'App.jsx');
const text = fs.readFileSync(file, 'utf8');
const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.JSX);

const startMarkerPos = text.indexOf('@data-layer:start');
const endMarkerPos = text.indexOf('@data-layer:end');
if (startMarkerPos === -1 || endMarkerPos === -1) { console.error('علامتا الحدود غير موجودتين — نفّذ المهمة 1 أولاً'); process.exit(1); }

let comp = null;
sf.forEachChild((n) => { if (ts.isFunctionDeclaration(n) && n.name?.text === 'StaffSystem') comp = n; });
if (!comp) { console.error('StaffSystem غير موجودة'); process.exit(1); }
const body = comp.body.statements;

const inRange = (st) => st.getStart() >= startMarkerPos && st.getEnd() <= endMarkerPos;
const regionStatements = body.filter(inRange);
const outsideStatements = body.filter((st) => !inRange(st));
if (!regionStatements.length) { console.error('لا عبارات داخل الحدود — تحقّق من موضع العلامتين'); process.exit(1); }

const declaredInRegion = topLevelDeclaredNames(regionStatements);
const declaredOutside = topLevelDeclaredNames(outsideStatements);

// اتجاه المعاملات: كل ما يستعمله النطاق ولم يُصرَّح داخله، عدا العالميات
const paramsSet = new Set(
  [...freeVars(regionStatements, declaredInRegion)].filter((v) => !GLOBALS.has(v))
);

// اتجاه المُخرَجات: كل اسم مُصرَّح داخل النطاق ومُستعمَل خارجه (في بقية جسم المكوّن)
const usedOutside = freeVars(outsideStatements, new Set());
const returnsSet = new Set([...declaredInRegion].filter((n) => usedOutside.has(n)));

console.log(`[${edition}] عبارات النطاق: ${regionStatements.length}`);
console.log(`معاملات مُستنتَجة (${paramsSet.size}): ${[...paramsSet].sort().join(', ')}`);
console.log(`مُخرَجات مُستنتَجة (${returnsSet.size}): ${[...returnsSet].sort().join(', ')}`);

if (!write) process.exit(0);

const dedent = (s, col) => s.split('\n').map((l, i) => (i === 0 ? l : l.startsWith(' '.repeat(col)) ? l.slice(col) : l.trimStart() === '' ? '' : l)).join('\n');
const first = regionStatements[0];
const last = regionStatements[regionStatements.length - 1];
const col = sf.getLineAndCharacterOfPosition(first.getStart()).character;
const bodyText = dedent(text.slice(first.getStart(), last.getEnd()), col);

const hookName = `use${edition[0].toUpperCase()}${edition.slice(1)}DataLayer`;
const params = [...paramsSet].sort();
const returns = [...returnsSet].sort();

const hookSrc = `import { DataBundle } from '../types';

// نُقل حرفياً من editions/${edition}/App.jsx بأداة extract-hook.mjs — راجع ذلك الملف قبل
// أي تعديل يدوي هنا لاحقاً؛ لا منطق جديد أُضيف أثناء النقل.
export function ${hookName}(deps: {
${params.map((p) => `  ${p}: any;`).join('\n')}
}) {
  const {
${params.map((p) => `    ${p},`).join('\n')}
  } = deps;

${bodyText}

  return {
${returns.map((r) => `    ${r},`).join('\n')}
  };
}
`;

const hookDir = path.join(srcDir, 'data', edition);
fs.mkdirSync(hookDir, { recursive: true });
const hookFile = path.join(hookDir, `${hookName}.ts`);
fs.writeFileSync(hookFile, hookSrc, 'utf8');

const callSrc = `${' '.repeat(col)}const {
${returns.map((r) => `${' '.repeat(col + 4)}${r},`).join('\n')}
${' '.repeat(col)}} = ${hookName}({
${params.map((p) => `${' '.repeat(col + 4)}${p},`).join('\n')}
${' '.repeat(col)}});
`;

const newText = text.slice(0, first.getStart()) + callSrc + text.slice(last.getEnd());
const importLine = `import { ${hookName} } from '../data/${edition}/${hookName}';\n`;
const finalText = newText.replace(/(import ReactDOM from 'react-dom';\r?\n)/, `$1${importLine}`);
fs.writeFileSync(file, finalText, 'utf8');
console.log('تم الكتابة.');
```

- [ ] **الخطوة 2: تجربة جافة على الأوفلاين وفحص النتيجة يدوياً**

```bash
cd app
node scripts/extract-hook.mjs offline
```

اقرأ قائمتَي المعاملات والمُخرَجات المطبوعتين. تحقّق يدوياً (بالعين، بمقارنة القائمة بعناصر الخطوة 2 من المهمة 1) أنهما معقولتان: المُخرَجات يجب أن تضم `currentUserRole`, `currentUserName`, `handleLogin`, `handleLogout`, `canEdit`, `isAdminPin`, `pushDataToServer`, `syncStatus`, `cloudSyncStatus`, `systemUsers`, وأمثالها — لا تكن القائمة فارغة أو ناقصة بشكل واضح. إن بدت ناقصة (اسماً تعرف أنه يُستعمَل خارج النطاق ولم يظهر)، **لا تُصلحها يدوياً في هذه الأداة الآن** — سجِّل الحالة في تقرير المهمة وارفعها كنقطة توقف؛ هذا مؤشر على أن زائر `freeVars` فاته نمط استعمال (مثل استعماله فقط داخل خاصية اختصار JSX معقَّدة) ويحتاج نظراً قبل المتابعة للمهمتين 3 و4.

- [ ] **الخطوة 3: التزام الأداة (بلا تشغيلها بـ--write بعد)**

```bash
git add app/scripts/extract-hook.mjs
git commit -m "Add extract-hook tool for moving the data-layer region into a hook"
```

---

### مهمة 3: تشغيل الأداة على الأوفلاين + تحقق

**الملفات:**
- Modify: `app/src/editions/offline/App.jsx` (عبر الأداة)
- Create: `app/src/data/offline/useOfflineDataLayer.ts` (عبر الأداة)

- [ ] **الخطوة 1: شغّل الأداة فعلياً**

```bash
cd app
node scripts/extract-hook.mjs offline --write
```

- [ ] **الخطوة 2: افحص الناتج بعينك قبل أي بناء**

اقرأ `app/src/data/offline/useOfflineDataLayer.ts` كاملاً — تأكد أن المحتوى مطابق حرفياً لما كان في `App.jsx` (لا فروق نصية، فقط إزاحة مسافة بادئة). اقرأ موضع الاستدعاء الجديد في `App.jsx` وتأكد أنه استبدل النطاق بالضبط بلا بقايا.

- [ ] **الخطوة 3: ابنِ وتحقّق آلياً**

```bash
cd app
npm run typecheck
npm run build:offline
node scripts/check-shell.mjs dist/offline/hr-offline.html offline
```

الثلاثة يجب أن تنجح. فشل `check-shell.mjs` هنا تحديداً (فحص عزل Firebase) خطير: يعني الـhook الجديد جرّ إشارة Firebase غير موجودة أصلاً بالأوفلاين — راجع السبب قبل المتابعة.

- [ ] **الخطوة 4: انشر نسخة سطح المكتب وجرِّب في متصفح حقيقي**

```bash
python scripts/publish-desktop.py offline
```

افتح `نظام_ادارة_الملاك_تجريبي_جديد_أوفلاين.html` من سطح المكتب. جرِّب: تسجيل الدخول برمز مدير، تسجيل الدخول برمز مستعرض، فتح إدارة الحسابات وتعديل/إضافة مستخدم، فتح مركز الاستعادة الزمني. أبلغ عن أي فرق ملحوظ عن السلوك السابق.

- [ ] **الخطوة 5: التزام**

```bash
git add app/src/data/offline app/src/editions/offline/App.jsx
git commit -m "Extract the offline edition's data layer into a hook"
```

---

### مهمة 4: تشغيل الأداة على السحابية + تحقق

**الملفات:**
- Modify: `app/src/editions/cloud/App.jsx` (عبر الأداة)
- Create: `app/src/data/cloud/useCloudDataLayer.ts` (عبر الأداة)

نفس خطوات المهمة 3 بالضبط لكن على `cloud`:

- [ ] **الخطوة 1:** `node scripts/extract-hook.mjs cloud --write`
- [ ] **الخطوة 2:** افحص `app/src/data/cloud/useCloudDataLayer.ts` ونقطة الاستدعاء بعينك — أولِ منطق `pushDataToCloud` (writeClaim/ETag) عناية خاصة لأنه الأكثر حساسية في كل الملف.
- [ ] **الخطوة 3:**
```bash
cd app
npm run typecheck
npm run build:cloud
node scripts/check-shell.mjs dist/cloud/hr-cloud.html cloud
```
فشل `check-shell.mjs` هنا (فحص وجود روابط Firebase الثلاثة) يعني الـhook فقد ثوابت `FIREBASE_*` بطريق الخطأ.
- [ ] **الخطوة 4:** `python scripts/publish-desktop.py cloud` ثم جرِّب فعلياً في متصفح: دخول بريد+كلمة مرور، عرض «تفعيل الرمز الرباعي» وضبطه، تسجيل خروج ثم دخول بالرمز الرباعي، **فتح تبويبين لنفس الحساب خلال 15 ثانية والتأكد من ظهور صندوق تولّي الجلسة (الإصلاح الذي رُفع للتو — تأكد أنه لم يتأثر بهذا النقل)**، تعديل بيانات موظف والتأكد من وصولها لتبويب آخر خلال ثوانٍ.
- [ ] **الخطوة 5:**
```bash
git add app/src/data/cloud app/src/editions/cloud/App.jsx
git commit -m "Extract the cloud edition's data layer into a hook"
```

---

### مهمة 5: مراجعة Codex + تقرير ختامي

**الملفات:** لا تعديل كود — مراجعة فقط.

- [ ] **الخطوة 1:** اجمع فرق كل الالتزامات منذ بداية هذه الخطة (`git diff <قبل المهمة 1>..HEAD`) في ملف واحد.
- [ ] **الخطوة 2:** استدعِ Codex (البوابة الثالثة، `mcp__plugin_engineering-ai-hub_engineering-ai-hub__review_code` أو ما يعادلها) لمراجعة الفرق كاملاً، مع التنبيه الصريح في الطلب: «هذا نقل حرفي مقصود، لا إعادة كتابة — أهم فحص هو: هل تحرّك أي مرجع خارج قائمة معاملات/مُخرَجات الـhook بلا أن يظهر في القائمتين؟ خصوصاً منطق pushDataToCloud (writeClaim/ETag) وproceedAfterAuth/completeLogin/handlePinLogin (صندوق تولّي الجلسة)».
- [ ] **الخطوة 3:** عالج كل ملاحظة Codex أو سجِّلها بقرار صريح (يُقبل/يُرفض ولماذا) — نفس نمط المرحلة 1.
- [ ] **الخطوة 4:** اكتب تقريراً موجزاً بالعربية للمستخدم: ما نُقل، حجم كل ملف قبل/بعد، ملاحظات Codex ونتيجتها، وقائمة نقاط تجربة يدوية متبقية له (إن وُجدت) قبل أي رفع.

**لا `git push` في هذه المرحلة** — الرفع بموافقة صريحة منفصلة بعد أن يجرِّب المستخدم النسختين على سطح المكتب بنفسه (كما جرت العادة في المرحلة 1).
