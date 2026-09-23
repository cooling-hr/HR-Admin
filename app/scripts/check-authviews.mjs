// حارس الكتل المستخرَجة: فحصان متكاملان على كل مكوّن في AuthViews.
//
// لماذا يلزم حارس أصلاً: اسم يسقط أثناء نقل كتلة من StaffSystem لا يكشفه شيء في
// المنظومة — `npm run typecheck` لا يصل إلى .jsx بهذا العمق، والبناء ينجح، وبصمة
// النصوص تبقى مطابقة. مُتحقَّق منه عملياً بحذف اسم واحد عمداً: مرّ من الثلاثة، وكان
// سيصل المستخدم وحده وقت التشغيل كنافذة لا تفتح أو شاشة بيضاء — وهي بالضبط فئة
// الأعطال التي آذت هذا المشروع سابقاً.
//
// ولماذا فحصان لا واحد: كلٌّ منهما أعمى عمّا يراه الآخر.
//   1) tsc --checkJs موجَّهاً إلى هذه الملفات وحدها يرى كل معرّف حرّ، حتى ما لا
//      يُنفَّذ أبداً أثناء الرسم (اسم داخل onClick مثلاً).
//   2) الرسم الفعلي يرى ما لا يراه فحص الأسماء: استدعاء قيمة ليست دالة، أو قراءة
//      خاصية من undefined أثناء التركيب.
// الاقتصار على الرسم وحده كان يمرّر حذف pushDataToServer (يُقرأ داخل onClick فقط) —
// ملاحظة Codex، مُتحقَّق منها في الاتجاهين.
//
// ctx وسيط (Proxy) يُرجع قيمة لأي مفتاح، فما يصل عبر ctx لا يفشل مهما كان اسمه، ولا
// يسقط إلا المعرّف الحر فعلاً. والقيمة المُرجَعة تقبل الاستدعاء والقراءة والمقارنة
// لتجتاز الكتل أياً كان ما تفعله بالقيمة.
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
    console.error('usage: node scripts/check-authviews.mjs <AuthViews.jsx> [...]');
    process.exit(2);
}
// نسخة واحدة لا تخلط النسختين: إعداد المشروع يفرض mode واحداً لكل تشغيل، وخلطهما
// يُحمّل ملفات نسخة بإعداد الأخرى فتمرّ أعطال أو تظهر أخرى وهمية (ملاحظة Codex).
const editionsOf = new Set(files.map((f) => (f.replace(/\\/g, '/').includes('/offline/') ? 'offline' : 'cloud')));
if (editionsOf.size > 1) {
    console.error('FAIL: لا تخلط ملفات النسختين في تشغيل واحد — شغّل الأمر مرة لكل نسخة.');
    process.exit(2);
}

// الفحص الأول: الأسماء. tsc بـ checkJs موجَّهاً إلى هذه الملفات وحدها يكشف كل معرّف حرّ،
// حتى ما لا يُنفَّذ أثناء الرسم — وهو بالضبط ما يفوت حارس الرسم أدناه: اسم لا يُقرأ إلا
// داخل onClick لا يُنفَّذ في renderToStaticMarkup فيمرّ سالماً (ملاحظة Codex، مُتحقَّق منها
// بحذف pushDataToServer: مرّ من حارس الرسم، وأمسكه tsc فوراً بـTS2304).
console.log('— فحص الأسماء (tsc --checkJs):');
// يُشغَّل tsc عبر Node مباشرة لا عبر node_modules/.bin: استدعاء الغلاف .cmd على ويندوز
// بـexecFileSync بلا shell يفشل بـENOENT، فيُبتلع الفشل ويمرّ الفحص بلا أن ينفَّذ أصلاً —
// حارس أعمى، وهو أسوأ من لا حارس. لذا أي تعذّر تشغيل هنا يُنهي العملية بخطأ صريح.
const tscEntry = 'node_modules/typescript/bin/tsc';
if (!existsSync(tscEntry)) { console.error(`FAIL: لم يُعثر على ${tscEntry}`); process.exit(2); }
let tscOut = '';
let tscFailed = false;
try {
    execFileSync(process.execPath, [tscEntry,
        '--noEmit', '--allowJs', '--checkJs', '--jsx', 'preserve', '--target', 'es2022',
        '--module', 'esnext', '--moduleResolution', 'bundler', '--skipLibCheck', ...files,
    ], { stdio: 'pipe', encoding: 'utf8' });
} catch (err) {
    tscFailed = true;
    tscOut = String(err.stdout || '') + String(err.stderr || '');
    if (!tscOut.trim()) { console.error('FAIL: تعذّر تشغيل tsc ولم يُرجع مخرجات — لا تعتبر الفحص ناجحاً.'); process.exit(2); }
}
if (tscFailed) {
    // ثلاثة رموز لاسم غير محلول: TS2304 (لا اسم)، TS2552 (لا اسم مع «هل تقصد…؟»)، TS18004 (اسم
    // مختصر في كائن بلا قيمة في نطاقه — صيغة ctx كلها). TS2304 وحده أفلت اسماً ساقطاً فعلاً
    // في 2026-09-23 فانهارت نافذة الحسابات عند فتحها.
    const undef = tscOut.split('\n').filter((l) => /TS(2304|2552|18004)/.test(l));
    if (undef.length) {
        console.error('FAIL: أسماء لا تصل عبر ctx ولا مستورَدة:');
        undef.forEach((l) => console.error('   ' + l.trim()));
        console.error('   أضِف كلاً منها إلى تفكيك ctx وإلى الكائن في موضع الاستدعاء.');
        process.exit(1);
    }
    console.error('FAIL: أخطاء من tsc:');
    tscOut.split('\n').filter((l) => /error TS/.test(l)).slice(0, 10).forEach((l) => console.error('   ' + l.trim()));
    process.exit(1);
}
console.log('  ✓ لا اسم حرّ');

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

// الفحص الثاني: الرسم الفعلي. يكشف ما لا تكشفه الأسماء وحدها — استدعاء قيمة ليست دالة،
// قراءة خاصية من undefined أثناء الرسم، وأي انهيار فعلي عند التركيب.
console.log('— فحص الرسم:');
const mode = [...editionsOf][0];
const server = await createServer({ mode, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let failed = 0;
try {
    for (const file of files) {
        const mod = await server.ssrLoadModule('/' + file.replace(/\\/g, '/').replace(/^\.\//, ''));
        // اصطلاح: المكوّنات بحرف كبير وتُرسَم؛ الدوال المساعدة (makeX) تُصدَّر أيضاً
        // لكنها تُرجع دالة لا عنصراً، فرسمها بلا معنى — يكفيها فحص الأسماء أعلاه.
        const names = Object.keys(mod).filter((k) => typeof mod[k] === 'function' && /^[A-Z]/.test(k));
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
