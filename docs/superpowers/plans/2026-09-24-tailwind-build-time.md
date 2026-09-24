# المرحلة 4: Tailwind وقت البناء — خطة التنفيذ

> تُنفَّذ مباشرة في الجلسة على `main` (ممارسة المشروع). لا اختبارات آلية (قرار المستخدم 2026-09-16).

**الهدف:** توليد أنماط Tailwind 3.4.17 وقت البناء وتضمينها في ملف HTML الواحد لكل نسخة، بدل CDN، مع تطابق تام في الشكل.
**المعمارية:** Tailwind عبر خط PostCSS في Vite؛ ملف CSS واحد يُستورد من مدخل كل نسخة؛ الأنماط المولَّدة تقع في آخر `<head>` كما يفعل CDN.
**التقنيات:** Vite 8، `tailwindcss@3.4.17`، `postcss`، `autoprefixer`، `vite-plugin-singlefile`.
**المواصفات:** `docs/superpowers/specs/2026-09-24-tailwind-build-time-design.md`

## القيود العامة

- `tailwindcss` بالإصدار `3.4.17` حرفياً، بلا `^`؛ لا Tailwind 4.
- `tailwind.config.js` بلا تخصيص `theme` ولا إضافات؛ `content: ['./src/**/*.{js,jsx}', './hr-*.html']`.
- `cssMinify: false` يبقى.
- لا تُمَسّ طبقة الوضع الليلي ولا أنماط الطباعة ولا منتقي التاريخ في القالبين.
- الأوفلاين: صفر إشارات Firebase؛ علامة `id="hr-app-source"` باقية.
- بصمة النصوص: أوفلاين 1495، سحابي 1657 — أي نقص عطل.
- لا سطر Co-Authored-By؛ لا `git push` بلا موافقة صريحة.

## محاور المراجعة

1. أنماط Tailwind تقع قبل كتل `<style>` في القالب ← يتغيّر من يغلب عند تساوي التخصيص (الطباعة خصوصاً). يُفحص في المهمة 1، الخطوة 5.
2. صنف مستعمل لا يولَّد له قاعدة ← عنصر بلا تنسيق بصمت. يُفحص بسكربت التغطية (المهمة 1، الخطوة 6).
3. أصناف `print:` و`sm:`/`md:` وقيم اعتباطية `[...]` ← تُفحص ضمن التغطية نفسها.
4. سطر CDN يعود لاحقاً بالخطأ ← شرط في `check-shell.mjs` (المهمة 1، الخطوة 4).
5. فتح الأوفلاين بلا شبكة ← تجربة المستخدم (بعد المهمة 2).

---

### المهمة 1: Tailwind وقت البناء

**الملفات:**
- إنشاء: `app/tailwind.config.js`، `app/postcss.config.js`، `app/src/styles/tailwind.css`
- تعديل: `app/package.json` (عبر npm)، `app/src/editions/offline/main.jsx`، `app/src/editions/cloud/main.jsx`، `app/hr-offline.html:73`، `app/hr-cloud.html:73`، `app/scripts/check-shell.mjs`

- [ ] **الخطوة 1: التثبيت** (من داخل `app/`)

```bash
npm install -D tailwindcss@3.4.17 postcss autoprefixer --save-exact
```
تأكد أن `package.json` يحمل `"tailwindcss": "3.4.17"` بلا `^`.

- [ ] **الخطوة 2: ملفات الإعداد**

`app/tailwind.config.js`:
```js
// مطابق لإعداد CDN الافتراضي الذي عمل به النظام حتى المرحلة 4 — لا تخصيص، كي لا يتغيّر الشكل.
// الأصناف تُمسح من النص حرفياً: اكتب اسم الصنف كاملاً، لا `bg-${x}-100`.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}', './hr-*.html'],
};
```

`app/postcss.config.js`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

