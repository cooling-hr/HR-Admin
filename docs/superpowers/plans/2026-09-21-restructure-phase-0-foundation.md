# الانتقال الاحترافي — المرحلة 0 (الهيكل والبناء) — خطة التنفيذ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** بناء النسختين (أوفلاين ثم سحابية) من مشروع Vite واحد في `app/` بسلوك مطابق تماماً للملفات الحية، دون المساس بها.

**Architecture:** سكربت استخراج لمرة واحدة ينقل كتلة JSX من كل ملف حي إلى وحدة `App.jsx` خاصة بالنسخة كما هي حرفياً، ويُبقي بقية الصفحة (الرأس والأنماط والسكربتات المضمّنة) قالباً. Vite مع `vite-plugin-singlefile` يجمّع كل نسخة في ملف HTML واحد. React يُحزَّم من npm بدل UMD، ويُحذف Babel والمُحمِّل. Tailwind والمكتبات الثقيلة تبقى تُحمَّل من CDN كما هي في هذه المرحلة.

**Tech Stack:** Node 24، Vite `^8.3.0`، `vite-plugin-singlefile@^2.3.3`، `@vitejs/plugin-react@^6.1.1`، TypeScript `~5.9.3`، React/ReactDOM `18.3.1`.

**Spec:** `docs/superpowers/specs/2026-09-21-professional-restructure-design.md`

## Global Constraints

- لا يتغير أي ملف حي في جذر المستودع (`index.html`، `..._cloud.html`، `..._offline.html`، `sw.js`، `manifest.json`، الأيقونات) قبل المهمة 5، ولا تُنفَّذ المهمة 5 إلا بموافقة صريحة.
- لا ميزات جديدة، ولا تغيير في الشكل أو السلوك أو صيغة البيانات.
- React 18 نفسه، بلا مكتبة حالة ولا إطار إضافي.
- النسخة الأوفلاين: صفر إشارات إلى `firebaseio` و`identitytoolkit` و`AIza` في الملف الناتج.
- الأوفلاين أولاً: لا تبدأ المهمة 4 (السحابية) قبل إقرار المستخدم للمهمة 3.
- لا `git push` بلا موافقة صريحة في المحادثة. الالتزام (commit) بحكمك.
- لا سطر `Co-Authored-By` في أي التزام.
- لا اختبارات آلية (قرار المستخدم 2026-09-16). بوابات هذه المرحلة: نجاح البناء، وفحوص السكربتات المذكورة، ومراجعة Codex (البوابة الثالثة في `CLAUDE.md`)، وتجربة المستخدم الفعلية.
- لا بيانات حقيقية (أسماء/أرقام وظيفية) تُرسَل إلى أي مساعد خارجي.
- الرد والتقارير بالعربية.

## Rulings (قرارات اتُّخذت أثناء كتابة الخطة، مع السبب)

1. **Tailwind يبقى من CDN في المرحلة 0.** في `index.html` 82 سطراً تبني `className` بقوالب نصية (`${...}`)، والـCDN يقرأ الأصناف من الصفحة الحية أما البناء المسبق فيقرأ النص فقط ويفوته ما يُركَّب وقت التشغيل — يظهر هذا بصمت كعنصر بلا تنسيق. لذلك يصير نقل Tailwind لوقت البناء خطوة مستقلة لاحقة بعد إقرار المرحلة 0. (يخالف سطر «Tailwind يُبنى وقت البناء» في المواصفة، ويُعدَّل هناك.)
2. **كل نسخة تحمل نسختها من `App.jsx` مؤقتاً** (2014 سطراً تختلف بين الملفين). الدمج في مصدر واحد يحدث في المرحلة 2 (طبقة البيانات) لا هنا.
3. **علامة القشرة في `sw.js`:** يتحقق `sw.js` من وجود `id="hr-app-source"` في الصفحة قبل تخزينها. بعد الانتقال يختفي وسم السكربت الذي يحمله، فتنكسر ميزة الفتح دون إنترنت بصمت. الحل: وسم `<meta name="hr-app-shell" id="hr-app-source" content="1">` في القالب، فيعمل `sw.js` القديم والجديد بلا تعديل.
4. **ملفات الاختبار على سطح المكتب بأسماء جديدة** (`..._تجريبي_جديد`) كي لا تُستبدل النسخ التي يستعملها المستخدم فعلاً.

