// أداة لمرة واحدة: تفصل ملف النظام الحي إلى قالب صفحة + وحدة App.jsx بلا أي تعديل على كود الواجهة.
// لا تُعدِّل المصدر. الناتج هو المصدر الجديد بعد الانتقال، فلا يُعاد تشغيلها إلا للتحقق.
// كل فحص هنا يفشل بصوت عالٍ عمداً: خطأ في تخمين بنية الملف يعني نقلاً مبتوراً بصمت.
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

// مُحمِّل Babel/IndexedDB: السكربت الذي يحمل هذا التعليق حصراً — يُحدَّد قبل إغلاق كتلة JSX
// لأن حدوده هي ما يُثبت أن الإغلاق الذي سنعتمده هو الإغلاق الحقيقي للكتلة.
const LOADER_MARK = '// مُشغِّل التطبيق';
const markAt = html.indexOf(LOADER_MARK);
if (markAt < 0) throw new Error('مُحمِّل التطبيق غير موجود');
if (html.indexOf(LOADER_MARK, markAt + 1) >= 0) throw new Error('علامة مُحمِّل التطبيق مكرّرة');
if (markAt < bodyStart) throw new Error('علامة المُحمِّل تسبق كتلة JSX');
const LOADER_OPEN = '<script>';
const loaderStart = html.lastIndexOf(LOADER_OPEN, markAt);
if (loaderStart < 0) throw new Error('وسم <script> للمُحمِّل غير موجود');
// لا شيء بين وسم السكربت والعلامة إلا فراغ: يضمن أن العلامة أول سطر فعلي في هذا السكربت
const beforeMark = html.slice(loaderStart + LOADER_OPEN.length, markAt);
if (beforeMark.trim() !== '') throw new Error('علامة المُحمِّل ليست أول سطر في سكربته');
const loaderCloseAt = html.indexOf(CLOSE, markAt);
if (loaderCloseAt < 0) throw new Error('سكربت المُحمِّل غير مُغلق');
const loaderEnd = loaderCloseAt + CLOSE.length;
if (loaderStart < bodyStart) throw new Error('ترتيب الكتل غير متوقع');

// إغلاق كتلة JSX: يجب أن يكون الإغلاق الوحيد في كل المسافة حتى بداية المُحمِّل.
// (الفحص القديم `jsx.includes('</script')` كان بلا قيمة: القطع يحدث عند أول إغلاق فيستحيل أن
// يحوي الناتج إغلاقاً، فكتلة مبتورة كانت تمرّ بصمت.)
const closeAt = html.indexOf(CLOSE, bodyStart);
if (closeAt < 0 || closeAt >= loaderStart) throw new Error('إغلاق كتلة hr-app-source غير موجود');
const closesBeforeLoader = html.slice(bodyStart, loaderStart).split('</script').length - 1;
if (closesBeforeLoader !== 1) throw new Error(`عدد وسوم الإغلاق بين الكتلة والمُحمِّل ${closesBeforeLoader} لا 1 — الكتلة قد تُبتَر`);
const gap = html.slice(closeAt + CLOSE.length, loaderStart);
if (gap.trim() !== '') throw new Error('بين كتلة JSX والمُحمِّل محتوى غير متوقع');
const jsx = html.slice(bodyStart, closeAt);

const entry = `<script type="module" src="./src/editions/${edition}/main.jsx"></script>`;
let shell = html.slice(0, openAt) + entry + gap + html.slice(loaderEnd);

// React يُحزَّم من npm الآن — كل وسم يُتحقَّق من حذفه وحده، ولا يبقى أثر لأيٍّ منهما
for (const pkg of ['react', 'react-dom']) {
  const re = new RegExp(`[ \\t]*<script src="https://unpkg\\.com/${pkg}@[^"]+"></script>\\r?\\n`);
  if (!re.test(shell)) throw new Error(`وسم ${pkg} UMD غير موجود بالصيغة المتوقعة`);
  shell = shell.replace(re, '');
}
if (/unpkg\.com\/react/.test(shell)) throw new Error('بقي وسم React UMD في القالب');

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