`app/src/styles/tailwind.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **الخطوة 3: الاستيراد وحذف CDN**

في `app/src/editions/offline/main.jsx` و`cloud/main.jsx`، قبل `import './App.jsx';`:
```js
import '../../styles/tailwind.css';
```
واحذف من القالبين السطر:
```html
    <script src="https://cdn.tailwindcss.com/3.4.17"></script>
```

- [ ] **الخطوة 4: شرط في `check-shell.mjs`**

بعد فحص unpkg:
```js
if (txt.includes('cdn.tailwindcss.com')) errors.push('بقي Tailwind من CDN — صار يُولَّد وقت البناء');
```
وحدّث تعليق الرأس: Tailwind وقت البناء منذ المرحلة 4، والمكتبات الثقيلة وحدها من CDN.

- [ ] **الخطوة 5: البناء وموضع الأنماط**

```bash
npm run build
```
ثم في كل ناتج: تحقّق أن كتلة `<style>` التي تحمل `tailwindcss v3.4.17` تقع **بعد** آخر كتلة `<style>` من القالب (كتلة الوضع الليلي) وقبل `</head>`. إن وقعت قبلها: أضف في `vite.config.js` إضافة `transformIndexHtml` (`order: 'post'`) تنقل تلك الكتلة إلى ما قبل `</head>` مباشرة، وأعد البناء.

- [ ] **الخطوة 6: تغطية الأصناف** (سكربت مؤقت في مجلد الجلسة، لا في المستودع)

يستخرج كل رمز يشبه صنفاً من سلاسل `src/**/*.{js,jsx}` والقالبين، ويطابقه مع المحدِّدات في CSS المولَّد (بعد فكّ هروب `\:` و`\/` و`\[`...). المخرَج: قائمة الرموز بلا قاعدة. كل رمز منها يُصنَّف يدوياً: صنف مخصَّص في القالب، أو خطأ كتابة قديم بلا أثر مع CDN أيضاً، أو **ضائع فعلاً** (عطل يُصلَح).

- [ ] **الخطوة 7: الفحوص المعتادة**

```bash
npm run typecheck
grep -c "firebaseio\|identitytoolkit\|AIza" dist/offline/hr-offline.html   # 0
node scripts/compare-ui-strings.mjs dist/offline/hr-offline.html --against .baseline/offline.txt
node scripts/compare-ui-strings.mjs dist/cloud/hr-cloud.html --against .baseline/cloud.txt
python scripts/publish-desktop.py offline && python scripts/publish-desktop.py cloud
```

- [ ] **الخطوة 8: مراجعة Codex** على الفرق (كود فقط)، ثم الالتزام:
`Generate Tailwind at build time instead of loading the Play CDN`

### المهمة 2: التوثيق

**الملفات:** تعديل `CLAUDE.md`

- [ ] **الخطوة 1:** فقرة «Tailwind والمكتبات الثقيلة (Excel/Word) من CDN» تصبح: Tailwind 3.4.17 يُولَّد وقت البناء (`app/tailwind.config.js`) منذ المرحلة 4، والمكتبات الثقيلة وحدها من CDN؛ اسم الصنف يُكتب كاملاً حرفياً (المركَّب من أجزاء لا يُولَّد)؛ لا ترقية إلى Tailwind 4 إلا بقرار مستقل.
- [ ] **الخطوة 2:** فقرة الوضع الليلي: بديل `dark:` يُضبط الآن في `tailwind.config.js` بـ`darkMode: ['selector', '[data-theme="dark"]']`، لا بسطر بعد سكربت CDN.
- [ ] **الخطوة 3:** الالتزام: `Document build-time Tailwind in the project instructions`

### بعد المهمتين

1. **Antigravity** يراجع النتيجة (بطلب المستخدم): وصف التغيير والفرق، بلا ملفات كبيرة مرفقة.
2. **تجربة المستخدم** على نسختي سطح المكتب: الشاشات، الوضع الليلي، المعاينة والطباعة، وفتح الأوفلاين والإنترنت مقطوع.
3. الرفع بموافقة صريحة فقط.