## بنية الملفات

- Create: `app/package.json`، `app/vite.config.js`، `app/tsconfig.json`، `app/.gitignore`
- Create: `app/scripts/extract-legacy.mjs` (أداة لمرة واحدة)، `app/scripts/check-shell.mjs` (فحص الناتج)، `app/scripts/publish-desktop.py`
- Create (بالتوليد): `app/hr-offline.html`، `app/src/editions/offline/{main.jsx,App.jsx}`، ثم `app/hr-cloud.html`، `app/src/editions/cloud/{main.jsx,App.jsx}`
- Create (المهمة 4): `app/public/{manifest.json,sw.js,icon.svg,icon-180.png,icon-192.png,icon-512.png}` بنسخ من الجذر
- Create (المهمة 5): `.github/workflows/deploy.yml`
- Modify (المهمة 5 فقط): `CLAUDE.md`، `sw.js` (لا يتغير محتواه، انظر Ruling 3)

---

### Task 1: هيكل المشروع وإثبات سلسلة الأدوات

**Files:**
- Create: `app/package.json`، `app/vite.config.js`، `app/tsconfig.json`، `app/.gitignore`، `app/hr-offline.html` (مؤقت)، `app/src/editions/offline/main.jsx` (مؤقت)

**Interfaces:**
- Produces: أوامر `npm run build:offline` و`build:cloud` و`typecheck`؛ وناتج `dist/<edition>/hr-<edition>.html` لكل نسخة.

- [ ] **Step 1: أنشئ `app/.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 2: أنشئ `app/package.json`**

```json
{
  "name": "hr-admin-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --mode offline --open /hr-offline.html",
    "typecheck": "tsc --noEmit",
    "build:offline": "vite build --mode offline && node scripts/check-shell.mjs dist/offline/hr-offline.html offline",
    "build:cloud": "vite build --mode cloud && node scripts/check-shell.mjs dist/cloud/hr-cloud.html cloud",
    "build": "npm run build:offline && npm run build:cloud"
  }
}
```

- [ ] **Step 3: ثبّت الاعتماديات بإصدارات محدَّدة**

Run (في `app/`):
```bash
npm install --save-exact react@18.3.1 react-dom@18.3.1
npm install --save-dev vite@^8.3.0 vite-plugin-singlefile@^2.3.3 @vitejs/plugin-react@^6.1.1 typescript@~5.9.3
```
Expected: ينتهي بلا أخطاء اعتمادية. إن رفض npm تركيبة الإصدارات، اقرأ رسالته ولا تستعمل `--force`؛ توقّف وأبلغ.

- [ ] **Step 4: أنشئ `app/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// النسخة تُحدَّد بـ --mode: offline | cloud
export default defineConfig(({ mode }) => {
  const edition = mode === 'cloud' ? 'cloud' : 'offline';
  return {
    // الكود القديم يستعمل React.createElement مباشرة ويعرّف React بنفسه، فالنمط الكلاسيكي هو الأمين
    plugins: [react({ jsxRuntime: 'classic' }), viteSingleFile()],
    publicDir: edition === 'cloud' ? 'public' : false,
    build: {
      outDir: `dist/${edition}`,
      emptyOutDir: true,
      chunkSizeWarningLimit: 5000,
      rollupOptions: { input: `hr-${edition}.html` },
    },
  };
});
```

- [ ] **Step 5: أنشئ `app/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react",
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: أنشئ الملفان المؤقتان لإثبات البناء**

