// أداة نقل: تنقل تصريحات محدَّدة (const/function) من App.jsx للنسختين إلى وحدة مشتركة، حرفياً.
// الاستعمال: node scripts/extract-pure.mjs <module-path-under-src> <name>... [--write]
// بلا --write تعمل تجربة جافة (تفحص وتطبع ما ستفعله فقط).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(appDir, 'src');
const args = process.argv.slice(2);
const write = args.includes('--write');
const [modRel, ...names] = args.filter((a) => a !== '--write');
if (!modRel || !names.length) { console.error('usage: extract-pure.mjs <dir/file.js> <name>... [--write]'); process.exit(2); }
const EDITIONS = ['offline', 'cloud'];
const GLOBALS = new Set(['Math','Date','JSON','Object','Array','String','Number','Boolean','Set','Map','Promise','parseInt','parseFloat','isNaN','isFinite','console','window','document','navigator','undefined','NaN','Infinity','Error','RegExp','encodeURIComponent','decodeURIComponent','alert','confirm','prompt','setTimeout','clearTimeout','setInterval','clearInterval','Intl','Symbol','structuredClone','React','ReactDOM','XLSX','ExcelJS','docx','saveAs','Blob','URL','FileReader','fetch','arguments','localStorage','TextEncoder','crypto','requestAnimationFrame','Uint8Array','btoa','atob','escape','unescape','print','open','location','history','performance','Event','CustomEvent','Image','HTMLElement','Node','Element','getComputedStyle']);

const collect = (n, set) => {
  if (ts.isIdentifier(n)) set.add(n.text);
  else if (ts.isObjectBindingPattern(n) || ts.isArrayBindingPattern(n)) n.elements.forEach((e) => e.name && collect(e.name, set));
};

function freeVars(node) {
  const free = new Set();
  const scopes = [new Set()];
  const declare = (n) => collect(n, scopes[scopes.length - 1]);
  const isDeclared = (nm) => scopes.some((s) => s.has(nm));
  function visit(n) {
    if (ts.isFunctionLike(n) && n !== node) {
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
  const fn = ts.isVariableDeclaration(node) ? node.initializer : node;
  if (fn && ts.isFunctionLike(fn)) {
    scopes.push(new Set());
    fn.parameters.forEach((p) => declare(p.name));
    if (fn.body) visit(fn.body);
  } else if (ts.isVariableDeclaration(node) && node.initializer) visit(node.initializer);
  return free;
}

// أسماء تصدّرها الوحدات الموجودة في src (تُستورد تلقائياً عند الحاجة)
function existingExports() {
  const map = new Map();
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.name === 'editions') continue;
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(js|ts)$/.test(f.name)) {
        const t = fs.readFileSync(p, 'utf8');
        for (const m of t.matchAll(/^export (?:const|function) ([A-Za-z_$][\w$]*)/gm)) map.set(m[1], p);
      }
    }
  };
  walk(srcDir);
  return map;
}

function analyze(edition) {
  const file = path.join(srcDir, 'editions', edition, 'App.jsx');
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.JSX);
  let comp = null;
  const top = new Set();
  sf.forEachChild((n) => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === 'StaffSystem') comp = n;
    if (ts.isVariableStatement(n)) n.declarationList.declarations.forEach((d) => collect(d.name, top));
    if (ts.isFunctionDeclaration(n) && n.name) top.add(n.name.text);
    if (ts.isImportDeclaration(n)) {
      const c = n.importClause;
      if (c?.name) top.add(c.name.text);
      if (c?.namedBindings && ts.isNamedImports(c.namedBindings)) c.namedBindings.elements.forEach((e) => top.add(e.name.text));
    }
  });
  const scopes = [sf.statements, comp.body.statements];
  const find = (name) => {
    for (const list of scopes) {
      for (const st of list) {
        if (ts.isVariableStatement(st) && st.declarationList.declarations.length === 1) {
          const d = st.declarationList.declarations[0];
          if (ts.isIdentifier(d.name) && d.name.text === name) {
            if (!(st.declarationList.flags & ts.NodeFlags.Const)) throw new Error(`${name}: ليس const`);
            return { st, decl: d };
          }
        } else if (ts.isFunctionDeclaration(st) && st.name?.text === name) return { st, decl: st };
      }
    }
    return null;
  };
  return { file, text, sf, top, find };
}

