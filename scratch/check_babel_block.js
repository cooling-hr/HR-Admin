// Extracts the largest <script type="text/babel"> block from an HTML file
// and compiles it with the vendored Babel standalone build. Exits non-zero
// on a syntax error. Usage: node scratch/check_babel_block.js <file.html>
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const target = process.argv[2];
if (!target) { console.error('usage: node scratch/check_babel_block.js <file.html>'); process.exit(2); }

const html = fs.readFileSync(target, 'utf8');
const blocks = [...html.matchAll(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!blocks.length) { console.error('no babel block found in ' + target); process.exit(2); }
const jsx = blocks.reduce((a, b) => (b.length > a.length ? b : a), '');

const babelCode = fs.readFileSync(path.join(__dirname, 'babel.min.js'), 'utf8');
const sandbox = { window: {}, exports: {}, console: { log(){}, warn(){}, error(){} } };
vm.createContext(sandbox);
vm.runInContext(babelCode, sandbox);
const Babel = sandbox.Babel || sandbox.window.Babel;

try {
    Babel.transform(jsx, { presets: ['react'] });
    console.log('OK  ' + target + '  (0 syntax errors)');
} catch (err) {
    console.error('FAIL ' + target);
    console.error(err.message);
    process.exit(1);
}