`app/hr-offline.html`:
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>stub</title></head>
<body><div id="root"></div><script type="module" src="./src/editions/offline/main.jsx"></script></body></html>
```
`app/src/editions/offline/main.jsx`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
ReactDOM.render(<h1>مرحباً</h1>, document.getElementById('root'));
```

- [ ] **Step 7: ابنِ وتحقّق أن الناتج ملف واحد بلا مراجع خارجية**

Run: `npx vite build --mode offline`
Expected: ينجح، وينتج `dist/offline/hr-offline.html` وحده (لا مجلد `assets/`).
Run: `ls dist/offline; grep -c '<script[^>]*src=' dist/offline/hr-offline.html`
Expected: ملف واحد، والعدد `0`.
إن ظهر خطأ في `jsxRuntime` أو في المُلحق، اقرأ رسالته: قد يكون اسم الخيار مختلفاً في هذا الإصدار. لا تغيّر الإصدارات هرباً منه قبل قراءة توثيق `@vitejs/plugin-react` المثبَّت في `node_modules`.

- [ ] **Step 8: تحقّق من `typecheck`**

Run: `npm run typecheck`
Expected: ينجح (لا ملفات TS بعد، وإن اشتكى `tsc` من عدم وجود مدخلات فاضبط `include` ولا تعطّل الفحص).

- [ ] **Step 9: Commit**

```bash
git add app/package.json app/package-lock.json app/vite.config.js app/tsconfig.json app/.gitignore app/hr-offline.html app/src
git commit -m "Scaffold app/ (Vite + single-file build) with a stub that builds"
```

---

### Task 2: سكربت الاستخراج وبناء النسخة الأوفلاين

**Files:**
- Create: `app/scripts/extract-legacy.mjs`، `app/scripts/check-shell.mjs`
- Overwrite (بالتوليد): `app/hr-offline.html`، `app/src/editions/offline/main.jsx`
- Create (بالتوليد): `app/src/editions/offline/App.jsx`

**Interfaces:**
- Consumes: ملف المصدر `../نظام_ادارة_الملاك_v9.5_offline.html` (يُقرأ فقط، لا يُعدَّل).
- Produces: `node scripts/extract-legacy.mjs <source.html> <offline|cloud>` و`node scripts/check-shell.mjs <built.html> <offline|cloud>` (يخرج بالرمز 1 عند أي فشل).

- [ ] **Step 1: اكتب `app/scripts/extract-legacy.mjs`**