const ctxs = Object.fromEntries(EDITIONS.map((e) => [e, analyze(e)]));
const exported = existingExports();
const moving = new Set(names);
const chunks = {};      // name -> نص مُزاح (مع التعليقات السابقة)
const deps = new Set(); // أسماء تُستورد من وحدات موجودة
const problems = [];

const dedent = (s, col) => s.split('\n').map((l, i) => (i === 0 ? l : l.startsWith(' '.repeat(col)) ? l.slice(col) : l.trimStart() === '' ? '' : l)).join('\n');

for (const nm of names) {
  const texts = {};
  for (const e of EDITIONS) {
    const c = ctxs[e];
    const hit = c.find(nm);
    if (!hit) { problems.push(`${nm}: غير موجود في ${e}`); continue; }
    const start = hit.st.getStart();
    const ranges = ts.getLeadingCommentRanges(c.text, hit.st.getFullStart()) || [];
    const from = ranges.length ? ranges[0].pos : start;
    const col = c.sf.getLineAndCharacterOfPosition(from).character;
    texts[e] = dedent(c.text.slice(from, hit.st.getEnd()), col).replace(/\r\n/g, '\n');
    (c.hits ??= {})[nm] = { from, to: hit.st.getEnd() };
    for (const v of freeVars(hit.decl)) {
      if (v === nm || GLOBALS.has(v) || moving.has(v)) continue;
      if (exported.has(v)) { deps.add(v); continue; }
      problems.push(`${nm} (${e}): يعتمد على «${v}» وهو ليس عالمياً ولا منقولاً ولا مصدَّراً بعد`);
    }
  }
  if (texts.offline !== undefined && texts.cloud !== undefined && texts.offline !== texts.cloud) problems.push(`${nm}: النصّان مختلفان بين النسختين`);
  chunks[nm] = texts.cloud ?? texts.offline;
}

if (problems.length) { console.error('توقف:\n - ' + [...new Set(problems)].join('\n - ')); process.exit(1); }

const target = path.join(srcDir, modRel);
const importLines = new Map();
for (const d of deps) {
  const from = exported.get(d);
  if (from === target) continue;
  let rel = path.relative(path.dirname(target), from).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  (importLines.get(rel) ?? importLines.set(rel, new Set()).get(rel)).add(d);
}
const header = [...importLines].map(([r, s]) => `import { ${[...s].sort().join(', ')} } from '${r}';`).join('\n');
const body = names.map((n) => chunks[n].replace(/^((?:\s*\/\/[^\n]*\n)*\s*)(const|function) /, '$1export $2 ')).join('\n\n');
const out = (header ? header + '\n\n' : '') + body + '\n';

console.log(`${write ? 'كتابة' : 'تجربة جافة'}: ${names.length} عنصراً → src/${modRel}` + (header ? `\nاستيرادات تلقائية:\n${header}` : ''));
if (!write) process.exit(0);

fs.mkdirSync(path.dirname(target), { recursive: true });
if (fs.existsSync(target)) fs.appendFileSync(target, '\n' + out); else fs.writeFileSync(target, out, 'utf8');

for (const e of EDITIONS) {
  const c = ctxs[e];
  let text = c.text;
  const cuts = names.map((n) => c.hits[n]).sort((a, b) => b.from - a.from);
  for (const { from, to } of cuts) {
    let end = to; if (text[end] === '\r') end++; if (text[end] === '\n') end++;
    let start = from; while (start > 0 && (text[start - 1] === ' ' || text[start - 1] === '\t')) start--;
    text = text.slice(0, start) + text.slice(end);
  }
  let rel = path.relative(path.dirname(c.file), target).replace(/\\/g, '/').replace(/\.(ts|js)$/, '');
  const imp = `import { ${names.join(', ')} } from '${rel}';`;
  text = text.replace(/(import ReactDOM from 'react-dom';\r?\n)/, `$1${imp}\n`);
  fs.writeFileSync(c.file, text, 'utf8');
}
console.log('تم.');
