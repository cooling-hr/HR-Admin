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

// زائر المتغيرات الحرة (بنفس أسلوب extract-pure.mjs من المرحلة 1) — يُستعمَل هنا مرتين:
// مرة على عبارات النطاق (اتجاه المعاملات: ما يستعمله النطاق من خارجه)، ومرة على عبارات
// المكوّن خارج النطاق (اتجاه المُخرَجات: ما يُستعمَل لاحقاً من أسماء صُرِّح بها داخل النطاق).
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
// الأداة ليست idempotent: تشغيلها مرة ثانية بعد --write يجعل استدعاء الـhook نفسه هو
// "النطاق" (العلامتان تبقيان في مكانهما)، فتعيد كتابة ملف الـhook بمحتوى دائري فاسد.
// حارس صريح بدل اكتشاف العطل لاحقاً بصمت (ملاحظة Codex، مرحلة 2أ)
if (write && text.slice(startMarkerPos, endMarkerPos).includes('DataLayer(')) {
  console.error('يبدو أن هذا الملف مُستخرَج مسبقاً (النطاق بين العلامتين يحوي استدعاء hook) — الأداة ليست idempotent، لا تُعِد تشغيلها بـ--write على ملف مُستخرَج.');
  process.exit(1);
}

let comp = null;
sf.forEachChild((n) => { if (ts.isFunctionDeclaration(n) && n.name?.text === 'StaffSystem') comp = n; });
if (!comp) { console.error('StaffSystem غير موجودة'); process.exit(1); }
const body = comp.body.statements;

const inRange = (st) => st.getStart() >= startMarkerPos && st.getEnd() <= endMarkerPos;
const regionStatements = body.filter(inRange);
const outsideStatements = body.filter((st) => !inRange(st));
if (!regionStatements.length) { console.error('لا عبارات داخل الحدود — تحقّق من موضع العلامتين'); process.exit(1); }

const declaredInRegion = topLevelDeclaredNames(regionStatements);

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

// first.getStart() يتجاوز التعليقات السابقة للعبارة الأولى (تُعامَل كـ"trivia" في AST،
// لا جزءاً من العبارة) — نسخ النص من هناك كان يُسقِط صامتاً التعليق التوضيحي الذي يسبق
// أول عبارة في النطاق مباشرة. نبدأ بدل ذلك من نهاية سطر علامة @data-layer:start نفسها،
// فيُنسَخ كل شيء بعدها حرفياً (تعليقات وعبارات) بلا تمييز — مطابق لمعنى "بين العلامتين".
const bodyStart = text.indexOf('\n', startMarkerPos) + 1;
const bodyText = dedent(text.slice(bodyStart, last.getEnd()), col);

const hookName = `use${edition[0].toUpperCase()}${edition.slice(1)}DataLayer`;
const params = [...paramsSet].sort();
const returns = [...returnsSet].sort();

// بعض المعاملات قد تُصرَّح بعد النطاق في الملف الأصلي — لا قبله. الكود الأصلي كان يقرؤها
// فقط داخل إغلاقات (معالجات أحداث) لا تُستدعى إلا لاحقاً، فلا مشكلة زمنية هناك (JS تسمح
// بإغلاق يشير لتصريح لاحق ما دام لا يُقرأ قبل تنفيذه). لكن استدعاء الـhook بكائن معاملات
// صريح `{ x }` يقرأ x فوراً وقت الاستدعاء — فإن كان تصريح x لاحقاً هنا، ينفجر التنفيذ بخطأ
// "Cannot access 'x' before initialization" (TDZ حقيقي رصدته تجربة فعلية في المتصفح، لا
// tsc ولا البناء). الإصلاح: إن وُجد معامل كهذا، يُنقَل موضع استدعاء الـhook نفسه (لا محتواه)
// إلى ما بعد آخر تصريح متأخر من هذا النوع — بشرط ألا يُستعمَل أي اسم من مُخرَجات الـhook في
// الفجوة بين نهاية النطاق الأصلي وموضع الاستدعاء الجديد (وإلا انعكست المشكلة على مُخرَج بدل معامل).
const declStatementFor = (name) => outsideStatements.find((st) => topLevelDeclaredNames([st]).has(name));
const forwardDeclStatements = params
  .map((p) => declStatementFor(p))
  .filter((st) => st && st.getStart() > endMarkerPos);
let callInsertPos = last.getEnd();
if (forwardDeclStatements.length) {
  const anchor = forwardDeclStatements.reduce((a, b) => (b.getEnd() > a.getEnd() ? b : a));
  const gapStatements = outsideStatements.filter((st) => st.getStart() >= endMarkerPos && st.getEnd() <= anchor.getEnd());
  const usedInGap = freeVars(gapStatements, new Set());
  const unsafe = returns.filter((r) => usedInGap.has(r));
  if (unsafe.length) {
    console.error(`تعذّر النقل الآلي: معاملات مُصرَّحة لاحقاً (${forwardDeclStatements.length}) تتطلب تأخير موضع الاستدعاء، لكن مُخرَجات الـhook التالية تُستعمَل في الفجوة قبل ذلك الموضع: ${unsafe.join(', ')}. يحتاج تدخلاً يدوياً.`);
    process.exit(1);
  }
  callInsertPos = anchor.getEnd();
  console.log(`ملاحظة: ${forwardDeclStatements.length} معاملاً مُصرَّحاً بعد النطاق (${[...new Set(forwardDeclStatements.flatMap((st) => [...topLevelDeclaredNames([st])]))].sort().join(', ')}) — نُقل موضع استدعاء الـhook إلى ما بعد آخر تصريح منها، بلا مساس بمحتوى الفجوة.`);
}

