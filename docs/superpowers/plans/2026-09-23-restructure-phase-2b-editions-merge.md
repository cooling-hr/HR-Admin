# خطة تنفيذ المرحلة 2ب — دمج مصدر النسختين

> **للمنفِّذ:** المهارة المطلوبة: `superpowers:executing-plans` أو
> `superpowers:subagent-driven-development`. الخطوات بصيغة مربّعات `- [ ]` للتتبّع.

**الهدف:** إلغاء ~11,100 سطر مكرَّر بين نسختي الواجهة، باستخراج الجسم المشترك إلى
ملف واحد وترك مدخل رفيع لكل نسخة.

**المعمارية:** الملفان اليوم متطابقان 96.2% (866 سطراً مختلفاً؛ 61 موضعاً بقياس
`-U2` أو 102 بقياس `-U0` — الجرد في المهمة 3 يعتمد `-U0` لأنه أدقّ في الحدود). تُستخرج
الكتل الخاصة بكل نسخة إلى `AuthViews.jsx` الخاص بها، وتُوحَّد الفروق الصغيرة بشرط
`edition`، حتى يصير جسم المكوّن **نصّاً متطابقاً حرفياً** في الملفين — وعندها فقط
يُنقل إلى `app/src/app/StaffSystem.jsx` ويصير المدخلان ~20 سطراً لكل منهما.

**التقنيات:** React 18، Vite 8.3، `vite-plugin-singlefile`. بلا مكتبة جديدة.

**المواصفة:** `docs/superpowers/specs/2026-09-23-editions-source-merge-design.md`

## القيود العامة

- **العزل مقدَّس:** `app/src/app/StaffSystem.jsx` **لا يستورد أي طبقة بيانات**. كل
  نسخة تستورد طبقتها في ملف مدخلها وحده. `check-shell.mjs` يفحص الناتج النهائي
  بحثاً عن `firebase|firebaseio|identitytoolkit|AIza|googleapis|gstatic` ويوقف
  البناء عند أي إشارة في الأوفلاين.
- **نقل حرفي:** بلا ميزة جديدة، وبلا تغيير سلوك أو شكل أو صيغة بيانات. أي تحسين
  يخطر لك أثناء العمل يُسجَّل في التقرير ولا يُنفَّذ.
- **لا اختبارات آلية** (قرار المستخدم 2026-09-16). التحقق: فحص الأنواع + بناء
  النسختين + `check-shell.mjs` + بصمة النصوص + **حارس الكتل المستخرَجة** + مراجعة
  Codex + تجربة المستخدم.
- **ثغرة مُكتشَفة أثناء التنفيذ، وسُدّت:** اسم يسقط من كتلة منقولة **لا يكشفه شيء** —
  `tsc` لا يفحص `.jsx` بهذا العمق، والبناء ينجح، وبصمة النصوص تبقى مطابقة (مُتحقَّق
  منه عملياً بحذف اسم واحد عمداً). لذا أُضيف `scripts/check-authviews.mjs` الذي
  **يرسم كل مكوّن فعلياً** بـ`ctx` وسيط، فيسقط أي معرّف حرّ فوراً باسمه. يُشغَّل بعد
  كل كتلة تُستخرَج:

  ```bash
  node scripts/check-authviews.mjs src/editions/cloud/AuthViews.jsx
  ```
- **بعد كل تعديل:** `cd app && npm run build && python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud`
- **الالتزام باستقلالية؛ `git push` بموافقة المستخدم الصريحة في المحادثة، كل مرة.**
- **لا سطر `Co-Authored-By` في أي التزام.**
- **كل نصوص الواجهة عربية**، ولا يُترجم نصٌّ قائم.
- **ترتيب التصريح:** لا يُعاد ترتيب أي تصريح إلا لضرورة، فقيمة `useState`/`useMemo`
  الأولية تُنفَّذ أثناء الرسم ويسبب تقديمها/تأخيرها شاشة بيضاء (TDZ).

## الواجهة المستهدفة (تلتزم بها المهام 3 و4 و6 معاً)

```jsx
// توقيع الجسم المشترك بعد المهمة 5
function StaffSystem({ edition, useDataLayer, AuthViews }) { /* ... */ }
```

| الـprop | النوع | المعنى |
|---|---|---|
| `edition` | `'offline' \| 'cloud'` | يُستعمل في الفروق الصغيرة وحدها |
| `useDataLayer` | دالة hook على مستوى الوحدة | تُستدعى داخل الجسم في موضع الاستدعاء الحالي |
| `AuthViews` | كائن مكوّنات | `{ WelcomeActions, LoginFields, UserFormFields, HeaderExtras, Overlays }` |

