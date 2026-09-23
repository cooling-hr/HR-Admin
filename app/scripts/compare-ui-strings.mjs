// بصمة نصوص الواجهة: البناء يُصغّر الأسماء فمقارنة الناتج حرفياً بلا فائدة،
// لكن النصوص العربية تنجو كما هي. نقلٌ حرفي يجب ألا يغيّر مجموعة النصوص إطلاقاً.
import fs from 'node:fs';

const [, , file, mode, ref] = process.argv;
if (!file || !['--save', '--against'].includes(mode) || !ref) {
    console.error('usage: node scripts/compare-ui-strings.mjs <built.html> --save|--against <ref.txt>');
    process.exit(2);
}
// مسافة أفقية فقط داخل الصنف: \s تبتلع أسطر السطور فيصير التعليق متعدّد الأسطر
// «نصاً» واحداً، فيتحوّل تغيير واحد إلى عشرات الفروق الوهمية عند المقارنة.
const extract = (path) => {
    const txt = fs.readFileSync(path, 'utf8');
    const found = txt.match(/[؀-ۿ][؀-ۿ \t،؟0-9%:،.\-()/]{2,}/g) || [];
    return [...new Set(found.map((s) => s.trim()).filter(Boolean))].sort();
};
const current = extract(file);
if (mode === '--save') {
    const dir = ref.replace(/[\\/][^\\/]*$/, '');
    if (dir && dir !== ref) fs.mkdirSync(dir, { recursive: true });
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