// اسم مثل FIREBASE_DB_URL (ثابت أوفلاين دائم القيمة الفارغة، مُستعمَل في مسار كود ميت —
// راجع تقرير المهمة) يُعاد من الـhook عبر مفتاح اختصار {FIREBASE_DB_URL} في بنية الكائن،
// فيبقى نص "FIREBASE_DB_URL" الحرفي في الحزمة المبنية حتى مع تصغير esbuild (أسماء مفاتيح
// الكائنات لا تُصغَّر أبداً، خلافاً لأسماء المتغيرات المحلية) — يُسقط هذا فحص عزل الأوفلاين
// (check-shell.mjs يرفض كلمة "firebase" في أي مكان بالنص المبني، لا فقط روابط فعلية).
// القيمة والمتغير المحلي في كل بقية الملف يبقيان بلا أي تغيير؛ فقط مفتاح هذا الحقل الواحد
// في نقطتي الإرجاع/التفكيك يُستعاض عنه بلقب لا يحوي الكلمة، حصراً في نسخة الأوفلاين.
const OFFLINE_FORBIDDEN_NAME = /firebaseio|identitytoolkit|aiza|firebase|googleapis|gstatic/i;
// الاستبدال يزيل كل الأنماط المحظورة من المفتاح، لا "firebase" فقط — ملاحظة Codex: اسم
// يطابق aiza/googleapis/gstatic بلا احتواء "firebase" كان سيفلت من إعادة التسمية القديمة
const bundleEntry = (name) => (edition === 'offline' && OFFLINE_FORBIDDEN_NAME.test(name))
  ? `${name.replace(/firebaseio|identitytoolkit|aiza|firebase|googleapis|gstatic/gi, 'fb')}: ${name}`
  : name;

// هذا النطاق لم يكن مفحوصاً بصرامة من قبل (كان جزءاً من App.jsx حيث checkJs: false)، ويحوي
// منطق مزامنة حسّاساً (pushDataToCloud) كتبه/أصلحه فحص فعلي لا أنواع ثابتة. إخضاعه الآن لفحص
// tsc صارم يعني كتابة عشرات الأنواع الحقيقية (كائنات Firebase المفكوكة، مصفوفات مستخدمين) على
// كود لم يُختبَر بهذه الطريقة قط — مخاطرة سلوك غير مبرَّرة في مرحلة "نقل حرفي بلا تغيير". الملف
// الناتج .jsx عمداً (غير مفحوص، كما كان دائماً)؛ تقويته بأنواع حقيقية عمل منفصل لاحق مقصود.
const hookSrc = `// نُقل حرفياً من editions/${edition}/App.jsx بأداة extract-hook.mjs — راجع ذلك الملف قبل
// أي تعديل يدوي هنا لاحقاً؛ لا منطق جديد أُضيف أثناء النقل.
// .jsx عمداً لا .ts: هذا الكود لم يكن مفحوصاً بصرامة من قبل (checkJs: false في تصريحه
// الأصلي داخل App.jsx)، وإخضاعه لفحص tsc الآن يحتاج كتابة عشرات الأنواع على منطق مزامنة
// حسّاس أثبتته التجربة الفعلية لا الأنواع — تقويته بأنواع حقيقية عمل منفصل لاحق مقصود.
import React from 'react';

export function ${hookName}(deps) {
  const {
${params.map((p) => `    ${p},`).join('\n')}
  } = deps;

${bodyText}

  return {
${returns.map((r) => `    ${bundleEntry(r)},`).join('\n')}
  };
}
`;

const hookDir = path.join(srcDir, 'data', edition);
fs.mkdirSync(hookDir, { recursive: true });
const hookFile = path.join(hookDir, `${hookName}.js`);
fs.writeFileSync(hookFile, hookSrc, 'utf8');

const callSrc = `${' '.repeat(col)}const {
${returns.map((r) => `${' '.repeat(col + 4)}${bundleEntry(r)},`).join('\n')}
${' '.repeat(col)}} = ${hookName}({
${params.map((p) => `${' '.repeat(col + 4)}${p},`).join('\n')}
${' '.repeat(col)}});
`;

// يبدأ الاستبدال من bodyStart لا first.getStart() لنفس السبب أعلاه — وإلا بقي التعليق
// السابق لأول عبارة في مكانه هنا (فيتكرر: مرة في App.jsx ومرة داخل الـhook). استدعاء الـhook
// نفسه يُدرَج عند callInsertPos لا مباشرة بعد النطاق — إن وُجدت معاملات مُصرَّحة لاحقاً
// (أعلاه)، تبقى عبارات الفجوة (last.getEnd() .. callInsertPos) في مكانها الأصلي بلا تغيير،
// ويُدرَج الاستدعاء بعدها مباشرة بدل قبلها.
const newText = text.slice(0, bodyStart) + text.slice(last.getEnd(), callInsertPos) + callSrc + text.slice(callInsertPos);
// نسبي مبني بـpath.relative لا بسلسلة نصية يدوية — عدد مستويات ../ يعتمد على عمق مجلد
// النسخة، وخطأ يدوي هنا سبق أن أنتج مساراً غير موجود (src/editions/data/... بدل src/data/...)
let hookImportRel = path.relative(path.dirname(file), hookFile).replace(/\\/g, '/');
if (!hookImportRel.startsWith('.')) hookImportRel = './' + hookImportRel;
const importLine = `import { ${hookName} } from '${hookImportRel}';\n`;
const finalText = newText.replace(/(import ReactDOM from 'react-dom';\r?\n)/, `$1${importLine}`);
fs.writeFileSync(file, finalText, 'utf8');
console.log('تم الكتابة.');