**اصطلاح ثابت لكل مكوّن في `AuthViews`:** يستقبل **prop واحداً اسمه `ctx`**، كائن
يُبنى في موضع الاستدعاء ويحوي كل معرّف تقرأه الكتلة من نطاقها المحيط. لا قوائم
props طويلة ولا تخمين: ما تقرأه الكتلة يُوضع في `ctx`، وفحص الأنواع والبناء
يكشفان أي نقص.

| مكوّن | ماذا يغلّف |
|---|---|
| `WelcomeActions` | أزرار شاشة الترحيب وسلوك الدخول منها |
| `LoginFields` | حقول نافذة الدخول الداخلية (رمز مقابل بريد/كلمة مرور) |
| `UserFormFields` | الحقول الخاصة بالنسخة في نموذج المستخدم |
| `HeaderExtras` | إضافات الشريط العلوي (شارة المزامنة، حالة الاتصال) |
| `SyncModal` | نافذة تفاصيل المزامنة |
| `PinScreen` | شاشة الدخول السريع بالرمز الرباعي |
| `SetPinOffer` | عرض تفعيل الرمز الرباعي بعد أول دخول كامل |

نسخةٌ لا تحتاج مكوّناً تُصدّره `() => null` — لا شرط في الجسم المشترك.

**تصحيح أثناء التنفيذ:** كانت الطبقات الكاملة مُقترَحة في مكوّن واحد اسمه
`Overlays`. تبيّن أن هذا خطر: الطبقات متباعدة في الشجرة، وجمعها في موضع واحد يغيّر
سياق تكديسها — وقد سبق أن حبس ذلك النوافذ في هذا المشروع. فصارت كل طبقة مكوّناً
باسمها، يُستدعى في موضعها الأصلي بالضبط.

## خريطة الملفات

| الملف | المصير |
|---|---|
| `app/src/editions/offline/App.jsx` (11,284 سطراً) | يصير مدخلاً رفيعاً (~20 سطراً) |
| `app/src/editions/cloud/App.jsx` (11,800 سطراً) | يصير مدخلاً رفيعاً (~20 سطراً) |
| `app/src/app/StaffSystem.jsx` | **جديد** — المقدّمة والمكوّن ودوال الذيل (~11,000 سطر) |
| `app/src/editions/offline/AuthViews.jsx` | **جديد** — كتل الأوفلاين الخاصة |
| `app/src/editions/cloud/AuthViews.jsx` | **جديد** — كتل السحابية الخاصة |
| `app/scripts/compare-ui-strings.mjs` | **جديد** — أداة بصمة النصوص |

**بنية الملفين اليوم (أرقام الأسطر قبل المهمة 1):**

| المقطع | offline | cloud | متطابق؟ |
|---|---|---|---|
| الاستيرادات | 1–11 | 1–11 | لا (سطر 3) |
| المقدّمة (`safeStorage` وغيرها) | 12–299 | 12–299 | **نعم، حرفياً** |
| المكوّن `StaffSystem` | 300–10976 | 300–11492 | فيه الفروق الـ61 |
| دوال الذيل (منتقي التاريخ…) | 10977–11285 | 11493–11801 | **نعم، حرفياً** |
| `ReactDOM.render` | 11286 | 11802 | نعم |

---

## المهمة 1: إصلاح فرق غير مقصود في طلب الحذف

فرق موجود منذ ما قبل إعادة الهيكلة (موجود كذلك في الملفات المجمَّدة): طلب الحذف
الرسمي في الأوفلاين لا يسجّل اسم من طلبه.

**الملفات:**
- Modify: `app/src/editions/offline/App.jsx:3752`

- [ ] **الخطوة 1: طبّق التعديل**

في `app/src/editions/offline/App.jsx` بدّل:

```js
                        requestedBy: dataEntryOperator || 'الإداري المُدخل',
```

إلى:

```js
                        requestedBy: currentUserName || dataEntryOperator || 'الإداري المُدخل',
```

- [ ] **الخطوة 2: تأكّد أن `currentUserName` متاح فعلاً في هذا النطاق**

```bash
cd app && grep -n "^                currentUserName,$" src/editions/offline/App.jsx
```

المتوقع: سطر واحد ضمن تفكيك `useOfflineDataLayer`. لو لم يظهر — **توقّف** ولا
تكمل، فالمتغيّر غير موجود والتعديل يُنتج `ReferenceError`.

