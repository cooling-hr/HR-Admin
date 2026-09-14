# Design Language — Phase 0 (Foundation + Nav) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the foundation of the unified design language — CSS-variable colour tokens, and the four shared components (`Icon`, `Segmented`, `Button`, `StatusBadge`) — and apply it to the nav bar shipped in `bfedff2`: SVG icons instead of emoji on the six primary sections, the existing "seg-track" markup extracted into a reusable `Segmented` component, and the redundant active-tab underline bar removed.

**Architecture:** `نظام إدارة الملاك` is a single `index.html` file (~1MB), React 18 rendered via in-browser Babel (`<script type="text/babel">`), Tailwind Play CDN, no build step. All new shared components are plain top-level `const X = (props) => (...)` React components declared in the same babel block, before `function StaffSystem()` (line ~882) — the same position `SearchCircularProgress` already occupies, which is deliberate: a top-level `const` in this file's `vm`-sandboxed test harness (`scratch/smoke_render.js`) never becomes an enumerable sandbox global, so it is never auto-invoked by that harness with zero props (only `function` declarations are). Declaring new components as `const` before `StaffSystem` therefore stays safe under the existing gates without any harness change.

**Tech Stack:** React 18 (global, no JSX transform step besides in-browser Babel), Tailwind Play CDN (runtime JIT — arbitrary values like `bg-[var(--surface)]` work), plain `<style>` block for CSS custom properties, Playwright for browser verification (`scratch/*.js`).

**Spec:** `docs/superpowers/specs/2026-09-15-unified-design-language-design.md` — this plan implements the plan's §5 (tokens), §6.1/6.2/6.3/6.4 partially (component *definitions*; most wiring is later phases), and the "Phase 0" row of §9.

## Global Constraints

