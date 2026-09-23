// حارس الكتل المستخرَجة: يُشغّل كل مكوّن في AuthViews فعلياً ويرسمه، فيسقط فوراً أي اسم
// نُسي في النقل من StaffSystem (ReferenceError).
//
// لماذا التشغيل لا الفحص النصّي: اسم ساقط لا يكشفه شيء آخر — tsc لا يفحص .jsx بهذا
// العمق، والبناء ينجح، وبصمة النصوص تبقى مطابقة. مُتحقَّق منه عملياً: حذف اسم واحد من
// تفكيك ctx مرّ من typecheck ومن build معاً بلا شكوى، وكان سيظهر عند المستخدم وحده
// كنافذة لا تفتح أو شاشة بيضاء. وهذه بالضبط فئة الأعطال التي آذت هذا المشروع سابقاً.
//
// ctx وسيط (Proxy) يُرجع قيمة لأي مفتاح، فما يصل عبر ctx لا يفشل مهما كان اسمه، ولا
// يسقط إلا المعرّف الحر فعلاً. والقيمة المُرجَعة تقبل الاستدعاء والقراءة والمقارنة
// لتجتاز الكتل أياً كان ما تفعله بالقيمة.
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const files = process.argv.slice(2);
if (!files.length) {
    console.error('usage: node scripts/check-authviews.mjs <AuthViews.jsx> [...]');
    process.exit(2);
}

// قيمة تقبل كل شيء: استدعاء، فهرسة، تكرار، تحويل لنص أو رقم.
const anyValue = () => new Proxy(function () { return anyValue(); }, {
    get(target, prop) {
        if (prop === Symbol.toPrimitive) return () => 1;
        if (prop === Symbol.iterator) return function* () {};
        if (prop === 'then') return undefined;               // ليس وعداً
        if (prop === 'length') return 0;
        if (prop === 'map' || prop === 'filter') return () => [];
        if (prop === 'toString') return () => '';
        return anyValue();
    },
    apply() { return anyValue(); },
    has() { return true; },
});

// إعداد المشروع يفرض mode من {offline, cloud}؛ يُشتق من المسار ولا أثر له على الرسم هنا.
const mode = files[0].replace(/\\/g, '/').includes('/offline/') ? 'offline' : 'cloud';
const server = await createServer({ mode, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let failed = 0;
try {
    for (const file of files) {
        const mod = await server.ssrLoadModule('/' + file.replace(/\\/g, '/').replace(/^\.\//, ''));
        const names = Object.keys(mod).filter((k) => typeof mod[k] === 'function');
        if (!names.length) { console.error(`FAIL ${file}: لا مكوّنات مُصدَّرة`); failed++; continue; }
        for (const name of names) {
            const ctx = new Proxy({}, { get: () => anyValue(), has: () => true });
            try {
                renderToStaticMarkup(React.createElement(mod[name], { ctx }));
                console.log(`  ✓ ${file} → ${name}`);
            } catch (err) {
                failed++;
                const msg = String(err && err.message);
                console.error(`FAIL ${file} → ${name}: ${msg}`);
                if (/is not defined/.test(msg)) {
                    console.error(`   اسم لم يصل عبر ctx ولا مستورد — أضِفه إلى تفكيك ctx وإلى موضع الاستدعاء.`);
                }
            }
        }
    }
} finally {
    await server.close();
}
if (failed) process.exit(1);
console.log(`OK — كل المكوّنات رُسمت بلا اسم ساقط`);