- [ ] **الخطوة 3: تحقّق أن الفرق اختفى**

```bash
cd app && diff <(grep -o "requestedBy:.*" src/editions/offline/App.jsx) <(grep -o "requestedBy:.*" src/editions/cloud/App.jsx)
```

المتوقع: لا مخرجات.

- [ ] **الخطوة 4: ابنِ وانشر**

```bash
cd app && npm run typecheck && npm run build && python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud
```

المتوقع: `OK dist/offline/...` و`OK dist/cloud/...`.

- [ ] **الخطوة 5: التزم**

```bash
git add app/src/editions/offline/App.jsx
git commit -m "Record the requesting user on an offline deletion request

The cloud edition and index.html have recorded currentUserName since
before the restructure; the offline edition was never updated, so a
formal deletion request sent to the system admin lost the name of
whoever actually filed it."
```

---

## المهمة 2: أداة بصمة النصوص والتقاط المرجع

البناء يُصغِّر الأسماء، فمقارنة الملف المبني حرفياً بلا فائدة. لكن **النصوص العربية
تنجو من التصغير** (1,462 نصاً فريداً في الأوفلاين، مُتحقَّق منه فعلياً)، فتصلح بصمةً
تكشف أي كتلة تسقط أو تتبدّل أثناء النقل.

**الملفات:**
- Create: `app/scripts/compare-ui-strings.mjs`
- Create: `app/.baseline/` (يُضاف إلى `.gitignore`)

**الواجهة (تعتمد عليها المهام 3–6):**
- ينتج: `node scripts/compare-ui-strings.mjs <ملف-مبني> --save <بصمة>` لحفظ مرجع،
  و`node scripts/compare-ui-strings.mjs <ملف-مبني> --against <بصمة>` للمقارنة،
  ورمز خروج `1` عند أي فرق.

- [ ] **الخطوة 1: اكتب الأداة**

أنشئ `app/scripts/compare-ui-strings.mjs`:

```js
// بصمة نصوص الواجهة: البناء يُصغّر الأسماء فمقارنة الناتج حرفياً بلا فائدة،
// لكن النصوص العربية تنجو كما هي. نقلٌ حرفي يجب ألا يغيّر مجموعة النصوص إطلاقاً.
import fs from 'node:fs';

const [, , file, mode, ref] = process.argv;
if (!file || !['--save', '--against'].includes(mode) || !ref) {
    console.error('usage: node scripts/compare-ui-strings.mjs <built.html> --save|--against <ref.txt>');
    process.exit(2);
}
const extract = (path) => {
    const txt = fs.readFileSync(path, 'utf8');
    const found = txt.match(/[\u0600-\u06FF][\u0600-\u06FF\s\u060C\u061F0-9%:،.\-()/]{2,}/g) || [];
    return [...new Set(found.map((s) => s.trim()))].sort();
};
const current = extract(file);
if (mode === '--save') {
    fs.mkdirSync(ref.replace(/[\\/][^\\/]*$/, ''), { recursive: true });
    fs.writeFileSync(ref, current.join('\n'), 'utf8');
    console.log(`SAVED ${ref} — ${current.length} نصاً`);
    process.exit(0);
}
const before = new Set(fs.readFileSync(ref, 'utf8').split('\n').filter(Boolean));
const after = new Set(current);
const removed = [...before].filter((s) => !after.has(s));
const added = [...after].filter((s) => !before.has(s));
if (!removed.length && !added.length) {
    console.log(`OK ${file} — البصمة مطابقة (${current.length} نصاً)`);
    process.exit(0);
}
console.error(`DIFF ${file} — ناقص ${removed.length}، زائد ${added.length}`);
removed.slice(0, 40).forEach((s) => console.error('  - ' + s));
added.slice(0, 40).forEach((s) => console.error('  + ' + s));
process.exit(1);
```

- [ ] **الخطوة 2: استثنِ مجلد المرجع من Git**

أضف سطراً إلى `app/.gitignore`:

```
.baseline/
```

- [ ] **الخطوة 3: ابنِ والتقط المرجع**

```bash
cd app && npm run build
node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --save .baseline/offline.txt
node scripts/compare-ui-strings.mjs dist/cloud/hr-cloud.html --save .baseline/cloud.txt
```

المتوقع: `SAVED .baseline/offline.txt — 1462 نصاً` تقريباً، ومثلها للسحابية.

- [ ] **الخطوة 4: تأكّد أن الأداة تكشف فرقاً فعلاً (وإلا فهي حارس أعمى)**