```js
// أداة لمرة واحدة: تفصل ملف النظام الحي إلى قالب صفحة + وحدة App.jsx بلا أي تعديل على كود الواجهة.
// لا تُعدِّل المصدر. الناتج هو المصدر الجديد بعد الانتقال، فلا يُعاد تشغيلها إلا للتحقق.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , srcPath, edition] = process.argv;
if (!srcPath || !['offline', 'cloud'].includes(edition)) {
  console.error('usage: node scripts/extract-legacy.mjs <source.html> <offline|cloud>');
  process.exit(2);
}
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(srcPath, 'utf8');

const OPEN = '<script type="text/x-hr-app" id="hr-app-source">';
const CLOSE = '</script>';
const openAt = html.indexOf(OPEN);
if (openAt < 0 || html.indexOf(OPEN, openAt + 1) >= 0) throw new Error('كتلة hr-app-source غير موجودة أو مكرّرة');
const bodyStart = openAt + OPEN.length;
const closeAt = html.indexOf(CLOSE, bodyStart);
const jsx = html.slice(bodyStart, closeAt);
if (jsx.includes('</script')) throw new Error('الكتلة تحوي </script');

// مُحمِّل Babel/IndexedDB: السكربت الذي يحمل هذا التعليق حصراً
const LOADER_MARK = '// مُشغِّل التطبيق';
const markAt = html.indexOf(LOADER_MARK);
if (markAt < 0) throw new Error('مُحمِّل التطبيق غير موجود');
const loaderStart = html.lastIndexOf('<script>', markAt);
const loaderEnd = html.indexOf(CLOSE, markAt) + CLOSE.length;
if (loaderStart < closeAt) throw new Error('ترتيب الكتل غير متوقع');

const entry = `<script type="module" src="./src/editions/${edition}/main.jsx"></script>`;
let shell = html.slice(0, openAt) + entry + html.slice(closeAt + CLOSE.length, loaderStart) + html.slice(loaderEnd);

// React يُحزَّم من npm الآن
const before = shell;
shell = shell
  .replace(/[ \t]*<script src="https:\/\/unpkg\.com\/react@[^"]+"><\/script>\r?\n/, '')
  .replace(/[ \t]*<script src="https:\/\/unpkg\.com\/react-dom@[^"]+"><\/script>\r?\n/, '');
if (shell === before) throw new Error('لم تُحذف وسوم React UMD');

// علامة القشرة التي يفحصها sw.js (انظر Ruling 3)
const MARKER = '<meta name="hr-app-shell" id="hr-app-source" content="1">';
if (!shell.includes('<meta name="viewport"')) throw new Error('وسم viewport غير موجود');
shell = shell.replace(/(<meta name="viewport"[^>]*>)/, `$1\n    ${MARKER}`);

const outDir = path.join(appDir, 'src', 'editions', edition);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(appDir, `hr-${edition}.html`), shell, 'utf8');
fs.writeFileSync(path.join(outDir, 'main.jsx'), "import './App.jsx';\n", 'utf8');
fs.writeFileSync(path.join(outDir, 'App.jsx'), `import React from 'react';\nimport ReactDOM from 'react-dom';\n${jsx}`, 'utf8');
console.log(`${edition}: jsx ${jsx.length} chars, shell ${shell.length} chars`);
```

- [ ] **Step 2: اكتب `app/scripts/check-shell.mjs`**

```js
// يفحص الملف الناتج: ملف واحد، بلا React/Babel من CDN، وعلامة القشرة موجودة، والعزل للأوفلاين.
import fs from 'node:fs';

const [, , file, edition] = process.argv;
const txt = fs.readFileSync(file, 'utf8');
const errors = [];

if (/<script[^>]*src="https:\/\/unpkg\.com\/(react|react-dom|@babel)/.test(txt)) errors.push('بقي React/Babel من unpkg');
if (txt.includes('text/x-hr-app') || txt.includes('text/babel')) errors.push('بقي وسم JSX خام');
if (!txt.includes('id="hr-app-source"')) errors.push('علامة القشرة id="hr-app-source" غير موجودة');
if (edition === 'offline') {
  const bad = txt.match(/firebaseio|identitytoolkit|AIza/g);
  if (bad) errors.push(`العزل مخروق: ${[...new Set(bad)].join(', ')} (${bad.length} موضع)`);
}
if (errors.length) {
  console.error('FAIL', file, '\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log('OK', file, `${(txt.length / 1024 / 1024).toFixed(2)} MB`);
```

- [ ] **Step 3: شغّل الاستخراج على الأوفلاين**

Run (في `app/`): `node scripts/extract-legacy.mjs "../نظام_ادارة_الملاك_v9.5_offline.html" offline`
Expected: سطر مثل `offline: jsx <N> chars, shell <M> chars` بلا استثناء. استثناء = افتراض خاطئ عن بنية الملف: اقرأ رسالته، ولا تعدّل السكربت لتجاوزه دون فحص الملف.

- [ ] **Step 4: تحقق أن كود الواجهة نُقل حرفياً**

Run:
```bash
python - <<'EOF'
import re,io
src=open('../نظام_ادارة_الملاك_v9.5_offline.html',encoding='utf-8').read()
a=src.index('<script type="text/x-hr-app" id="hr-app-source">')+len('<script type="text/x-hr-app" id="hr-app-source">')
b=src.index('</script>',a)
app=open('src/editions/offline/App.jsx',encoding='utf-8').read()
hdr="import React from 'react';\nimport ReactDOM from 'react-dom';\n"
assert app==hdr+src[a:b], 'App.jsx differs from source block'
print('verbatim OK', len(app))
EOF
```
Expected: `verbatim OK`.

