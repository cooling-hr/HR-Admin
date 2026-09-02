// Transpiles the largest <script type="text/babel"> block and evaluates it far
// enough to prove the component's body runs — the compile gate only proves it
// parses. Catches TDZ, undefined-at-init and hook-order faults.
// Usage: node scratch/smoke_render.js <file.html>
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const target = process.argv[2];
if (!target) { console.error('usage: node scratch/smoke_render.js <file.html>'); process.exit(2); }

const here = __dirname;
const html = fs.readFileSync(target, 'utf8');
const blocks = [...html.matchAll(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!blocks.length) { console.error('no babel block found in ' + target); process.exit(2); }
const jsx = blocks.reduce((a, b) => (b.length > a.length ? b : a), '');

const babelCode = fs.readFileSync(path.join(here, 'babel.min.js'), 'utf8');
const babelBox = { window: {}, exports: {}, console: { log(){}, warn(){}, error(){} } };
vm.createContext(babelBox);
vm.runInContext(babelCode, babelBox);
const Babel = babelBox.Babel || babelBox.window.Babel;

let code;
try {
    code = Babel.transform(jsx, { presets: ['react'] }).code;
} catch (err) {
    console.error('FAIL ' + target + ' (transpile)');
    console.error(err.message);
    process.exit(1);
}

// Minimal React surface: enough for a component body to run once, top to bottom.
const state = [];
let cursor = 0;
const React = {
    useState: (init) => {
        const i = cursor++;
        if (!(i in state)) state[i] = typeof init === 'function' ? init() : init;
        return [state[i], () => {}];
    },
    useRef: (init) => ({ current: init }),
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useEffect: () => {},
    useLayoutEffect: () => {},
    createElement: () => null,
    Fragment: 'Fragment'
};
const sandbox = {
    React,
    useState: React.useState,
    useEffect: React.useEffect,
    useMemo: React.useMemo,
    useCallback: React.useCallback,
    useRef: React.useRef,
    ReactDOM: { createRoot: () => ({ render: () => {} }), render: () => {} },
    console: { log(){}, warn(){}, error(){} },
    document: { getElementById: () => ({}), addEventListener(){}, removeEventListener(){}, createElement: () => ({ style:{}, setAttribute(){}, appendChild(){} }), body: { appendChild(){} }, documentElement: { style: {}, setAttribute(){} }, querySelector: () => null, querySelectorAll: () => [] },
    window: { addEventListener(){}, removeEventListener(){}, location: { protocol: 'https:', href: '', hostname: 'localhost' }, localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, matchMedia: () => ({ matches: false, addListener(){}, removeListener(){} }), innerWidth: 1280, innerHeight: 800 },
    localStorage: { getItem: () => null, setItem(){}, removeItem(){} },
    sessionStorage: { getItem: () => null, setItem(){}, removeItem(){} },
    navigator: { userAgent: 'node', onLine: true },
    fetch: () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve(null) }),
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    alert: () => {},
    confirm: () => false,
    prompt: () => null,
    XLSX: {},
    Babel: { transform: () => ({ code: '' }) }
};
sandbox.window.document = sandbox.document;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// Capture every top-level function declaration so we can find the root component.
try {
    vm.runInContext(code, sandbox);
} catch (err) {
    console.error('FAIL ' + target + ' (module evaluation)');
    console.error(err.message);
    process.exit(1);
}

const candidates = Object.keys(sandbox).filter(k => typeof sandbox[k] === 'function' && /^[A-Z]/.test(k) && !['React','ReactDOM','Babel','XLSX'].includes(k));
if (!candidates.length) {
    console.error('FAIL ' + target + ' (no component function found to render)');
    process.exit(1);
}

let rendered = 0;
for (const name of candidates) {
    cursor = 0;
    try {
        sandbox[name]();
        rendered++;
    } catch (err) {
        console.error('FAIL ' + target + ' (rendering ' + name + ')');
        console.error(err.message);
        process.exit(1);
    }
}

console.log('OK  ' + target + '  (' + rendered + ' component(s) evaluated, 0 runtime errors)');