```bash
cd app
node -e "const fs=require('fs');const t=fs.readFileSync('dist/offline/hr-offline.html','utf8');fs.writeFileSync('dist/offline/_probe.html',t.replace('استمارة تجهيز مياه معدنية','XX'),'utf8')"
node scripts/compare-ui-strings.mjs dist/offline/_probe.html --against .baseline/offline.txt; echo "رمز الخروج: $?"
rm dist/offline/_probe.html
```

المتوقع: `DIFF` مع سطر `- استمارة تجهيز مياه معدنية`، ورمز الخروج `1`. لو ظهر
`OK` فالأداة لا تكشف شيئاً ولا تُعتمد — أصلحها قبل المتابعة.

- [ ] **الخطوة 5: التزم**

```bash
git add app/scripts/compare-ui-strings.mjs app/.gitignore
git commit -m "Add a UI-string fingerprint check for the editions merge

Minification renames identifiers, so diffing the built file across a
pure-move refactor is noise. Arabic UI strings survive it intact, so
the sorted set of them is a fingerprint: a dropped or altered block
changes it, and a faithful move does not."
```

---

## المهمة 3: استخراج كتل السحابية الخاصة

**الملفات:**
- Create: `app/src/editions/cloud/AuthViews.jsx`
- Modify: `app/src/editions/cloud/App.jsx`

**الواجهة:**
- يستهلك: أداة المهمة 2 والمرجع `.baseline/cloud.txt`.
- ينتج: `export const AuthViews = { WelcomeActions, LoginFields, UserFormFields, HeaderExtras, Overlays }`
  من `cloud/AuthViews.jsx`، وكل مكوّن يستقبل `ctx` واحداً.

- [ ] **الخطوة 1: راجع جرد الكتل**

الجرد التالي مقيس بـ`-U0` (بلا أسطر سياق) قبل المهمة 1 — **الأرقام تنزاح مع كل
تعديل، فأعد اشتقاقها قبل كل كتلة** بـ:

```bash
cd app && git diff --no-index -U0 src/editions/offline/App.jsx src/editions/cloud/App.jsx | grep "^@@"
```

الكتل الأكبر من 6 أسطر (20 كتلة؛ والباقي 82 موضعاً صغيراً تُترك للمهمة 5):

| offline | cloud | الحجم | التصنيف المقترح |
|---|---|---|---|
| 787–788 | 788–799 | -2/+12 | حالات الرمز الرباعي → `Overlays` |
| 871–872 | 918–938 | -2/+21 | شاشة الترحيب → `WelcomeActions` |
| 4146–4147 | 4229–4233 | -2/+5 | تعليق فاصل الصفحة → المهمة 5 (تعليق فقط) |
| 4899 | 4989–5160 | -1/+172 | شاشة الرمز الرباعي → `Overlays` |
| 4923–4929 | 5184–5185 | -7/+2 | قائمة المستخدم → `HeaderExtras` |
| — | 5223–5254 | -0/+32 | شارة حالة المزامنة → `HeaderExtras` |
| 5008–5027 | 5296–5329 | -20/+34 | قائمة المستخدم → `HeaderExtras` |
| — | 5510–5618 | -0/+109 | نافذة المزامنة → `Overlays` |
| 5441–5444 | 5855–5858 | -4/+4 | نصّ نافذة الدخول → المهمة 5 (نصّ) |
| — | 5861–5884 | -0/+24 | حقول الدخول السحابي → `LoginFields` |
| 5448 | 5886–5915 | -1/+30 | حقول الدخول → `LoginFields` |
| 5530–5544 | — | -15/+0 | تنبيه رمز المدير المحلي → `LoginFields` |
| 5602 | 6055–6098 | -1/+44 | نموذج المستخدم → `UserFormFields` |
| 5604–5609 | 6100–6105 | -6/+6 | نموذج المستخدم → `UserFormFields` |
| 5696–5702 | — | -7/+0 | حقل الرمز المحلي → `UserFormFields` |
| 5766–5782 | 6256–6259 | -17/+4 | كشف الرموز → `UserFormFields` |
| 5784–5786 | 6261–6267 | -3/+7 | كشف الرموز → `UserFormFields` |
| 5809–5816 | 6290–6303 | -8/+14 | أزرار المستخدم → `UserFormFields` |
| 5968–5973 | 6454–6461 | -6/+8 | إدارة الحسابات → `UserFormFields` |
| 6057–6064 | 6556–6565 | -8/+10 | إدارة الحسابات → `UserFormFields` |