- [ ] **Step 5: ابنِ الأوفلاين**

Run: `npm run build:offline`
Expected: ينجح البناء ثم يطبع `OK dist/offline/hr-offline.html <حجم> MB`. سجّل الحجم في تقريرك. الأخطاء الشائعة المتوقعة وما تعنيه:
- خطأ تحليل JSX: كتلة تحوي صياغة كان Babel يقبلها ولا يقبلها المحلل الجديد. اقرأ السطر المذكور في `App.jsx` وأصلحه في **App.jsx** بأقل تعديل، وسجّل كل تعديل في تقريرك (السلوك يجب أن يبقى مطابقاً).
- `X is not defined` وقت التحميل: متغير كان يتسرّب عالمياً من السكربت الكلاسيكي. عرّفه صراحة أو استورده.

- [ ] **Step 6: فحص العزل مستقلاً وبالأمر القديم نفسه**

Run: `grep -c "firebaseio\|identitytoolkit\|AIza" dist/offline/hr-offline.html`
Expected: `0`.

- [ ] **Step 7: مراجعة Codex (البوابة الثالثة)**

أرسل إلى Codex عبر `review_code`: نص `extract-legacy.mjs` و`check-shell.mjs` و`vite.config.js` فقط (لا بيانات حقيقية ولا ملف النظام). اطلب البحث عن: افتراضات هشّة في الاستخراج، وثغرات في فحص العزل، وأخطاء في إعداد Vite. طبّق ما يثبت صحته وسجّل ما رفضته وسببه. أبلغ المستخدم بما استُدعي ونتيجته.

- [ ] **Step 8: Commit**

```bash
git add app/scripts app/hr-offline.html app/src
git commit -m "Extract offline edition into app/ and build it as a single file"
```

---

### Task 3: التحقق من النسخة الأوفلاين (يجرّبها المستخدم)

**Files:**
- Create: `app/scripts/publish-desktop.py`

- [ ] **Step 1: اكتب `app/scripts/publish-desktop.py`**

```python
"""ينسخ الناتج التجريبي الجديد إلى سطح المكتب بأسماء لا تستبدل النسخ المعتمدة الحالية."""
import os, shutil, sys

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESK = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop")
if not os.path.isdir(DESK):
    DESK = os.path.join(os.path.expanduser("~"), "Desktop")

JOBS = {
    "offline": (os.path.join(APP, "dist", "offline", "hr-offline.html"), "نظام_ادارة_الملاك_تجريبي_جديد_أوفلاين.html"),
    "cloud": (os.path.join(APP, "dist", "cloud", "hr-cloud.html"), "نظام_ادارة_الملاك_تجريبي_جديد_سحابي.html"),
}
which = sys.argv[1] if len(sys.argv) > 1 else "offline"
src, name = JOBS[which]
if which == "offline":
    txt = open(src, encoding="utf-8").read()
    for bad in ("firebaseio", "identitytoolkit", "AIza"):
        if bad in txt:
            sys.exit(f"الرفض: العزل مخروق ({bad})")
shutil.copyfile(src, os.path.join(DESK, name))
print("copied ->", os.path.join(DESK, name))
```

- [ ] **Step 2: انسخ الأوفلاين إلى سطح المكتب**

Run: `python scripts/publish-desktop.py offline`
Expected: `copied -> ...\نظام_ادارة_الملاك_تجريبي_جديد_أوفلاين.html`.

- [ ] **Step 3: اطلب من المستخدم التجربة بهذه القائمة (انسخها في رسالتك)**

