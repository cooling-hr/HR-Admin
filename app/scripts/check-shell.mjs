// يفحص الملف الناتج: الحزمة مضمَّنة فعلاً، بلا React/Babel من CDN، وعلامة القشرة موجودة، والعزل للأوفلاين.
// تنبيه مقصود: Tailwind والمكتبات الثقيلة (Excel/Word) تبقى من CDN في المرحلة 0 (Ruling 1)،
// فلا يُفحَص «صفر مراجع خارجية» هنا — يُفحَص فقط أن حزمة التطبيق نفسها مضمَّنة.
import fs from 'node:fs';

const [, , file, edition] = process.argv;
if (!file || !['offline', 'cloud'].includes(edition)) {
  console.error('usage: node scripts/check-shell.mjs <built.html> <offline|cloud>');
  process.exit(2);
}
const txt = fs.readFileSync(file, 'utf8');
const errors = [];

if (/unpkg\.com\/(react|react-dom|@babel)/.test(txt)) errors.push('بقي React/Babel من unpkg');
if (txt.includes('text/x-hr-app') || txt.includes('text/babel')) errors.push('بقي وسم JSX خام');
if (!txt.includes('id="hr-app-source"')) errors.push('علامة القشرة id="hr-app-source" غير موجودة');
// حزمة التطبيق يجب أن تكون مضمَّنة: أي src غير مطلق يعني أن vite-plugin-singlefile لم يُدمجها
const notInlined = [...txt.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/gi)]
  .map((m) => m[1])
  .filter((src) => !/^https?:\/\//i.test(src));
if (notInlined.length) errors.push(`حزمة غير مضمَّنة: ${notInlined.join(', ')}`);
if (edition === 'offline') {
  const bad = txt.match(/firebaseio|identitytoolkit|AIza|firebase|googleapis|gstatic/gi);
  if (bad) errors.push(`العزل مخروق: ${[...new Set(bad.map((s) => s.toLowerCase()))].join(', ')} (${bad.length} موضع)`);
}
if (edition === 'cloud') {
  // السحابية يجب أن تحمل روابط Firebase ومفتاح الويب؛ غيابها يعني بناءً ناقصاً دون أي خطأ ظاهر
  for (const needle of ['firebaseio.com', 'identitytoolkit', 'AIza']) {
    if (!txt.includes(needle)) errors.push(`السحابية ينقصها ${needle}`);
  }
}
if (errors.length) {
  console.error('FAIL', file, '\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log('OK', file, `${(txt.length / 1024 / 1024).toFixed(2)} MB`);