**ملاحظة مطمئنة:** كل الكتل الكبيرة محصورة بين السطرين ~787 و~6565. ما بعد ذلك
(~4,400 سطر حتى نهاية المكوّن) لا يحوي إلا فروقاً صغيرة، فهو منطقة آمنة نسبياً.

- [ ] **الخطوة 2: أنشئ الملف بمكوّن واحد أولاً (الأصغر: `HeaderExtras`)**

انقل كتلة شارة حالة المزامنة كما هي حرفياً:

```jsx
import React from 'react';

// كتل الواجهة الخاصة بالنسخة السحابية. كل مكوّن يستقبل ctx واحداً يحوي ما تقرأه
// الكتلة من نطاق StaffSystem — الاصطلاح موحَّد فلا قوائم props طويلة.
export const HeaderExtras = ({ ctx }) => {
    const { cloudSyncStatus } = ctx;
    return (
        <>
            {/* الصق هنا كتلة الشارة كما هي حرفياً */}
        </>
    );
};
```

**لا تُعِد صياغة أي سطر.** انسخ والصق، ثم استبدل المعرّفات الحرة بقراءة من `ctx`.

- [ ] **الخطوة 3: استبدل الكتلة في `App.jsx` بالاستدعاء**

```jsx
<AuthViews.HeaderExtras ctx={{ cloudSyncStatus }} />
```

- [ ] **الخطوة 4: تحقّق بعد هذا المكوّن وحده**

```bash
cd app && npm run typecheck && npm run build:cloud
node scripts/compare-ui-strings.mjs dist/cloud/hr-cloud.html --against .baseline/cloud.txt
```

المتوقع: `OK` في الاثنين. أي `DIFF` يعني أن نصاً سقط في النقل — عالجه قبل المتابعة.

- [ ] **الخطوة 5: كرّر الخطوات 2–4 لكل مكوّن من الأربعة الباقية**

واحداً واحداً، وبناء وتحقّق بعد كلٍّ منها. **لا تنقل مكوّنين قبل التحقق من الأول.**

- [ ] **الخطوة 6: غيّر توقيع المكوّن ونقطة التركيب**

في `app/src/editions/cloud/App.jsx`، سطر 300:

```jsx
        function StaffSystem({ edition, useDataLayer, AuthViews }) {
```

وموضع استدعاء الـhook:

```jsx
            } = useDataLayer({
```

وسطر التركيب في آخر الملف:

```jsx
        ReactDOM.render(
            <StaffSystem edition="cloud" useDataLayer={useCloudDataLayer} AuthViews={CloudAuthViews} />,
            document.getElementById('root')
        );
```

مع استيراد في أعلى الملف:

```js
import * as CloudAuthViews from './AuthViews.jsx';
```

- [ ] **الخطوة 7: تحقّق كامل وانشر**

```bash
cd app && npm run typecheck && npm run build
node scripts/compare-ui-strings.mjs dist/cloud/hr-cloud.html --against .baseline/cloud.txt
node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --against .baseline/offline.txt
python scripts/publish-desktop.py cloud
```

المتوقع: الثلاثة `OK`. بصمة الأوفلاين يجب أن تبقى مطابقة لأن هذه المهمة لم تمسّها.

- [ ] **الخطوة 8: التزم**

```bash
git add app/src/editions/cloud/
git commit -m "Extract the cloud edition's auth and sync views

Five components behind one ctx prop each, so the body they came from
can become shared source in a later task without carrying cloud-only
markup into the offline bundle."
```

---

## المهمة 4: استخراج كتل الأوفلاين الخاصة

نفس منهج المهمة 3 بالضبط، على النسخة الأوفلاين، وبنفس أسماء المكوّنات الخمسة.

**الملفات:**
- Create: `app/src/editions/offline/AuthViews.jsx`
- Modify: `app/src/editions/offline/App.jsx`

**الواجهة:**
- يستهلك: نفس أسماء المكوّنات من المهمة 3 — `WelcomeActions`, `LoginFields`,
  `UserFormFields`, `HeaderExtras`, `Overlays`، كلٌّ بـ`ctx` واحد.
- ينتج: `app/src/editions/offline/AuthViews.jsx` بنفس الصادرات الخمس.

- [ ] **الخطوة 1: أنشئ الملف بالمكوّنات الخمس**

مكوّن لا تحتاجه الأوفلاين يُصدَّر فارغاً — لا شرط في الجسم المشترك:

```jsx
import React from 'react';

// الأوفلاين بلا مزامنة سحابية، فلا إضافات في الشريط العلوي ولا طبقات دخول إضافية.
export const HeaderExtras = () => null;
export const Overlays = () => null;
```

والباقي (`WelcomeActions`, `LoginFields`, `UserFormFields`) تُنقل كتلها حرفياً بنفس
أسلوب المهمة 3: نسخ ولصق، ثم استبدال المعرّفات الحرة بقراءة من `ctx`.

- [ ] **الخطوة 2: انقل مكوّناً واحداً وتحقّق**

```bash
cd app && npm run typecheck && npm run build:offline
node scripts/check-shell.mjs dist/offline/hr-offline.html offline
node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --against .baseline/offline.txt
```

المتوقع: الثلاثة `OK`. فشل `check-shell.mjs` هنا يعني أن استيراداً سحابياً تسلّل —
**توقّف فوراً وراجع الاستيرادات**.

- [ ] **الخطوة 3: كرّر لكل مكوّن باقٍ، بناءً وتحققاً بعد كلٍّ منه**

- [ ] **الخطوة 4: غيّر التوقيع ونقطة التركيب**

في `app/src/editions/offline/App.jsx`، سطر 300:

```jsx
        function StaffSystem({ edition, useDataLayer, AuthViews }) {
```

وموضع استدعاء الـhook:

```jsx
            } = useDataLayer({
```

وسطر التركيب:

```jsx
        ReactDOM.render(
            <StaffSystem edition="offline" useDataLayer={useOfflineDataLayer} AuthViews={OfflineAuthViews} />,
            document.getElementById('root')
        );
```

مع استيراد في أعلى الملف:

```js
import * as OfflineAuthViews from './AuthViews.jsx';
```

- [ ] **الخطوة 5: تحقّق كامل وانشر**

```bash
cd app && npm run typecheck && npm run build
node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --against .baseline/offline.txt
node scripts/compare-ui-strings.mjs dist/cloud/hr-cloud.html --against .baseline/cloud.txt
python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud
```

- [ ] **الخطوة 6: التزم**

```bash
git add app/src/editions/offline/
git commit -m "Extract the offline edition's auth views

Same five component names as the cloud edition, so both bodies can
converge on one shared source. The two the offline edition has no use
for export null rather than making the shared body test the edition."
```

---

## المهمة 5: توحيد الفروق الصغيرة الباقية

بعد المهمتين 3 و4 تبقى المواضع الصغيرة (82 موضعاً بقياس `-U0`، ~120 سطراً):
تعليقات ومسافات ونصوص واجهة وأزرار. هدف هذه المهمة: **أن يصير جسم المكوّن نصّاً
متطابقاً حرفياً في الملفين.**

**الملفات:**
- Modify: `app/src/editions/offline/App.jsx`
- Modify: `app/src/editions/cloud/App.jsx`

- [ ] **الخطوة 1: استخرج قائمة ما تبقّى**

```bash
cd app && git diff --no-index -U0 src/editions/offline/App.jsx src/editions/cloud/App.jsx > "$TEMP/rest.diff"; grep -c "^@@" "$TEMP/rest.diff"
```

- [ ] **الخطوة 2: عالج كل موضع بإحدى ثلاث**

1. **فرق تعليق فقط** (مثل تعليق فاصل الصفحة الناقص في الأوفلاين): وحّد النصّ
   بنسخ التعليق الأوفى إلى الاثنين. لا أثر سلوكي.
2. **فرق نصّ واجهة أو زر**: شرط صريح في الجسم، مثل:

```jsx
{edition === 'cloud'
    ? 'الدخول بحساب موثّق عبر Firebase — تُحدَّد صلاحياتك آلياً حسب حسابك'
    : 'يتعرف النظام آلياً على صفة المستخدم فور إدخال كلمة المرور'}
```

3. **فرق مسافات فارغة فقط**: وحّده بلا تفكير.

**قاعدة إلزامية:** بعد كل موضع، الملفان أقرب للتطابق ولا يبتعدان أبداً. لا تُجرِ
أي تعديل «تحسيني» هنا.

- [ ] **الخطوة 3: تحقّق من التطابق الحرفي للجسم**

يُقارَن من أول سطر في المكوّن حتى السطر السابق لـ`ReactDOM.render`، فالاستيرادات
ونقطة التركيب هما الفرقان المشروعان الوحيدان:

```bash
cd app
oEnd=$(grep -n "ReactDOM.render(" src/editions/offline/App.jsx | cut -d: -f1)
cEnd=$(grep -n "ReactDOM.render(" src/editions/cloud/App.jsx | cut -d: -f1)
diff <(sed -n "300,$((oEnd-1))p" src/editions/offline/App.jsx) <(sed -n "300,$((cEnd-1))p" src/editions/cloud/App.jsx) && echo "متطابق حرفياً ✓"
```

المتوقع: `متطابق حرفياً ✓` بلا أي مخرجات قبله. إن بقي فرق، عالجه قبل المتابعة —
المهمة 6 تفترض التطابق التام ولا تعمل بدونه.

- [ ] **الخطوة 4: تحقّق وانشر**

```bash
cd app && npm run typecheck && npm run build
node scripts/check-shell.mjs dist/offline/hr-offline.html offline
node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --against .baseline/offline.txt
node scripts/compare-ui-strings.mjs dist/cloud/hr-cloud.html --against .baseline/cloud.txt
python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud
```

**ملاحظة متوقَّعة:** بصمة كل نسخة قد تزيد بنصوص النسخة الأخرى، لأن شرط `edition`
يُبقي النصّين في الحزمتين. هذا مقبول ومقصود للنصوص وحدها (~120 سطراً)، ولا يمسّ
العزل لأنها نصوص عربية لا شيفرة Firebase. أي **نقص** في البصمة عطلٌ يجب أن يُعالَج.

- [ ] **الخطوة 5: التزم**

```bash
git add app/src/editions/
git commit -m "Converge the two edition bodies on identical text

The remaining differences were comments, whitespace and a handful of
UI strings; the strings now branch on the edition prop. The component
body is byte-identical between the two files, which is what lets the
next task lift it into one shared source."
```

---

## المهمة 6: استخراج الجسم المشترك

**الملفات:**
- Create: `app/src/app/StaffSystem.jsx`
- Modify: `app/src/editions/offline/App.jsx` (يصير ~20 سطراً)
- Modify: `app/src/editions/cloud/App.jsx` (يصير ~20 سطراً)

**الواجهة:**
- ينتج: `export function StaffSystem({ edition, useDataLayer, AuthViews })` من
  `app/src/app/StaffSystem.jsx`.

- [ ] **الخطوة 1: أنشئ الملف المشترك**

```bash
cd app && mkdir -p src/app
```

انسخ إلى `src/app/StaffSystem.jsx` من `src/editions/offline/App.jsx`:

- **الاستيرادات (1–11) عدا `ReactDOM` وعدا طبقة البيانات وعدا `AuthViews`.**
  `ReactDOM` يبقى في المدخل لأن التركيب هناك؛ وطبقة البيانات **يُمنع** استيرادها
  هنا (قيد العزل).
- **المقدّمة كاملة** (`safeStorage` وما معها).
- **المكوّن كاملاً**، مع تصديره: `export function StaffSystem({ edition, useDataLayer, AuthViews }) {`
- **دوال الذيل كاملة** (`triggerReactInputChange`, `buildDatePicker`,
  `closeAllPickers`, ومستمعا الأحداث).

**لا تنسخ** سطر `ReactDOM.render`.

- [ ] **الخطوة 2: تأكّد ألا طبقة بيانات في الملف المشترك**

```bash
cd app && grep -n "useCloudDataLayer\|useOfflineDataLayer\|data/cloud\|data/offline" src/app/StaffSystem.jsx
```

المتوقع: **لا مخرجات**. أي مخرجات تعني خرق قيد العزل — احذف السطر.

- [ ] **الخطوة 3: اجعل مدخل الأوفلاين رفيعاً**

استبدل كامل `app/src/editions/offline/App.jsx` بـ:

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { StaffSystem } from '../../app/StaffSystem.jsx';
import { useOfflineDataLayer } from '../../data/offline/useOfflineDataLayer.js';
import * as OfflineAuthViews from './AuthViews.jsx';

ReactDOM.render(
    <StaffSystem edition="offline" useDataLayer={useOfflineDataLayer} AuthViews={OfflineAuthViews} />,
    document.getElementById('root')
);
```

- [ ] **الخطوة 4: تحقّق من الأوفلاين وحده قبل لمس السحابية**

```bash
cd app && npm run typecheck && npm run build:offline
node scripts/check-shell.mjs dist/offline/hr-offline.html offline
node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --against .baseline/offline.txt
```

المتوقع: الثلاثة `OK`. **لا تكمل قبل نجاحها** — إن فشلت والسحابية ما زالت على
ملفها القديم، فالخلل محصور في خطوة واحدة.

- [ ] **الخطوة 5: اجعل مدخل السحابية رفيعاً**

استبدل كامل `app/src/editions/cloud/App.jsx` بـ:

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { StaffSystem } from '../../app/StaffSystem.jsx';
import { useCloudDataLayer } from '../../data/cloud/useCloudDataLayer.js';
import * as CloudAuthViews from './AuthViews.jsx';

ReactDOM.render(
    <StaffSystem edition="cloud" useDataLayer={useCloudDataLayer} AuthViews={CloudAuthViews} />,
    document.getElementById('root')
);
```