افتح الملف الجديد بنقرة مزدوجة **بجانب** النسخة الأوفلاين الحالية وقارن:
1. يظهر الدخول برمز PIN، ويدخل الرمز الصحيح.
2. الشاشات: الملاك، الوحدات، الموقف اليومي، التقييم، الماء، السلامة، لوحة التحكم، تقرير الفترة.
3. تعديل بيانات موظف وحفظه، ثم إعادة فتح الملف والتأكد أنه بقي.
4. استيراد Excel وتصدير Excel وWord (تُحمَّل المكتبات من الإنترنت كما اليوم).
5. الوضع الليلي، ومعاينة الطباعة.
6. سرعة الفتح، وأي شاشة بيضاء أو رسالة خطأ.
7. جرِّبه على الهاتف أيضاً إن أمكن.

- [ ] **Step 4: انتظر إقرار المستخدم أو ملاحظاته.** لا تنتقل للمهمة 4 قبل إقرار صريح. أي اختلاف يُصلَح ويُعاد البناء والنسخ (خطوات 2 من المهمة 2 و3 من هذه).

- [ ] **Step 5: Commit**

```bash
git add app/scripts/publish-desktop.py
git commit -m "Add desktop publish script for the new build artifacts"
```

---

### Task 4: النسخة السحابية

**البوابة:** لا تبدأ إلا بعد إقرار المستخدم للمهمة 3.

**Files:**
- Create (بالتوليد): `app/hr-cloud.html`، `app/src/editions/cloud/{main.jsx,App.jsx}`
- Create: `app/public/{manifest.json,sw.js,icon.svg,icon-180.png,icon-192.png,icon-512.png}` (نسخ من الجذر)

- [ ] **Step 1: استخرج السحابية من `index.html`**

Run: `node scripts/extract-legacy.mjs ../index.html cloud`
Expected: `cloud: jsx <N> chars, shell <M> chars`.

- [ ] **Step 2: تحقق أن الكود نُقل حرفياً (نفس فحص المهمة 2 الخطوة 4 مع `../index.html` و`src/editions/cloud/App.jsx`)**

Expected: `verbatim OK`.

- [ ] **Step 3: انسخ ملفات القشرة إلى `public/`**

Run:
```bash
mkdir -p public && cp ../manifest.json ../sw.js ../icon.svg ../icon-180.png ../icon-192.png ../icon-512.png public/
```
ولا تعدّل `sw.js`: علامته `id="hr-app-source"` موجودة في الصفحة الجديدة عبر وسم `meta` (Ruling 3).

- [ ] **Step 4: ابنِ السحابية**

Run: `npm run build:cloud`
Expected: `OK dist/cloud/hr-cloud.html <حجم> MB`، ويحوي `dist/cloud/` أيضاً `sw.js` و`manifest.json` والأيقونات.

- [ ] **Step 5: تحقق أن الأوفلاين ما زال ينجح ولم يتأثر**

Run: `npm run build`
Expected: ينجح النسختان، وفحص العزل للأوفلاين `OK`.

- [ ] **Step 6: تحقق أن مفتاح Firebase الموجود في السحابية موجود كما في المصدر (لا يُفقد ولا يُكشف أكثر)**

Run: `grep -o "AIza[A-Za-z0-9_-]*" ../index.html | sort -u | wc -l; grep -o "AIza[A-Za-z0-9_-]*" dist/cloud/hr-cloud.html | sort -u | wc -l`
Expected: العددان متساويان.

- [ ] **Step 7: مراجعة Codex لتغييرات هذه المهمة** (نص الفروق في `vite.config.js`/السكربتات فقط، بلا بيانات حقيقية)، وتُسجَّل نتيجتها في التقرير.

- [ ] **Step 8: انسخ السحابية إلى سطح المكتب واطلب التجربة**

Run: `python scripts/publish-desktop.py cloud`
اطلب من المستخدم: الدخول بحساب اختبار (لا الحساب الحقيقي أول مرة)، والمزامنة، وقائمة الفحص نفسها في المهمة 3، وتجربة فتحها من الهاتف عبر ملف أو رابط اختبار إن توفّر. **لا رفع في هذه الخطوة.**

- [ ] **Step 9: Commit**