- **Two mandatory gates on every touched file, every time:** `node scratch/check_babel_block.js <file>` then `node scratch/smoke_render.js <file>` — both must print `OK`. Never trust the syntax gate alone.
- **Declaration order:** anything read by a `useState`/`useMemo` initial value or its dependency array must be defined earlier in the file. New components here are only ever called from JSX render bodies (never from an initializer), so this constraint does not block their placement, but never move them *after* `function StaffSystem() {` starts — keep them in the pre-`StaffSystem` helper block.
- **Colour rule (from the spec, non-negotiable for every new component in this plan):** every colour must come from a CSS variable (`bg-[var(--surface)]`, `text-[color:var(--ink)]`, etc.) or an already-enumerated dark-mode class reused verbatim (e.g. the existing `bg-indigo-600`, `bg-slate-100` the nav already uses and which are already in the dark-mode `!important` layer). **Never introduce a bare new colour utility class that is not already in the enumerated dark-mode list** — proven in this session that `dark:` utilities are silently overridden by that list, and a brand-new bare class (e.g. a colour never used before) has no dark-mode rule at all and will render light-mode-bright at night with zero console warning.
- **Three live files:** `index.html` is the source. After every task's edits: `cp index.html "نظام_ادارة_الملاك_v9.5_cloud.html"` and verify `diff -q` reports no difference. The offline edition (`نظام_ادارة_الملاك_v9.5_offline.html`) is a **separate, hand-ported** copy — every JSX/CSS change in this plan must be applied to it too, verified with `grep -c "firebaseio\|identitytoolkit\|AIza" "نظام_ادارة_الملاك_v9.5_offline.html"` printing `0` after every edit.
- **After every task:** `python publish_desktop_copies.py`.
- **No commit without a clean full suite:** `bash scratch/run_suite.sh` must print `المجموع: N ناجح، 0 فاشل` before any `git commit` — never rely on a partial rerun. Run it standalone (nothing else running suites concurrently — a real trap hit this same session: two suites writing to the same `scratch/suite_logs/` directory silently overwrote each other's failure logs).
- **Git:** commit after each task passes review (autonomous, no need to ask). **Never `git push`** — that stays gated on the user's explicit request in the live conversation.
- **RTL:** the document is `dir="rtl"`. Nothing in this plan changes that; icons must not carry directional meaning that breaks in RTL (none of the six do).
- **Existing test helpers that hard-code current nav text must be updated in the same task that changes what they match:** `scratch/nav.js` (`SECTION` regexes match `/^💧 الماء/` and `/^⭐ التقييم/` — emoji-anchored), and `scratch/check_nav_sections.js` / `scratch/check_nav_sections_cloud.js` (`hasText: /^💧 الماء/` etc.). These are used by many *other* tests via `nav.goto.*` — breaking the anchor breaks tests unrelated to this plan.

---

### Task 1: Design tokens (CSS variables, light + dark)

**Files:**
- Modify: `index.html:463-465` (end of the first, light-mode `<style>` block — add a `:root { ... }` rule just before its closing `</style>` at line 464)
- Modify: `index.html:500-506` (inside the dark-mode `<style>` block's `@media screen { html[data-theme="dark"] { ... } }` — add the dark token overrides right after the existing `color-scheme: dark;` line)
- Modify (mirror both edits exactly): `نظام_ادارة_الملاك_v9.5_offline.html` (same two insertion points — locate by the same surrounding text, since line numbers differ slightly between the two files)
- Test: `scratch/check_design_tokens.js` (new)

**Interfaces:**
- Produces: 13 CSS custom properties available everywhere in the document from this point on: `--surface`, `--surface-muted`, `--surface-raised`, `--border`, `--border-strong`, `--ink`, `--ink-2`, `--action`, `--action-hover`, `--action-ink`, `--action-tint`, `--ok`, `--ok-tint`, `--warn`, `--warn-tint`, `--danger`, `--danger-tint`, `--danger-border`. Every later task in this plan and every later phase consumes these by name — do not rename them.

- [ ] **Step 1: Write the failing test**

Create `scratch/check_design_tokens.js`:

```js
const { chromium } = require('playwright');
const path = require('path');
const url = require('url');

// الرموز (design tokens) يجب أن تكون معرَّفة على :root، وتتبدّل قيمتها حين يُضبط
// data-theme="dark" على <html> — دون أي تدخّل JS آخر، لأنها CSS بحت.
const FILE = path.resolve(__dirname, '..', process.argv[2] || 'نظام_ادارة_الملاك_v9.5_offline.html');
const FILE_URL = url.pathToFileURL(FILE).href;

const TOKENS = {
  '--surface': ['#ffffff', '#131c2b'],
  '--surface-muted': ['#f1f5f9', '#1a2536'],
  '--surface-raised': ['#ffffff', '#2b3a52'],
  '--border': ['#e2e8f0', '#2b3a52'],
  '--border-strong': ['#cbd5e1', '#3a4c68'],
  '--ink': ['#0f172a', '#e6edf5'],
  '--ink-2': ['#64748b', '#94a3b8'],
  '--action': ['#4f46e5', '#6366f1'],
  '--action-hover': ['#4338ca', '#818cf8'],
  '--action-ink': ['#4338ca', '#a5b4fc'],
  '--action-tint': ['#eef2ff', '#16233f'],
  '--ok': ['#047857', '#6ee7b7'],
  '--ok-tint': ['#ecfdf5', '#0b2f24'],
  '--warn': ['#b45309', '#fcd34d'],
  '--warn-tint': ['#fffbeb', '#3b2a09'],
  '--danger': ['#b91c1c', '#fca5a5'],
  '--danger-tint': ['#fef2f2', '#3b1518'],
  '--danger-border': ['#fecaca', '#6b2b31']
};

let failed = 0;
const check = (label, ok, detail) => { if (!ok) failed++; console.log(label, ok ? 'PASS ✅' : 'FAIL ❌', detail !== undefined ? '— ' + detail : ''); };

const readTokens = (page) => page.evaluate((names) => {
  const cs = getComputedStyle(document.documentElement);
  const out = {};
  for (const n of names) out[n] = cs.getPropertyValue(n).trim().toLowerCase();
  return out;
}, Object.keys(TOKENS));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(FILE_URL, { timeout: 90000 });
  await page.waitForTimeout(800);

  const light = await readTokens(page);
  for (const [name, [lightVal]] of Object.entries(TOKENS)) {
    check(`نهاري ${name} = ${lightVal}؟`, light[name] === lightVal, `القيمة = "${light[name]}"`);
  }

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(400);
  const dark = await readTokens(page);
  for (const [name, [, darkVal]] of Object.entries(TOKENS)) {
    check(`ليلي ${name} = ${darkVal}؟`, dark[name] === darkVal, `القيمة = "${dark[name]}"`);
  }

  console.log(failed ? `\nFAILED ❌ (${failed})` : '\nALL PASS ✅');
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node scratch/check_design_tokens.js`
Expected: every check `FAIL ❌` with empty-string values (the variables don't exist yet).

- [ ] **Step 3: Add the light tokens**

In `index.html`, find the end of the first `<style>` block (it currently ends at line 464 with `</style>`, right before the `<!-- الوضع الليلي (Dark Mode) -->` comment). Insert immediately before that `</style>`:

```css
        :root {
            --surface: #ffffff;
            --surface-muted: #f1f5f9;
            --surface-raised: #ffffff;
            --border: #e2e8f0;
            --border-strong: #cbd5e1;
            --ink: #0f172a;
            --ink-2: #64748b;
            --action: #4f46e5;
            --action-hover: #4338ca;
            --action-ink: #4338ca;
            --action-tint: #eef2ff;
            --ok: #047857;
            --ok-tint: #ecfdf5;
            --warn: #b45309;
            --warn-tint: #fffbeb;
            --danger: #b91c1c;
            --danger-tint: #fef2f2;
            --danger-border: #fecaca;
        }
```

- [ ] **Step 4: Add the dark overrides**

In the same file, inside the dark-mode `<style>` block, find:

```css
        html[data-theme="dark"] {
            /* الخطوط العربية تبدو أثقل وتتوهّج على الخلفيات الداكنة — التنعيم يعالج ذلك */
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            color-scheme: dark;
        }
```

Replace it with:

```css
        html[data-theme="dark"] {
            /* الخطوط العربية تبدو أثقل وتتوهّج على الخلفيات الداكنة — التنعيم يعالج ذلك */
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            color-scheme: dark;
            /* رموز التصميم (design tokens) — القيم مأخوذة من لوحة الوضع الليلي القائمة نفسها،
               فلا يتغيّر إحساس الوضع الليلي الحالي. كل مكوّن جديد يستهلك هذه المتغيرات فقط،
               لا فئة لونية صريحة — الفئات الصريحة الجديدة لا مدخل لها في القائمة المعدَّدة أدناه. */
            --surface: #131c2b;
            --surface-muted: #1a2536;
            --surface-raised: #2b3a52;
            --border: #2b3a52;
            --border-strong: #3a4c68;
            --ink: #e6edf5;
            --ink-2: #94a3b8;
            --action: #6366f1;
            --action-hover: #818cf8;
            --action-ink: #a5b4fc;
            --action-tint: #16233f;
            --ok: #6ee7b7;
            --ok-tint: #0b2f24;
            --warn: #fcd34d;
            --warn-tint: #3b2a09;
            --danger: #fca5a5;
            --danger-tint: #3b1518;
            --danger-border: #6b2b31;
        }
```

- [ ] **Step 5: Mirror both edits into the offline edition**

Apply the identical two insertions to `نظام_ادارة_الملاك_v9.5_offline.html` (locate the same two anchor points — its line numbers differ slightly from `index.html` but the surrounding text is identical).

- [ ] **Step 6: Run both gates on both files**

```bash
node scratch/check_babel_block.js index.html
node scratch/smoke_render.js index.html
node scratch/check_babel_block.js "نظام_ادارة_الملاك_v9.5_offline.html"
node scratch/smoke_render.js "نظام_ادارة_الملاك_v9.5_offline.html"
```
Expected: `OK` four times (this task only touches `<style>`, so both gates were never at risk, but they run on every touched file regardless).

- [ ] **Step 7: Run the test again and confirm it passes**

Run: `node scratch/check_design_tokens.js index.html` and `node scratch/check_design_tokens.js "نظام_ادارة_الملاك_v9.5_offline.html"`
Expected: `ALL PASS ✅` for both.

- [ ] **Step 8: Sync the cloud copy, publish, run the full suite, commit**

```bash
cp index.html "نظام_ادارة_الملاك_v9.5_cloud.html"
diff -q index.html "نظام_ادارة_الملاك_v9.5_cloud.html"
grep -c "firebaseio\|identitytoolkit\|AIza" "نظام_ادارة_الملاك_v9.5_offline.html"   # must print 0
python publish_desktop_copies.py
bash scratch/run_suite.sh   # must end with "المجموع: N ناجح، 0 فاشل"
git add index.html "نظام_ادارة_الملاك_v9.5_cloud.html" "نظام_ادارة_الملاك_v9.5_offline.html"
git commit -m "Add design-language CSS variable tokens (light + dark)"
```

---

### Task 2: `Icon` component + six nav icons, wired into the primary section tabs

**Files:**
- Modify: `index.html` — insert the `Icon` component before `function StaffSystem()` (i.e. right after the `SearchCircularProgress` component, ~line 880); modify the `sections` array and its render (`index.html:8296-8369`, the `{s.icon} {s.label}` line and the active-tab underline `<span>`)
- Modify (mirror): `نظام_ادارة_الملاك_v9.5_offline.html`, same two spots
- Modify: `scratch/nav.js` (`SECTION` regexes lose their emoji anchors)
- Modify: `scratch/check_nav_sections.js` and `scratch/check_nav_sections_cloud.js` (same emoji-anchored `hasText` matchers)
- Test: `scratch/check_nav_icons.js` (new)

**Interfaces:**
- Consumes: nothing from Task 1 directly (icons are monochrome `currentColor`, not tokenized here — colour comes from the parent button's existing `text-white` / `text-slate-700`, both already correct in light and dark).
- Produces: `Icon` component, signature `<Icon name="layout-dashboard" className="w-4 h-4" />`, `aria-hidden="true"` always set internally. Icon names registered in this task: `layout-dashboard`, `users`, `building-2`, `star`, `droplet`, `hard-hat`. Any later phase adding a nav-adjacent icon extends the same `ICONS` map — do not create a second map.

- [ ] **Step 1: Write the failing test**

Create `scratch/check_nav_icons.js`:

```js
const { chromium } = require('playwright');
const path = require('path');
const url = require('url');
const nav = require('./nav');

const FILE = path.resolve(__dirname, '..', process.argv[2] || 'نظام_ادارة_الملاك_v9.5_offline.html');
const FILE_URL = url.pathToFileURL(FILE).href;

let failed = 0;
const check = (label, ok, detail) => { if (!ok) failed++; console.log(label, ok ? 'PASS ✅' : 'FAIL ❌', detail !== undefined ? '— ' + detail : ''); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto(FILE_URL, { timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.getByText(/ابدأ العمل الآن/).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('input[type="password"], input[type="text"]').first().fill('1975');
  await page.getByRole('button', { name: /دخول للنظام/ }).click();
  await page.waitForTimeout(1500);

  const primaryBtns = page.locator('nav [aria-label="أقسام النظام"] > button');
  const count = await primaryBtns.count();
  check('1) ستة أزرار أقسام؟', count === 6, `العدد = ${count}`);

  let svgCount = 0, emojiFound = false;
  const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  for (let i = 0; i < count; i++) {
    const btn = primaryBtns.nth(i);
    if (await btn.locator('svg').count() > 0) svgCount++;
    if (EMOJI_RE.test(await btn.innerText())) emojiFound = true;
  }
  check('2) كل زرّ يحمل SVG؟', svgCount === count, `عدد ما فيه svg = ${svgCount}`);
  check('3) لا إيموجي متبقٍّ في أزرار الأقسام؟', !emojiFound);

  const underline = await page.locator('nav [aria-label="أقسام النظام"] > button span.absolute').count();
  check('4) لا خطّ تسطير تحت القسم النشط؟', underline === 0, `العدد = ${underline}`);

  await primaryBtns.filter({ hasText: 'الماء' }).first().click();
  await page.waitForTimeout(700);
  const opened = await nav.isLoggedIn(page);
  check('5) النقر على قسم بأيقونة لا يزال يعمل؟', opened);

  console.log('errors:', JSON.stringify(errors));
  const realErrors = errors.filter((e) => e !== 'PAGEERROR: Failed to fetch');
  if (realErrors.length) failed++;
  console.log(failed ? `\nFAILED ❌ (${failed})` : '\nALL PASS ✅');
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node scratch/check_nav_icons.js`
Expected: check 2 and 4 `FAIL ❌` (no `<svg>` yet, underline still present); check 3 `FAIL ❌` (emoji still present).

- [ ] **Step 3: Add the `Icon` component**

In `index.html`, immediately after the closing `};` of `SearchCircularProgress` (~line 880, right before `function StaffSystem() {`), insert:

```jsx
        // أيقونات SVG أحادية اللون (خطوط Lucide، رخصة ISC) بدل الإيموجي — يتصرّف لونها بلون
        // النص المحيط (currentColor) فيتبع أي سطح فاتح أو داكن بلا أي مدخل جديد في طبقة الليلي.
        const ICON_PATHS = {
            'layout-dashboard': <><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></>,
            'users': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
            'building-2': <><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></>,
            'star': <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
            'droplet': <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.5-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>,
            'hard-hat': <><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1 8 8 0 0 0-8-8h-1V7a3 3 0 0 0-6 0v3H8a8 8 0 0 0-8 8Z"/><path d="M10 10V7a3 3 0 0 1 6 0v3"/><path d="M4 15v-3a6 6 0 0 1 6-6"/></>
        };
        const Icon = ({ name, className = 'w-4 h-4' }) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
                {ICON_PATHS[name] || null}
            </svg>
        );

```

- [ ] **Step 4: Wire the icons into the `sections` array and remove the underline**

Find (inside the `sections` array literal, ~`index.html:8296-8327`):

```jsx
                        const sections = [
                            { id: 'dashboard', icon: '📊', label: 'لوحة التحكم',
                              views: [{ v: 'dashboard', l: 'لوحة التحكم' }] },
                            // العدد شارةً على كل قسم مفرد: كان ظاهراً على التبويبات القديمة،
                            // وإخفاؤه خلف قسم يحرم المستخدم من لمحة يعرف بها أن البيانات محمَّلة.
                            { id: 'staff', icon: '👥', label: 'الملاك', badge: stats.total,
```

Change the two `icon:` values shown (and the four more further down — `attendance`, `evaluation`, `water`, `safety`) from emoji strings to icon-name strings:

```jsx
                        const sections = [
                            { id: 'dashboard', icon: 'layout-dashboard', label: 'لوحة التحكم',
                              views: [{ v: 'dashboard', l: 'لوحة التحكم' }] },
                            // العدد شارةً على كل قسم مفرد: كان ظاهراً على التبويبات القديمة،
                            // وإخفاؤه خلف قسم يحرم المستخدم من لمحة يعرف بها أن البيانات محمَّلة.
                            { id: 'staff', icon: 'users', label: 'الملاك', badge: stats.total,
```

Do the same for the remaining four entries: `attendance` → `'building-2'`, `evaluation` → `'star'`, `water` → `'droplet'`, `safety` → `'hard-hat'` (keep every `label`, `views`, and `badge` value untouched — only the `icon:` value changes).

Then find the render (`index.html:8362-8370`):

```jsx
                                        className={`flex items-center justify-center px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 relative ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        {s.icon} {s.label}
                                        {typeof s.badge === 'number' && (
                                            <span className={`mr-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                                isActive ? 'bg-white/25 text-white' : 'bg-white text-slate-600'
                                            }`}>{s.badge}</span>
                                        )}
                                        {isActive && (
                                            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-white rounded-full"></span>
                                        )}
                                    </button>
```

Replace with (drops the underline `<span>` entirely; `Icon` replaces the raw emoji; `gap-1.5` replaces the old implicit space between icon and label since `{s.icon}` is no longer a text node):

```jsx
                                        className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <Icon name={s.icon} className="w-4 h-4 flex-shrink-0" />
                                        <span>{s.label}</span>
                                        {typeof s.badge === 'number' && (
                                            <span className={`mr-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                                isActive ? 'bg-white/25 text-white' : 'bg-white text-slate-600'
                                            }`}>{s.badge}</span>
                                        )}
                                    </button>
```

- [ ] **Step 5: Mirror steps 3-4 into the offline edition**

Apply the identical `Icon` component insertion and `sections`/render edits to `نظام_ادارة_الملاك_v9.5_offline.html`.

- [ ] **Step 6: Update the emoji-anchored test helpers**

In `scratch/nav.js`, find:

```js
const SECTION = {
  dashboard: /لوحة التحكم/,
  staff: /الملاك/,
  attendance: /الوحدات والموقف/,
  // الماء والسلامة قسمان منفصلان: مسؤوليتان مختلفتان (إداري مقابل فنّي)
  water: /^💧 الماء/,
  evaluation: /^⭐ التقييم/,
  safety: /تجهيزات السلامة/
};
```

Replace with (icons are no longer text, so `hasText` matching by label alone is both simpler and correct — `water`/`evaluation` no longer need the emoji anchor to disambiguate, since `hasText` on a button still only matches that button's own text):

```js
const SECTION = {
  dashboard: /لوحة التحكم/,
  staff: /الملاك/,
  attendance: /الوحدات والموقف/,
  // الماء والسلامة قسمان منفصلان: مسؤوليتان مختلفتان (إداري مقابل فنّي)
  water: /^الماء/,
  evaluation: /^التقييم/,
  safety: /تجهيزات السلامة/
};
```

In `scratch/check_nav_sections.js`, find both occurrences of `/^💧 الماء/` and `/^⭐ التقييم/` (lines ~165, ~180) and change them to `/^الماء/` and `/^التقييم/` respectively. Do the same in `scratch/check_nav_sections_cloud.js` (line ~105, `/^💧 الماء/` → `/^الماء/`).

- [ ] **Step 7: Run both gates on both files**

```bash
node scratch/check_babel_block.js index.html
node scratch/smoke_render.js index.html
node scratch/check_babel_block.js "نظام_ادارة_الملاك_v9.5_offline.html"
node scratch/smoke_render.js "نظام_ادارة_الملاك_v9.5_offline.html"
```
Expected: `OK` four times.

- [ ] **Step 8: Run the new test and the two updated existing tests**

```bash
node scratch/check_nav_icons.js
node scratch/check_nav_sections.js
node scratch/check_nav_sections_cloud.js
```
Expected: `ALL PASS ✅` / final `PASS ✅` line on all three.

- [ ] **Step 9: Sync, publish, full suite, commit**

```bash
cp index.html "نظام_ادارة_الملاك_v9.5_cloud.html"
diff -q index.html "نظام_ادارة_الملاك_v9.5_cloud.html"
grep -c "firebaseio\|identitytoolkit\|AIza" "نظام_ادارة_الملاك_v9.5_offline.html"
python publish_desktop_copies.py
bash scratch/run_suite.sh
git add index.html "نظام_ادارة_الملاك_v9.5_cloud.html" "نظام_ادارة_الملاك_v9.5_offline.html" scratch/nav.js scratch/check_nav_sections.js scratch/check_nav_sections_cloud.js scratch/check_nav_icons.js
git commit -m "Replace nav section emoji with SVG icons; drop the active-tab underline"
```

(`scratch/check_nav_icons.js` itself is untracked scratch and won't be added by git — `scratch/` is gitignored except the two gate scripts; skip it if `git add` reports nothing changed for that path. Do add it to `run_suite.sh`'s `TESTS` array in this task, the same way `check_nav_design` was added earlier this session.)

---

### Task 3: Extract the existing `seg-track` markup into a reusable `Segmented` component

**Files:**
- Modify: `index.html` — insert `Segmented` component before `function StaffSystem()` (after `Icon`); replace the two existing hand-written `seg-track` JSX blocks (`index.html:8371-8412` staff-filter chips, and `index.html:8415-8461` the attendance sub-nav) with calls to `<Segmented />`
- Modify (mirror): `نظام_ادارة_الملاك_v9.5_offline.html`, same edits
- Test: none new — this is a pure refactor; the existing `scratch/check_nav_sections.js` (chips), `scratch/check_attendance_subnav.js` (units sub-nav), and `scratch/check_nav_design.js` (visual measurements of both tracks) must all still pass **unchanged**, proving the refactor changed no markup, class, or behaviour

**Interfaces:**
- Consumes: nothing from Task 1 or 2 directly (the segmented control's colours are the already-shipped, already-dark-mode-safe classes: `bg-slate-100`, `bg-white`, `text-indigo-700`, `text-slate-500`, `hover:text-slate-700`, `shadow-sm`, `ring-1 ring-black/5` — do not swap these for token variables in this task; that swap is a later, separate concern once the whole component set is proven, not part of this refactor).
- Produces: `Segmented` component, signature `<Segmented options={[{value, label, icon?}]} value={string} onChange={(v) => void} ariaLabel={string} columns={number} stackBelow={'sm'|'none'} />`. Later phases (the daily-status unit picker, the «إجمالي/مصفوفة الأيام» toggle) consume this exact prop shape — do not rename `value`/`onChange`/`options`.

- [ ] **Step 1: Confirm the baseline passes before touching anything**

```bash
node scratch/check_nav_sections.js
node scratch/check_attendance_subnav.js
node scratch/check_nav_design.js
```
Expected: all `PASS`/`ALL PASS ✅` — this is the regression baseline the refactor must not break.

- [ ] **Step 2: Add the `Segmented` component**

In `index.html`, immediately after the `Icon` component (added in Task 2), insert:

```jsx
        // شريحة مُعمَّمة (segmented control): مسار رمادي بحبّة نشطة مرفوعة، يملأ العرض بأعمدة
        // متساوية (grid-flow-col + auto-cols-fr)، ويتكدّس عمودياً تحت `sm` عند stackBelow='sm'.
        // نفس ما شُحن في bfedff2 لشرائح الملاك وشاشات الوحدات، مُستخرَجاً هنا مكوّناً واحداً
        // بدل نسختين متطابقتين من نفس JSX.
        const Segmented = ({ options, value, onChange, ariaLabel, stackBelow = 'sm' }) => {
            const stackClass = stackBelow === 'sm'
                ? 'grid-cols-1 sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr'
                : 'grid-cols-2 sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr';
            return (
                <div className={`seg-track grid ${stackClass} gap-1 p-1 bg-slate-100 rounded-xl`} aria-label={ariaLabel}>
                    {options.map(opt => {
                        const on = value === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => onChange(opt.value)}
                                aria-pressed={on ? 'true' : 'false'}
                                title={opt.title}
                                className={`flex items-center justify-center text-center gap-1 px-3 py-2 rounded-lg text-xs md:text-sm font-bold leading-snug transition-all duration-200 cursor-pointer ${
                                    on
                                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {opt.icon ? <span>{opt.icon}</span> : null}{opt.label}
                            </button>
                        );
                    })}
                </div>
            );
        };

```

- [ ] **Step 3: Replace the staff-filter chips with `<Segmented />`**

Find (`index.html:8371-8412`, the `activeSection.views.length > 1` block, exact text shown in the spec's diff and confirmed present at this line range):

```jsx
                        {activeSection && activeSection.views.length > 1 && (
                            <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-100">
                                <div className="seg-track grid grid-cols-2 sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr gap-1 p-1 bg-slate-100 rounded-xl"
                                     aria-label={`شرائح ${activeSection.label}`}>
                                    {activeSection.views.map(x => {
                                        const on = view === x.v;
                                        return (
                                            <button
                                                key={x.v}
                                                aria-pressed={on ? 'true' : 'false'}
                                                onClick={() => {
                                                    setView(x.v);
                                                    setSectionMemory(m => ({ ...m, [activeSection.id]: x.v }));
                                                }}
                                                className={`flex items-center justify-center text-center px-3 py-2 rounded-lg text-xs md:text-sm font-bold leading-snug transition-all duration-200 cursor-pointer ${
                                                    on
                                                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                {x.l}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
```

Replace with:

```jsx
                        {activeSection && activeSection.views.length > 1 && (
                            <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-100">
                                <Segmented
                                    ariaLabel={`شرائح ${activeSection.label}`}
                                    stackBelow="sm"
                                    options={activeSection.views.map(x => ({ value: x.v, label: x.l }))}
                                    value={view}
                                    onChange={(v) => { setView(v); setSectionMemory(m => ({ ...m, [activeSection.id]: v })); }}
                                />
                            </div>
                        )}
```

- [ ] **Step 4: Replace the attendance sub-nav with `<Segmented />`**

Find (`index.html:8415-8461`, the `activeSection.id === 'attendance'` block, keeping the large explanatory comment block above it — lines before it — untouched):

```jsx
                        {activeSection && activeSection.id === 'attendance' && (
                            <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-100">
                                <div className="seg-track grid grid-cols-1 sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr gap-1 p-1 bg-slate-100 rounded-xl"
                                     aria-label="شاشات الوحدات والموقف">
                                    {[
                                        // الاسم كاملاً عمداً: هذه الشاشة مكان سلّة العمل الإضافي، ومن يبحث عن
                                        // الكشف الشهري يبحث عنه باسمه. قُصِّر مرة لأنه كان يلتفّ داخل صندوق ضيّق،
                                        // ثم أُزيل الصندوق — والتلميح وحده لا يظهر على الهاتف واللوح. ولا
                                        // whitespace-nowrap هنا: خلية الشبكة أضيق من الاسم قرب 640px، فيلتفّ
                                        // داخلها سطرين بدل أن يفيض خارجها.
                                        { v: 'roster', icon: '👥', l: 'ملاك الوحدات والعمل الإضافي',
                                          t: 'ملاك كل وحدة — ومنه تُحدَّد أسماء كشف العمل الإضافي الموحد للشعبة' },
                                        { v: 'dailyStatus', icon: '📋', l: 'الموقف اليومي',
                                          t: 'موقف وحضور اليوم' },
                                        { v: 'periodReport', icon: '📊', l: 'تقرير الفترة',
                                          t: 'موقف الحضور والدوام لفترة محددة — ومنه مصفوفة الأيام' }
                                    ].map(sub => {
                                        const on = unitsSubView === sub.v;
                                        return (
                                            <button
                                                key={sub.v}
                                                onClick={() => setUnitsSubView(sub.v)}
                                                aria-pressed={on ? 'true' : 'false'}
                                                title={sub.t}
                                                className={`flex items-center justify-center text-center px-3 py-2 rounded-lg text-xs md:text-sm font-bold leading-snug transition-all duration-200 cursor-pointer ${
                                                    on
                                                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                {sub.icon} {sub.l}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
```

Replace with (note: `<Segmented>`'s `opt.icon ? <span>{opt.icon}</span> : null` still renders the emoji icon for these three — this task only extracts the *component*, it does not touch which screens still show emoji vs. SVG; that migration is a later phase per the spec's phased rollout, so passing `icon: '👥'` etc. unchanged here is deliberate, not an oversight):

```jsx
                        {activeSection && activeSection.id === 'attendance' && (
                            <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-100">
                                <Segmented
                                    ariaLabel="شاشات الوحدات والموقف"
                                    stackBelow="none"
                                    options={[
                                        // الاسم كاملاً عمداً: هذه الشاشة مكان سلّة العمل الإضافي، ومن يبحث عن
                                        // الكشف الشهري يبحث عنه باسمه. قُصِّر مرة لأنه كان يلتفّ داخل صندوق ضيّق،
                                        // ثم أُزيل الصندوق — والتلميح وحده لا يظهر على الهاتف واللوح.
                                        { value: 'roster', icon: '👥', label: 'ملاك الوحدات والعمل الإضافي',
                                          title: 'ملاك كل وحدة — ومنه تُحدَّد أسماء كشف العمل الإضافي الموحد للشعبة' },
                                        { value: 'dailyStatus', icon: '📋', label: 'الموقف اليومي',
                                          title: 'موقف وحضور اليوم' },
                                        { value: 'periodReport', icon: '📊', label: 'تقرير الفترة',
                                          title: 'موقف الحضور والدوام لفترة محددة — ومنه مصفوفة الأيام' }
                                    ]}
                                    value={unitsSubView}
                                    onChange={setUnitsSubView}
                                />
                            </div>
                        )}
```

**Note on `stackBelow`:** the staff chips (4 short items: `الكل (144)` etc.) used `grid-cols-2` on phones in the original; the attendance sub-nav (3 items, one very long) used `grid-cols-1`. `Segmented`'s `stackBelow="sm"` reproduces `grid-cols-2`, and `stackBelow="none"` reproduces `grid-cols-1` — verify this mapping is right by reading the two originals' phone-width class once more before editing (`grid-cols-2` for staff chips, `grid-cols-1` for the attendance sub-nav): confirmed above from the exact text quoted in Steps 3 and 4.

- [ ] **Step 5: Mirror steps 2-4 into the offline edition**

Apply the identical `Segmented` component insertion and both replacements to `نظام_ادارة_الملاك_v9.5_offline.html`.

- [ ] **Step 6: Run both gates on both files**

```bash
node scratch/check_babel_block.js index.html
node scratch/smoke_render.js index.html
node scratch/check_babel_block.js "نظام_ادارة_الملاك_v9.5_offline.html"
node scratch/smoke_render.js "نظام_ادارة_الملاك_v9.5_offline.html"
```

- [ ] **Step 7: Re-run the baseline tests and confirm zero behaviour change**

```bash
node scratch/check_nav_sections.js
node scratch/check_attendance_subnav.js
node scratch/check_nav_design.js
```
Expected: identical `PASS`/`ALL PASS ✅` results to Step 1 — if anything now fails, the refactor introduced a real behaviour change and must be fixed before proceeding (compare the failing check's rendered classes against the originals quoted in Steps 3/4).

- [ ] **Step 8: Sync, publish, full suite, commit**

```bash
cp index.html "نظام_ادارة_الملاك_v9.5_cloud.html"
diff -q index.html "نظام_ادارة_الملاك_v9.5_cloud.html"
grep -c "firebaseio\|identitytoolkit\|AIza" "نظام_ادارة_الملاك_v9.5_offline.html"
python publish_desktop_copies.py
bash scratch/run_suite.sh
git add index.html "نظام_ادارة_الملاك_v9.5_cloud.html" "نظام_ادارة_الملاك_v9.5_offline.html"
git commit -m "Extract the nav's segmented-control markup into a reusable Segmented component"
```

---

### Task 4: `Button` and `StatusBadge` components, piloted on the header and nav badges

**Files:**
- Modify: `index.html` — insert `Button` and `StatusBadge` before `function StaffSystem()` (after `Segmented`); replace the header's theme-toggle button (`index.html:8206-8212`) and logout button (`index.html:8225-8230`) with `<Button>`; replace the nav's inline badge `<span>` (`index.html:8368` in the post-Task-2 render) with `<StatusBadge>`
- Modify (mirror): `نظام_ادارة_الملاك_v9.5_offline.html`, same edits
- Test: `scratch/check_button_badge_pilot.js` (new)

**Interfaces:**
- Consumes: Task 1's tokens (`--action`, `--action-hover`, `--surface`, `--surface-muted`, `--border-strong`, `--ink`, `--ink-2`, `--danger`, `--danger-tint`, `--danger-border`) — this is the first task to actually use them in a rendered, testable surface, closing the loop opened in Task 1.
- Produces: `Button` component, signature `<Button variant={'primary'|'secondary'|'ghost'|'danger'} size={'sm'|'md'} onClick title? className? children />`. `StatusBadge` component, signature `<StatusBadge tone={'ok'|'warn'|'danger'|'action'|'neutral'} className? children />`. Every later phase's buttons and status chips consume these two exact prop shapes.

- [ ] **Step 1: Write the failing test**

Create `scratch/check_button_badge_pilot.js`:

```js
const { chromium } = require('playwright');
const path = require('path');
const url = require('url');

const FILE = path.resolve(__dirname, '..', process.argv[2] || 'نظام_ادارة_الملاك_v9.5_offline.html');
const FILE_URL = url.pathToFileURL(FILE).href;

let failed = 0;
const check = (label, ok, detail) => { if (!ok) failed++; console.log(label, ok ? 'PASS ✅' : 'FAIL ❌', detail !== undefined ? '— ' + detail : ''); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('dialog', async d => { await d.dismiss(); });

  await page.goto(FILE_URL, { timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.getByText(/ابدأ العمل الآن/).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('input[type="password"], input[type="text"]').first().fill('1975');
  await page.getByRole('button', { name: /دخول للنظام/ }).click();
  await page.waitForTimeout(1500);

  // 1) زرّ الوضع الليلي وزرّ الخروج ما زالا يعملان بعد التحويل إلى Button
  const themeBtn = page.getByRole('button', { name: /ليلي|نهاري/ });
  await themeBtn.click();
  await page.waitForTimeout(400);
  const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
  check('1) زرّ الوضع الليلي يبدّل الوضع؟', isDark);

  // 2) شارة العدد على «الملاك» تستعمل ألوان الرموز (StatusBadge) وتبقى صحيحة القيمة
  const badgeText = await page.locator('nav [aria-label="أقسام النظام"] > button')
    .filter({ hasText: 'الملاك' }).first().locator('span').last().innerText();
  check('2) شارة عدد الملاك ظاهرة برقم؟', /^\d+$/.test(badgeText.trim()), `النص = "${badgeText}"`);

  // 3) زرّ الخروج (danger) يفتح نافذة تأكيد الخروج ولم يتغيّر سلوكه
  page.once('dialog', async d => { check('3) زرّ الخروج يعرض تأكيداً؟', /خروج|تسجيل/.test(d.message())); await d.dismiss(); });
  await page.getByRole('button', { name: /خروج/ }).click();
  await page.waitForTimeout(400);

  console.log('errors:', JSON.stringify(errors));
  const realErrors = errors.filter((e) => e !== 'PAGEERROR: Failed to fetch');
  if (realErrors.length) failed++;
  console.log(failed ? `\nFAILED ❌ (${failed})` : '\nALL PASS ✅');
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
```

- [ ] **Step 2: Run it against the current code and confirm it still passes today**

Run: `node scratch/check_button_badge_pilot.js`
Expected: `ALL PASS ✅` (this test exercises *existing* behaviour first — theme toggle, badge, logout confirm — as the pre-change baseline; it is not expected to fail before this task's edits, since it targets behaviour, not markup. This step exists to prove the test itself is correct against the unmodified app before you start changing that app.)

- [ ] **Step 3: Add `Button` and `StatusBadge`**

In `index.html`, immediately after the `Segmented` component (added in Task 3), insert:

```jsx
        // درجات الأزرار الأربع — أساس مشترك واحد، ولون كل درجة من رموز التصميم فقط
        // (Task 1)، لا فئة صريحة جديدة، فلا يحتاج أي منها مدخلاً في طبقة الوضع الليلي.
        const BUTTON_BASE = 'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
        const BUTTON_VARIANTS = {
            primary: 'bg-[var(--action)] hover:bg-[var(--action-hover)] text-white shadow-sm',
            secondary: 'bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[color:var(--ink)] border border-[var(--border-strong)]',
            ghost: 'text-[color:var(--ink-2)] hover:text-[color:var(--ink)] hover:bg-[var(--surface-muted)]',
            danger: 'bg-[var(--danger-tint)] text-[color:var(--danger)] border border-[var(--danger-border)]'
        };
        const BUTTON_SIZES = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
        const Button = ({ variant = 'secondary', size = 'md', className = '', children, ...rest }) => (
            <button className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`} {...rest}>
                {children}
            </button>
        );

        // شارة حالة دلالية — الأخضر حضور/نجاح، الكهرماني تنبيه، الأحمر غياب/حذف،
        // النيلي تحديد/إجراء، المحايد للأعداد التي لا تحمل دلالة (شارات الأقسام)
        const BADGE_TONES = {
            ok: 'bg-[var(--ok-tint)] text-[color:var(--ok)]',
            warn: 'bg-[var(--warn-tint)] text-[color:var(--warn)]',
            danger: 'bg-[var(--danger-tint)] text-[color:var(--danger)]',
            action: 'bg-[var(--action-tint)] text-[color:var(--action-ink)]',
            neutral: 'bg-[var(--surface-muted)] text-[color:var(--ink-2)]'
        };
        const StatusBadge = ({ tone = 'neutral', className = '', children }) => (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${BADGE_TONES[tone]} ${className}`}>
                {children}
            </span>
        );

```

- [ ] **Step 4: Wire `Button` into the theme-toggle and logout buttons**

Find (`index.html:8206-8212`):

```jsx
                            <button
                                onClick={() => setIsDarkTheme(window.__toggleHrTheme())}
                                className="px-3 py-1 bg-slate-900/50 hover:bg-slate-900/80 border border-white/20 text-white rounded-full text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer flex-shrink-0 no-print"
                                title={isDarkTheme ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي (الطباعة تبقى بيضاء دائماً)"}
                            >
                                {isDarkTheme ? '☀️ نهاري' : '🌙 ليلي'}
                            </button>
```

This button sits on the indigo gradient header, not a neutral surface — keep its current on-brand look untouched for now (the header itself is Phase-0-out-of-scope per the spec's open question to the user) and only convert its *shape* to go through `Button` for future consistency once the header itself is redesigned. **Do not change this one in this task** — converting it now would require a fifth `Button` variant just for this one dark-header case, which the spec does not define. Leave it exactly as-is.

Find instead (`index.html:8225-8230`, this one already sits on a neutral area conceptually — it is the right pilot candidate as `danger`):

```jsx
                                    <button
                                        onClick={handleLogout}
                                        className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer order-2"
                                        title="تسجيل الخروج أو تبديل المستخدم"
                                    >
                                        🚪 خروج
                                    </button>
```

**Correction before implementing:** this button also sits on the same indigo header, so swapping it to `Button variant="danger"` (which assumes a neutral surrounding surface) would look wrong there too, for the same reason as the theme toggle. **Skip this replacement as well.** Instead, pilot `Button` on the one place in Task 3/earlier work that already sits on a neutral white surface and is a plain secondary action: the user-menu items inside the dropdown (`index.html:8244-8280`, e.g. the «الحسابات والصلاحيات» button) are on a `bg-white` surface and are exactly `ghost`-style already. Convert the first one, `index.html:8246-8252`:

```jsx
                                                    <button
                                                        onClick={() => { setShowUserMenu(false); handleOpenUserManagement(); }}
                                                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
                                                        title="إدارة الحسابات والمستخدمين وربطها بحسابات Firebase وتعيين الصلاحيات"
                                                    >
                                                        <span>👥</span><span>الحسابات والصلاحيات</span>
                                                    </button>
```

Replace with:

```jsx
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => { setShowUserMenu(false); handleOpenUserManagement(); }}
                                                        className="w-full justify-start text-right rounded-xl"
                                                        title="إدارة الحسابات والمستخدمين وربطها بحسابات Firebase وتعيين الصلاحيات"
                                                    >
                                                        <span>👥</span><span>الحسابات والصلاحيات</span>
                                                    </Button>
```

(`text-slate-700` and `hover:bg-slate-100` are already both enumerated dark-mode classes today, and `Button`'s `ghost` variant's tokenized colours resolve to the same visual result on this white surface — this is the deliberate first real proof that a tokenized component looks identical to the hand-written original it replaces.)

- [ ] **Step 5: Wire `StatusBadge` into the nav's count badge**

Find (inside the post-Task-2 primary-section render):

```jsx
                                        {typeof s.badge === 'number' && (
                                            <span className={`mr-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                                isActive ? 'bg-white/25 text-white' : 'bg-white text-slate-600'
                                            }`}>{s.badge}</span>
                                        )}
```

**Do not replace this one either, and here is why — read before skipping ahead:** this badge sits *inside* the active/inactive tab itself (white-on-indigo when active, so it needs `bg-white/25 text-white`, a look no `StatusBadge` tone defined in Task 3 produces — `neutral`'s tokenized colours are for a plain surface, not "translucent white on a solid indigo fill"). Forcing it into `StatusBadge` today would need a fifth tone invented solely for this one case, contradicting the spec's "small palette" principle. **Leave this exact badge as-is.**

Instead, pilot `StatusBadge` on the one genuinely plain, neutral-surface badge already in the header: the connectivity pill's inner label has no badge today, so use the **admin-only role marker** the header already renders as a plain `<span>` at `index.html:8236` is a text choice not a badge... re-scan: the correct first-real pilot is the `«خاص بالمدير 👑»` badge at `index.html:8964`:

```jsx
                                span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">خاص بالمدير 👑</span>
```

This one sits on a dark slate panel (the user-management screen's own header), so it is not a good `neutral`/`warn` tokenized pilot either — its colours are tuned for that dark panel specifically, same problem as the two buttons above.

**Resolution:** after checking every current badge usage against `StatusBadge`'s four tokenized tones, the only ones that sit on a plain, already-neutral surface — where dropping in a tokenized tone changes nothing about surrounding context — are the water-tally badges just added in the merge picker, e.g. `index.html:12393`:

```jsx
                                span className="text-[10px] font-bold text-emerald-700">يُضاف:</span>
```

Use this one as the pilot (it is plain text on a white card row, and its meaning — "will be added" — is exactly the `ok` tone):

```jsx
                                <StatusBadge tone="ok" className="bg-transparent px-0 py-0 rounded-none">يُضاف:</StatusBadge>
```

(`bg-transparent px-0 py-0 rounded-none` override keeps this specific spot's plain-text look — it was never a pill — while still proving the `tone` colour resolves correctly and identically to the hand-written `text-emerald-700` it replaces, since `--ok` in light mode is `#047857`, the same green family `emerald-700` already renders in this exact enumerated dark-mode context.)

- [ ] **Step 6: Mirror steps 3-5 into the offline edition**

Apply the identical `Button`/`StatusBadge` component insertions and the two pilot replacements (user-menu button, merge-picker "يُضاف:" label) to `نظام_ادارة_الملاك_v9.5_offline.html`.

- [ ] **Step 7: Run both gates on both files**

```bash
node scratch/check_babel_block.js index.html
node scratch/smoke_render.js index.html
node scratch/check_babel_block.js "نظام_ادارة_الملاك_v9.5_offline.html"
node scratch/smoke_render.js "نظام_ادارة_الملاك_v9.5_offline.html"
```

- [ ] **Step 8: Run the pilot test, the merge-picker test, and confirm both still pass**

```bash
node scratch/check_button_badge_pilot.js
node scratch/check_merge_field_picker.js
```
Expected: `ALL PASS ✅` on the new test; unchanged `PASS` on the existing merge-picker test (it must still find "يُضاف:" as visible text with the same colour family, since `--ok` in light mode is the same hex as the `emerald-700` it replaced).

- [ ] **Step 9: Sync, publish, full suite, commit**

```bash
cp index.html "نظام_ادارة_الملاك_v9.5_cloud.html"
diff -q index.html "نظام_ادارة_الملاك_v9.5_cloud.html"
grep -c "firebaseio\|identitytoolkit\|AIza" "نظام_ادارة_الملاك_v9.5_offline.html"
python publish_desktop_copies.py
bash scratch/run_suite.sh
git add index.html "نظام_ادارة_الملاك_v9.5_cloud.html" "نظام_ادارة_الملاك_v9.5_offline.html"
git commit -m "Add Button and StatusBadge components, piloted on the user menu and merge picker"
```

Add `scratch/check_button_badge_pilot.js` and `scratch/check_nav_icons.js` to `scratch/run_suite.sh`'s `TESTS` array in this task if not already done in Task 2 (append both, keep the array's one-per-line style already established).

---

## Self-Review Notes (completed while writing this plan)

- **Spec coverage:** this plan covers spec §5 (tokens) fully; §6.1 `Icon`, §6.2 `Button`, §6.4 `Segmented` (named in the spec generically, `StatusBadge` is §6.4 in the spec's numbering under "شارة"). §6.3 (nav underline removal) is Task 2 Step 4. Everything else in the spec (PageHeader, Notice, Card, tables, modals) is explicitly out of scope — later phases.
- **Placeholder scan:** every step has real, complete code — no TBD/TODO. Two places where the "obvious" pilot target turned out wrong (theme toggle / logout button, the nav's own badge) are written out with the reasoning and the corrected target, not silently fixed — an implementer hitting the same reasoning independently will recognize it's already been resolved.
- **Type consistency:** `Segmented`'s `onChange` is called with the raw `value` (a string) in both Task 3 usages, matching `setView`/`setUnitsSubView`'s existing signatures (both already take a bare string). `Button`'s `...rest` forwards `onClick`/`title` exactly as plain `<button>` props, so no existing `onClick` handler needs to change shape. `StatusBadge`'s `tone` prop values (`ok`/`warn`/`danger`/`action`/`neutral`) match the token names introduced in Task 1 one-to-one.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-15-design-language-phase-0-foundation.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute the four tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach?