- [ ] **الخطوة 6: تحقّق كامل وانشر**

```bash
cd app && npm run typecheck && npm run build
node scripts/check-shell.mjs dist/offline/hr-offline.html offline
node scripts/check-shell.mjs dist/cloud/hr-cloud.html cloud
node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --against .baseline/offline.txt
node scripts/compare-ui-strings.mjs dist/cloud/hr-cloud.html --against .baseline/cloud.txt
python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud
```

- [ ] **الخطوة 7: أبلغ عن الأرقام**

```bash
cd app && wc -l src/app/StaffSystem.jsx src/editions/offline/App.jsx src/editions/cloud/App.jsx src/editions/offline/AuthViews.jsx src/editions/cloud/AuthViews.jsx
```

- [ ] **الخطوة 8: التزم**

```bash
git add app/src/app app/src/editions
git commit -m "Lift the shared body into one source for both editions

The two App.jsx files are now entry points that differ only in which
data layer and which auth views they hand to the shared component.
Offline isolation still rests on the import graph: the shared file
imports no data layer at all, and check-shell.mjs keeps verifying the
built output."
```

---

## المهمة 7: مراجعة Codex والتقرير وقائمة تجربة المستخدم

**الملفات:** لا تعديل كود — مراجعة وتقرير.

- [ ] **الخطوة 1: اجمع الفرق كاملاً**

```bash
cd "e:/Claude Projects/HR Admin" && git diff <التزام-ما-قبل-المهمة-1>..HEAD -- app/src > "$TEMP/phase2b.diff"; wc -l "$TEMP/phase2b.diff"
```

- [ ] **الخطوة 2: استدعِ Codex**

أرسل الفرق مع هذا التنبيه الصريح: «هذا نقل حرفي مقصود لا إعادة كتابة. أهم فحص:
هل يقرأ الجسم المشترك معرّفاً لا يوجد إلا في نسخة واحدة، خارج ما يصل عبر `ctx` أو
`AuthViews`؟ وهل بقي أي استيراد لطبقة بيانات في الملف المشترك؟ وهل تغيّر ترتيب أي
تصريح `useState`/`useMemo` بحيث يُقرأ قبل تعريفه أثناء الرسم (TDZ)؟» **لا تُرسل أي
بيانات حقيقية** — كود فقط.

- [ ] **الخطوة 3: عالج كل ملاحظة أو سجّلها بقرار صريح**

كل ملاحظة إما تُصلَح، أو تُرفَض بسبب مكتوب. لا ملاحظة تُترك بلا قرار.

- [ ] **الخطوة 4: اكتب قائمة التجربة للمستخدم**

قائمة عربية موجزة يجرّبها على سطح المكتب **قبل أي رفع**:

**الأوفلاين:** الدخول برمز مدير، الدخول برمز مستعرض، إدارة الحسابات (إضافة/تعديل
مستخدم، كشف الرمز)، شاشة الترحيب، تعديل موظف وحفظه، مركز الاستعادة، طباعة كشف.

**السحابية:** الدخول ببريد وكلمة مرور، ضبط الرمز الرباعي ثم الدخول به، فتح تبويبين
لنفس الحساب خلال 15 ثانية والتأكد من ظهور صندوق تولّي الجلسة، نافذة المزامنة
وشارة حالتها، تعديل موظف والتأكد من وصوله لتبويب آخر خلال ثوانٍ.

**في النسختين:** ترتيب الأسماء في «الكل» و«الوحدات» — تبريد المكينة يجب أن يبدأ
بفوزي ثم محمد عيسى ثم آيار ثم محمد ريسان ثم ذكاء.

- [ ] **الخطوة 5: أبلغ ولا ترفع**

تقرير عربي: ما نُقل، أحجام الملفات قبل/بعد، ملاحظات Codex وقراراتها، وقائمة
التجربة. **لا `git push`** — الرفع بموافقة المستخدم الصريحة بعد أن يجرّب بنفسه.