```bash
git add app/hr-cloud.html app/src/editions/cloud app/public
git commit -m "Extract cloud edition into app/ and build it as a single file"
```

---

### Task 5: التحويل الفعلي للنشر (يتطلب موافقة صريحة على كل جزء)

**البوابة:** لا تبدأ إلا بعد إقرار المستخدم للمهمتين 3 و4 صراحةً، ولا `git push` إلا بموافقة جديدة في المحادثة.

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `CLAUDE.md`

**سبب الصعوبة:** موقع GitHub Pages يُنشر اليوم من الفرع مباشرة. التحويل يعني تغيير مصدر Pages إلى «GitHub Actions» من إعدادات المستودع (يفعله المستخدم بنفسه)، وعندها ينشر Actions ناتج `dist/cloud` وحده.

- [ ] **Step 1: أنشئ `.github/workflows/deploy.yml`**

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: app/package-lock.json
      - run: npm ci
      - run: npm run build:cloud
      - name: تجهيز الموقع (الصفحة تُنشر باسم index.html)
        run: |
          mkdir -p ../site
          cp -r dist/cloud/. ../site/
          mv ../site/hr-cloud.html ../site/index.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: خطة الرجوع (اكتبها للمستخدم قبل أي رفع)**

إن فشل النشر الجديد: يعيد المستخدم مصدر Pages إلى «Deploy from a branch → main / root» فيعود الموقع الحالي فوراً لأن الملفات القديمة ما زالت في الجذر. لذلك **لا تُحذف ملفات الجذر الحالية في هذه المهمة**.

- [ ] **Step 3: عدّل `CLAUDE.md`**

استبدل عبارة «لا تضف حزم npm أو أدوات بناء» وقسم «الملفات الثلاثة الحية» بوصف مختصر للمشروع الجديد: المصدر في `app/src`، وأوامر `npm run build:offline|build:cloud|typecheck`، وقاعدة أن الأوفلاين يجب أن يجتاز `check-shell.mjs`. ويبقى كل ما عدا ذلك كما هو. أرِ المستخدم الصياغة قبل الالتزام.

- [ ] **Step 4: Commit (بلا رفع)**

```bash
git add .github/workflows/deploy.yml CLAUDE.md
git commit -m "Deploy the built cloud edition via GitHub Actions"
```

- [ ] **Step 5: اطلب موافقة صريحة على الرفع وعلى تغيير مصدر Pages.** بعد الرفع تحقّق بـ`gh run list` أن التشغيل نجح، ثم اطلب من المستخدم فتح الرابط الحي وتجربته على الحاسوب والهاتف، والتأكد من عمل التثبيت كتطبيق.

---

## مراجعة ذاتية

- **تغطية المواصفة:** الهيكل والبناء بملف واحد (المهمتان 1 و2)، الأوفلاين أولاً (3)، السحابية (4)، النشر (5)، فحص العزل (`check-shell.mjs`)، الأنواع (`typecheck` جاهز لكنه فارغ عمداً في هذه المرحلة). ما لم تغطه المرحلة عمداً: Tailwind وقت البناء (Ruling 1)، ودمج النسختين (Ruling 2)، وقرار المكتبات الثقيلة (تبقى CDN كما هي).
- **تناسق الأسماء:** `hr-<edition>.html` و`dist/<edition>/hr-<edition>.html` و`src/editions/<edition>/` ثابتة عبر كل المهام؛ الأمر `extract-legacy.mjs <src> <edition>` والفحص `check-shell.mjs <file> <edition>` بالتواقيع نفسها.
- **حدود ما لم أتحقق منه:** لم أجرّب أياً من هذا بعد. توافق `@vitejs/plugin-react@6` مع `jsxRuntime: 'classic'` وسلوك `vite-plugin-singlefile` مع Vite 8 نقطتان تُحسمان عند المهمة 1 خطوة 7، ولهذا أُدرج فيها نص صريح للتعامل مع الفشل.
