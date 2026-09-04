# Dated Status Periods Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the employee's undated status flag with dated periods entered once — course, secondment, unpaid leave, ordinary leave, long leave, maternity, absence — that expire on their own, raise a return prompt, and drive the water lists and the evaluation by date instead of by the status at the moment of printing.

**Architecture:** A `statusPeriods` array on each employee record. One helper, `getActivePeriod(emp, dateStr)`, answers which period covers a date; the two existing daily-status resolvers consult it where they currently read `emp.status`. Nothing is written at boot: an employee with no periods but a legacy non-active status resolves through a synthetic open-ended period, so no reader breaks and no data is rewritten. The dashboard banner and the return prompt are computed from the periods on every render.

**Tech Stack:** Vanilla JS + React 18 (in-browser Babel, no build step), Firebase Realtime Database REST API.

**Spec:** `docs/superpowers/specs/2026-09-03-dated-status-periods-design.md`

## Global Constraints

- **Do not `git push`.** Every task commits locally only. `main` deploys to GitHub Pages and is the copy the division uses.
- No new npm packages, build step, or SDK. All app code is one `<script type="text/babel">` block inside `index.html` (~872 KB), transpiled in the browser.
- **Two gates, both run on every task:** `node scratch/check_babel_block.js <file>` (syntax) and `node scratch/smoke_render.js <file>` (evaluates the component; catches TDZ and undefined-at-init). A green syntax gate alone proves nothing — a TDZ crash white-screened this app once already.
- **Declaration order matters.** A `useMemo`/`useState` initialiser or a dependency array runs during render, so anything it reads must be declared above it. Helpers only *called* later may sit anywhere before the JSX return.
- The seven period types are exactly: `إجازة اعتيادية`, `في دورة`, `إيفاد`, `إجازة بدون راتب`, `إجازة طويلة`, `إجازة أمومة`, `غياب`. Never invent an eighth or rename one.
- `emp.status` is read in 64 places and must keep working untouched. It is never deleted.
- Dates are `YYYY-MM-DD` strings compared with `<=` / `>=`; lexicographic ordering is valid for this format and is the convention already used for `lastCloudUpdate`.
- Tasks 1–6 modify `index.html` only. Task 7 mirrors into `نظام_ادارة_الملاك_v8.5_cloud.html` (byte-identical) and ports the non-cloud parts into `نظام_ادارة_الملاك_v8.5_offline.html`, which must keep zero references to `firebaseio.com`, `identitytoolkit` or `AIza`.
- **No automated test suite exists.** Every task verifies with the two gates, greps, and the named manual browser steps.

---

## Task 1: The period model and the daily resolvers

**Files:**
- Modify: `index.html` — above `getEmployeeDefaultNaturalStatus` (~line 2446), and inside both resolvers (~2447 and ~2514)

**Interfaces:**
- Produces: `PERIOD_TYPES` (array of the seven strings), `getActivePeriod(emp, dateStr)` returning a period object or `null`, `periodsOf(emp)` returning the employee's array or `[]`.

- [ ] **Step 1: Confirm both resolver sites**

Run: `grep -n "if (emp.status && emp.status !== 'نشط')" index.html`

Expected: exactly two lines. One sits in `getEmployeeDefaultNaturalStatus`, the other in `getEmployeeDailyStatus`. **Both must change.** Changing only one makes the "default" shown in the daily-entry dropdown disagree with the status that gets printed.

- [ ] **Step 2: Add the helpers above the first resolver**

Find:
```js
            // الحصول على الموقف الطبيعي الافتراضي للمنتسب بدون أي تعديلات (الحضور/الدوام الأصلي)
            const getEmployeeDefaultNaturalStatus = (emp, dateStr) => {
```
Insert immediately **before** that comment:
```js
            // ===== الفترات المؤرَّخة للحالات (Dated Status Periods) =====
            const PERIOD_TYPES = ['إجازة اعتيادية', 'في دورة', 'إيفاد', 'إجازة بدون راتب', 'إجازة طويلة', 'إجازة أمومة', 'غياب'];

            const periodsOf = (emp) => (emp && Array.isArray(emp.statusPeriods)) ? emp.statusPeriods : [];

            // الفترة التي تغطّي تاريخاً بعينه. to فارغة تعني فترة مفتوحة النهاية.
            // الحسابات القديمة التي تحمل حالة دائمة ولا فترات لها تُقرأ كفترة مفتوحة
            // مشتقّة — بلا كتابة أي بيانات، فلا يتغيّر موقف أحد لحظة التحديث.
            const getActivePeriod = (emp, dateStr) => {
                if (!emp || !dateStr) return null;
                const list = periodsOf(emp);
                if (list.length > 0) {
                    return list.find(p => p && p.from && dateStr >= p.from && (!p.to || dateStr <= p.to)) || null;
                }
                if (emp.status && emp.status !== 'نشط') {
                    return { id: 'legacy_' + emp.id, type: emp.status, from: '1900-01-01', to: null, note: '', legacy: true };
                }
                return null;
            };

```

- [ ] **Step 3: Use it in `getEmployeeDefaultNaturalStatus`**

Find (the first of the two occurrences, inside `getEmployeeDefaultNaturalStatus`):
```js
            const getEmployeeDefaultNaturalStatus = (emp, dateStr) => {
                if (emp.status && emp.status !== 'نشط') {
                    return emp.status;
                }
```
Replace with:
```js
            const getEmployeeDefaultNaturalStatus = (emp, dateStr) => {
                const activePeriod = getActivePeriod(emp, dateStr);
                if (activePeriod) {
                    return activePeriod.type;
                }
```

- [ ] **Step 4: Use it in `getEmployeeDailyStatus`**

Find (the second occurrence, which follows the `dailyStatusOverrides` block and its closing braces):
```js
                        return ov;
                    }
                }
                if (emp.status && emp.status !== 'نشط') {
                    return emp.status;
                }
```
Replace with:
```js
                        return ov;
                    }
                }
                const activePeriod = getActivePeriod(emp, dateStr);
                if (activePeriod) {
                    return activePeriod.type;
                }
```

Note the ordering this preserves: the daily override is checked *first* and still wins, so an employee returning for a single day mid-course is recorded without splitting the period.

- [ ] **Step 5: Verify**

Run: `grep -c "getActivePeriod" index.html`
Expected: `4` (one definition, one call in each resolver, and the `PERIOD_TYPES` block's comment does not count — if you get 3, one resolver was missed).

Run: `grep -c "if (emp.status && emp.status !== 'نشط')" index.html`
Expected: `0`.

Run: `node scratch/check_babel_block.js index.html` → `OK`
Run: `node scratch/smoke_render.js index.html` → `OK`

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Resolve daily status from dated periods instead of a flag

getActivePeriod answers which period covers a date; both daily-status
resolvers now consult it where they read emp.status. Changing only one
would have made the default offered in the entry dropdown disagree with
the status that gets printed.

An employee with a legacy status and no periods resolves through a
synthetic open-ended period rather than a migration that rewrites
records, so nothing changes for anyone at the moment of update and no
existing reader of emp.status breaks.

The daily override is still checked first, so returning for one day
mid-course is recorded without splitting the period.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Editing periods in the employee record

**Files:**
- Modify: `index.html` — the employee edit modal (`{showEditModal && editingEmployee && (`, ~line 10259)

**Interfaces:**
- Consumes: `PERIOD_TYPES`, `periodsOf`, `updateEditField` (the modal's existing field setter).
- Produces: `addPeriodToEditing()`, `updateEditingPeriod(index, key, value)`, `removeEditingPeriod(index)`.

- [ ] **Step 1: Confirm the modal and its field setter**

Run: `grep -n "const updateEditField" index.html`
Expected: one definition. It is how every other field in this modal is written; the period handlers follow the same pattern so the modal's dirty-tracking and save path need no changes.

- [ ] **Step 2: Add the three handlers next to `updateEditField`**

Find:
```js
            const updateEditField = (field, value) => {
```
Insert immediately **before** it:
```js
            const addPeriodToEditing = () => {
                if (!editingEmployee) return;
                const today = new Date().toISOString().split('T')[0];
                const next = [...periodsOf(editingEmployee), { id: 'per_' + Date.now(), type: 'في دورة', from: today, to: '', note: '' }];
                setEditingEmployee({ ...editingEmployee, statusPeriods: next });
            };

            const updateEditingPeriod = (index, key, value) => {
                if (!editingEmployee) return;
                const next = periodsOf(editingEmployee).map((p, i) => i === index ? { ...p, [key]: value } : p);
                setEditingEmployee({ ...editingEmployee, statusPeriods: next });
            };

            const removeEditingPeriod = (index) => {
                if (!editingEmployee) return;
                const next = periodsOf(editingEmployee).filter((p, i) => i !== index);
                setEditingEmployee({ ...editingEmployee, statusPeriods: next });
            };

```

- [ ] **Step 3: Add the periods table to the modal**

`<option value="نشط">نشط</option>` appears **twice** in the file. The one you want is inside the edit modal and is indented with 48 spaces, not 68. Match this whole block, which is unique:

```jsx
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
                                            <select value={editingEmployee.status}
                                                onChange={(e) => updateEditField('status', e.target.value)}
                                                className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none">
                                                <option value="نشط">نشط</option>
                                                <option value="في دورة">في دورة</option>
                                                <option value="إجازة طويلة">إجازة طويلة</option>
                                                <option value="إجازة أمومة">إجازة أمومة</option>
                                            </select>
                                        </div>
```

Leave that block exactly as it is — `emp.status` stays in use for the 64 readers — and insert immediately **after** it:
```jsx
                                    <div className="md:col-span-2 space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-black text-slate-800">📅 فترات الحالة المؤرَّخة</span>
                                            <button type="button" onClick={addPeriodToEditing} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition cursor-pointer">
                                                ➕ إضافة فترة
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            تُدخل الفترة مرة واحدة فتتولّى بقية الأيام. اترك حقل «إلى» فارغاً لفترة مفتوحة النهاية تستمر حتى تُنهيها — وهذا شكل الغياب.
                                        </p>
                                        {periodsOf(editingEmployee).length === 0 ? (
                                            <div className="text-center text-slate-400 text-xs font-bold py-3">لا توجد فترات مسجّلة.</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {periodsOf(editingEmployee).map((p, idx) => (
                                                    <div key={p.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-white border border-slate-200 rounded-lg p-2">
                                                        <select
                                                            value={p.type || ''}
                                                            onChange={(e) => updateEditingPeriod(idx, 'type', e.target.value)}
                                                            className="md:col-span-3 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-indigo-600"
                                                        >
                                                            {PERIOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                        <input
                                                            type="date"
                                                            value={p.from || ''}
                                                            onChange={(e) => updateEditingPeriod(idx, 'from', e.target.value)}
                                                            title="من"
                                                            className="md:col-span-3 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-indigo-600"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={p.to || ''}
                                                            onChange={(e) => updateEditingPeriod(idx, 'to', e.target.value)}
                                                            title="إلى — اتركه فارغاً لفترة مفتوحة"
                                                            className="md:col-span-3 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-indigo-600"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={p.note || ''}
                                                            onChange={(e) => updateEditingPeriod(idx, 'note', e.target.value)}
                                                            placeholder="ملاحظة"
                                                            className="md:col-span-2 border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-600"
                                                        />
                                                        <button type="button" onClick={() => removeEditingPeriod(idx)} title="حذف الفترة" className="md:col-span-1 px-2 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-black transition cursor-pointer">
                                                            🗑️
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
```

Run the compile gate immediately after this insertion — it is the largest JSX block in the plan.

- [ ] **Step 4: Reject overlapping periods on save**

Find the employee-save handler by running: `grep -n "const saveEmployeeEdit\|const handleSaveEmployee" index.html` and read it. At the top of whichever function commits `editingEmployee` back into `staff`, insert:
```js
                const periods = periodsOf(editingEmployee).filter(p => p.from);
                for (let i = 0; i < periods.length; i++) {
                    for (let j = i + 1; j < periods.length; j++) {
                        const a = periods[i], b = periods[j];
                        const aEnd = a.to || '9999-12-31';
                        const bEnd = b.to || '9999-12-31';
                        if (a.from <= bEnd && b.from <= aEnd) {
                            alert('⛔ فترتان متداخلتان: «' + a.type + '» و«' + b.type + '».' + String.fromCharCode(10,10) + 'لا يمكن أن يكون الموظف في حالتين في اليوم نفسه. عدّل التواريخ ثم أعد الحفظ.');
                            return;
                        }
                    }
                }
```
If the handler's name differs from both greps, report the name you found and where you placed the guard.

- [ ] **Step 5: Verify**

Run: `node scratch/check_babel_block.js index.html` → `OK`
Run: `node scratch/smoke_render.js index.html` → `OK`
Run: `grep -c "updateEditingPeriod" index.html` → at least `5`

- [ ] **Step 6: Manual check**

Open `index.html`, log in as admin, edit an employee. Add a period of type `في دورة` from today to today+10, save, reopen — the period is still there. Add a second period overlapping the first and save: the save is refused with the overlap message and nothing is written.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Let an employee's dated periods be edited in their record

A table in the employee modal adds, edits and deletes periods, with an
empty end date meaning open-ended. Saving refuses two periods that
overlap, since an employee cannot be in two states on one day and the
resolver would silently pick whichever came first in the array.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: The dashboard banner

**Files:**
- Modify: `index.html` — near the other dashboard-level computations, and the dashboard view (`{view === 'dashboard' ? (`, ~line 6023)

**Interfaces:**
- Consumes: `periodsOf`, `staff`.
- Produces: `periodAlerts` — `{ endingSoon: [{emp, period, daysLeft}], endedUnconfirmed: [{emp, period}] }`.

- [ ] **Step 1: Add the computation**

Insert immediately after the `getActivePeriod` helper block from Task 1:
```js
            // تنبيهات الفترات: ما يوشك على الانتهاء، وما انتهى ولم تُؤكَّد المباشرة.
            // يُحسب من الفترات في كل رسم — لا تخزين ولا وظيفة خلفية.
            const periodAlerts = React.useMemo(() => {
                const today = new Date().toISOString().split('T')[0];
                const soonLimit = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
                const endingSoon = [];
                const endedUnconfirmed = [];
                (staff || []).forEach(emp => {
                    periodsOf(emp).forEach(p => {
                        if (!p || !p.to || p.confirmedReturn) return;
                        if (p.to >= today && p.to <= soonLimit) {
                            const daysLeft = Math.round((new Date(p.to) - new Date(today)) / 86400000);
                            endingSoon.push({ emp, period: p, daysLeft });
                        } else if (p.to < today) {
                            endedUnconfirmed.push({ emp, period: p });
                        }
                    });
                });
                endedUnconfirmed.sort((a, b) => (a.period.to < b.period.to ? -1 : 1));
                endingSoon.sort((a, b) => a.daysLeft - b.daysLeft);
                return { endingSoon, endedUnconfirmed };
            }, [staff]);

```

`staff` must be declared above this point. Check with `grep -n "const \[staff, setStaff\]" index.html`; if it is declared below, move this block to sit after it — a `useMemo` dependency array is evaluated during render, and reading `staff` before its declaration throws a TDZ error that the syntax gate cannot see.

- [ ] **Step 2: Render the banner**

Find:
```jsx
                        {view === 'dashboard' ? (
```
Insert immediately **before** that line:
```jsx
                        {(periodAlerts.endingSoon.length > 0 || periodAlerts.endedUnconfirmed.length > 0) && (
                            <div className="mb-4 space-y-2 no-print">
                                {periodAlerts.endedUnconfirmed.length > 0 && (
                                    <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-xl">
                                        <div className="font-black text-rose-900 text-sm mb-1">🔴 انتهت فترتهم ولم تُؤكَّد المباشرة ({periodAlerts.endedUnconfirmed.length})</div>
                                        <div className="text-xs text-rose-800 font-bold leading-relaxed">
                                            {periodAlerts.endedUnconfirmed.map(a => `${a.emp.name} (${a.period.type} — انتهت ${a.period.to})`).join(' · ')}
                                        </div>
                                    </div>
                                )}
                                {periodAlerts.endingSoon.length > 0 && (
                                    <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl">
                                        <div className="font-black text-amber-900 text-sm mb-1">🟡 تنتهي فترتهم خلال ثلاثة أيام ({periodAlerts.endingSoon.length})</div>
                                        <div className="text-xs text-amber-800 font-bold leading-relaxed">
                                            {periodAlerts.endingSoon.map(a => `${a.emp.name} (${a.period.type} — بعد ${a.daysLeft} يوم)`).join(' · ')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
```

- [ ] **Step 3: Verify**

Run: `node scratch/check_babel_block.js index.html` → `OK`
Run: `node scratch/smoke_render.js index.html` → `OK`
Run: `grep -c "periodAlerts" index.html` → at least `6`

- [ ] **Step 4: Manual check**

Give an employee a period ending yesterday: their name appears in the red banner. Give another a period ending in two days: the amber banner. Remove both: neither banner renders — the wrapper must disappear entirely, not leave an empty box.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Surface periods that are ending or have ended unconfirmed

Two banners on the dashboard, computed from the periods on every render
rather than stored: one amber for periods ending within three days, one
red for periods that have ended without the return being confirmed. The
red list stays until each is resolved, so nobody silently keeps a status
they no longer have.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: The return prompt

**Files:**
- Modify: `index.html` — near the other modals

**Interfaces:**
- Consumes: `periodAlerts`, `staff`, `setStaff`, `pushDataToCloud`, `logAuditEvent`, `currentUserName`, `canEdit`.
- Produces: `pendingReturnPrompt` state, `confirmReturn(didResume)`.

- [ ] **Step 1: Add the state and handler**

Insert immediately after the `periodAlerts` block from Task 3:
```js
            const [dismissedReturnIds, setDismissedReturnIds] = useState([]);

            // يُسأل عن موظف واحد في كل مرة، بترتيب تاريخ الانتهاء
            const pendingReturnPrompt = React.useMemo(() => {
                if (!canEdit('staffMaster')) return null;
                return periodAlerts.endedUnconfirmed.find(a => !dismissedReturnIds.includes(a.period.id)) || null;
            }, [periodAlerts, dismissedReturnIds, currentUserRole, currentUserPermissions]);

            const confirmReturn = (didResume) => {
                if (!pendingReturnPrompt) return;
                const { emp, period } = pendingReturnPrompt;
                const dayAfter = new Date(new Date(period.to).getTime() + 86400000).toISOString().split('T')[0];
                const updated = (staff || []).map(s => {
                    if (s.id !== emp.id) return s;
                    const marked = periodsOf(s).map(p => p.id === period.id ? { ...p, confirmedReturn: true } : p);
                    // «لا» تفتح غياباً مفتوح النهاية من اليوم التالي، فلا يختفي من الكشف بصمت
                    const withAbsence = didResume ? marked : [...marked, { id: 'per_' + Date.now(), type: 'غياب', from: dayAfter, to: '', note: 'لم يباشر بعد انتهاء ' + period.type }];
                    return { ...s, statusPeriods: withAbsence };
                });
                setStaff(updated);
                safeStorage.setItem('staffData', JSON.stringify(updated));
                pushDataToCloud();
                logAuditEvent((didResume ? 'confirm_return:' : 'no_return:') + (emp.jobNumber || emp.id), currentUserName);
                setDismissedReturnIds(prev => [...prev, period.id]);
            };

```

`pushDataToCloud()` is called with no argument on purpose: the no-argument form reads live state, and `setStaff` has already been called above it. React batches state updates, so the push may still read the previous `staff` — that is why `safeStorage` is written directly on the line before, and why the next ordinary save carries the change up regardless. Do not try to pass a hand-built bundle; there is no helper for it in this codebase.

- [ ] **Step 2: Render the prompt**

Insert immediately before the line `{showEditModal && editingEmployee && (`:
```jsx
            {pendingReturnPrompt && (
                <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[130] flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-4 text-white">
                            <h3 className="text-base font-black flex items-center gap-2"><span>✅</span><span>تأكيد المباشرة</span></h3>
                        </div>
                        <div className="p-5 space-y-4 text-right">
                            <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                عاد <span className="font-black text-emerald-800">{pendingReturnPrompt.emp.name}</span> إلى الوضع الطبيعي بانتهاء ({pendingReturnPrompt.period.type}) في {pendingReturnPrompt.period.to}.
                            </p>
                            <p className="text-sm font-black text-slate-900">هل باشر فعلاً؟</p>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => confirmReturn(true)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow transition cursor-pointer">
                                    نعم، باشر
                                </button>
                                <button type="button" onClick={() => confirmReturn(false)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow transition cursor-pointer">
                                    لا — لم يباشر بعد
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                «لا» تفتح غياباً مفتوح النهاية من اليوم التالي لانتهاء الفترة، فيبقى ظاهراً في الكشف حتى يعود.
                            </p>
                        </div>
                    </div>
                </div>
            )}

```

- [ ] **Step 3: Verify**

Run: `node scratch/check_babel_block.js index.html` → `OK`
Run: `node scratch/smoke_render.js index.html` → `OK`

- [ ] **Step 4: Manual check**

Give an employee a course ending yesterday, reload. The prompt appears. Press «لا»: the employee gains an open-ended `غياب` starting the day after the course ended, and the daily roster shows him as absent today. Reload again: the prompt does not reappear for that period.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Ask whether an employee actually resumed when a period ends

A period ending is not the same as a return. On opening the system, the
oldest unconfirmed expiry asks whether the employee actually resumed —
one at a time, so nobody faces ten questions at once. Answering no opens
an open-ended absence from the day after the period ended, so his status
does not silently revert to present while he is still away. Both answers
are audit-logged.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: The water lists

**Files:**
- Modify: `index.html` — the `maa`, `maaMorning` and `maaShift` filters (~lines 4043, 4055, 4083), and the employee edit modal

**Interfaces:**
- Consumes: `periodsOf`, `getActivePeriod`.
- Produces: `waterMonth` state (`YYYY-MM`), `isExcludedFromWater(emp, monthStr)`, `emp.excludeFromWaterLists` boolean field.

- [ ] **Step 1: Read the three filters as they stand**

Run: `grep -n "جاسم عزيز" index.html`

Expected: three occurrences, one in each water filter. Each filter also carries three conditions that can never execute — `!s.status.includes('مجاز')`, `!s.status.includes('دورة')` and `!s.status.includes('إجازة')` — because the same expression already requires `s.status === 'نشط'`, and a value equal to `'نشط'` cannot contain `'دورة'`. They look like they are doing the work; they are not.

- [ ] **Step 2: Add the month state and the exclusion rule**

Insert immediately after the `periodAlerts` block:
```js
            const [waterMonth, setWaterMonth] = useState(() => new Date().toISOString().slice(0, 7));

            const daysInMonth = (monthStr) => {
                const [y, m] = monthStr.split('-').map(Number);
                return new Date(y, m, 0).getDate();
            };

            // قاعدتان مختلفتان لنوعين مختلفين:
            //  • في دورة        → أي تماس مع الشهر يستبعد، ولو يوماً واحداً.
            //  • إجازة طويلة    → تستبعد إن غطّت نصف أيام الشهر فأكثر.
            const isExcludedFromWater = (emp, monthStr) => {
                if (!emp) return false;
                if (emp.excludeFromWaterLists) return true;
                const total = daysInMonth(monthStr);
                const monthStart = monthStr + '-01';
                const monthEnd = monthStr + '-' + String(total).padStart(2, '0');
                let longLeaveDays = 0;
                const list = periodsOf(emp).length ? periodsOf(emp) : (emp.status && emp.status !== 'نشط' ? [{ type: emp.status, from: '1900-01-01', to: null }] : []);
                for (const p of list) {
                    if (!p || !p.from) continue;
                    const pEnd = p.to || '9999-12-31';
                    if (p.from > monthEnd || pEnd < monthStart) continue; // لا تماس
                    if (p.type === 'في دورة') return true;
                    if (p.type === 'إجازة طويلة') {
                        const from = p.from > monthStart ? p.from : monthStart;
                        const to = pEnd < monthEnd ? pEnd : monthEnd;
                        longLeaveDays += Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
                    }
                }
                return longLeaveDays >= Math.ceil(total / 2);
            };

```

- [ ] **Step 3: Rewrite the three filters**

Replace the body of `view === 'maaMorning'`:
```js
                    result = data.filter(s => 
                        s.status === 'نشط' && 
                        s.workType === 'صباحي' && 
                        !s.name.includes('جاسم عزيز') &&
                        !s.status.includes('مجاز') &&
                        !s.status.includes('دورة') &&
                        !s.status.includes('إجازة')
                    ); 
```
with:
```js
                    result = data.filter(s =>
                        s.workType === 'صباحي' &&
                        !isExcludedFromWater(s, waterMonth)
                    );
```

Replace the body of `view === 'maaShift'`:
```js
                result = data.filter(s => 
                    s.status === 'نشط' && 
                    s.workType === 'مناوب' &&
                    !s.status.includes('مجاز') &&
                    !s.status.includes('دورة') &&
                    !s.status.includes('إجازة')
                );
```
with:
```js
                result = data.filter(s =>
                    s.workType === 'مناوب' &&
                    !isExcludedFromWater(s, waterMonth)
                );
```

Replace the body of `view === 'maa'`:
```js
                    result = data.filter(s => 
                        s.status === 'نشط' && 
                        !s.name.includes('جاسم عزيز') &&
                        !s.status.includes('مجاز') &&
                        !s.status.includes('دورة') &&
                        !s.status.includes('إجازة')
                    );
```
with:
```js
                    result = data.filter(s => !isExcludedFromWater(s, waterMonth));
```

Note what changed beyond the rule: `s.status === 'نشط'` is gone. Exclusion is now decided by the periods covering the chosen month, not by the status at this instant — which is the whole point. An employee whose course ended last month belongs in this month's list.

- [ ] **Step 4: Add the month picker above the water views**

Find the JSX that renders the results table header for these views and insert, so it shows only for the three water views:
```jsx
                            {(view === 'maa' || view === 'maaMorning' || view === 'maaShift') && (
                                <div className="mb-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex flex-wrap items-center gap-3 no-print">
                                    <span className="text-xs font-black text-cyan-900">💧 شهر قائمة الماء:</span>
                                    <input
                                        type="month"
                                        value={waterMonth}
                                        onChange={(e) => setWaterMonth(e.target.value)}
                                        className="border border-cyan-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold outline-none focus:border-cyan-600"
                                    />
                                    <span className="text-[11px] text-cyan-800 font-bold">
                                        يُستبعد من في دورة تمسّ هذا الشهر مهما قصرت، ومن غطّت إجازتُه الطويلة نصف أيامه فأكثر.
                                    </span>
                                </div>
                            )}
```
If you cannot identify a single anchor that renders once for all three views, place it immediately inside the same container that renders the results table and report exactly where you put it.

- [ ] **Step 5: Add the permanent-exclusion checkbox**

In the employee edit modal, immediately after the periods table from Task 2, insert:
```jsx
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 p-3 bg-cyan-50 border border-cyan-200 rounded-xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!editingEmployee.excludeFromWaterLists}
                                                onChange={(e) => updateEditField('excludeFromWaterLists', e.target.checked)}
                                                className="w-4 h-4 accent-cyan-600"
                                            />
                                            <span className="text-xs font-bold text-cyan-900">💧 مستثنى دائماً من قوائم الماء</span>
                                        </label>
                                    </div>
```

- [ ] **Step 6: Set the flag for the previously hardcoded employee**

The name `جاسم عزيز` is no longer in the code, so his exclusion must be carried into his record instead. Insert this one-shot migration next to the `waterMonth` state:
```js
            // نقل الاستثناء الدائم من الكود إلى ملف الموظف — يجري مرة واحدة
            const waterExclusionMigratedRef = React.useRef(false);
            React.useEffect(() => {
                if (waterExclusionMigratedRef.current) return;
                if (!staff || staff.length === 0) return;
                waterExclusionMigratedRef.current = true;
                const target = staff.find(s => s.name && s.name.includes('جاسم عزيز'));
                if (target && !target.excludeFromWaterLists) {
                    setStaff(prev => prev.map(s => s.id === target.id ? { ...s, excludeFromWaterLists: true } : s));
                }
            }, [staff]);

```

- [ ] **Step 7: Verify**

Run: `grep -c "جاسم عزيز" index.html`
Expected: `1` — only the migration above. If it is `3`, a filter still carries the hardcoded name.

Run: `grep -c "s.status.includes('مجاز')" index.html`
Expected: `0`.

Run: `node scratch/check_babel_block.js index.html` → `OK`
Run: `node scratch/smoke_render.js index.html` → `OK`

- [ ] **Step 8: Manual check**

Give an employee a `في دورة` period covering only 3 days of the chosen month: he disappears from the water list. Change it to `إجازة طويلة` for the same 3 days: he reappears. Extend the long leave to cover more than half the month: he disappears again. Change the month picker to a month the period does not touch: he appears.

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "Decide water lists by the month they cover, not by today's status

The three water filters read the employee's status at the instant of
printing, so someone who finished a two-month course yesterday appeared
in the whole month's list and someone starting tomorrow appeared too.
They also carried three conditions that could never execute — the same
expression required status to equal نشط, so testing whether it contains
دورة was dead — and an employee's name written into the filter.

Exclusion is now computed from the periods covering a chosen month, with
the two rules the division actually uses: a course excludes at any
length, because it is an assignment where the employee is provisioned
elsewhere and his share is never drawn; a long leave excludes only when
it covers half the month or more, because someone who worked most of the
month has earned his share. A month picker makes the month explicit
rather than implied.

The hardcoded name moves into a field on his record, migrated once, so
the exclusion survives a rename and can be changed without touching code.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: The evaluation filter

**Files:**
- Modify: `index.html` — `view === 'evaluation'` (~line 4075) and the `evaluation` stat (~line 3075)

- [ ] **Step 1: Confirm both sites**

Run: `grep -n "status !== 'إجازة طويلة'" index.html`
Expected: two lines — one in the view filter, one in the dashboard stat counter. Both read the status at this instant.

- [ ] **Step 2: Make both period-aware**

Replace, in the view filter:
```js
                    result = data.filter(s => s.jobTitle !== 'عقد' && s.status !== 'إجازة طويلة' && s.status !== 'إجازة أمومة');
```
with:
```js
                    // التقييم لحظة واحدة لا مدى شهري، فيُفحص تاريخ اليوم فقط
                    const evalDate = new Date().toISOString().split('T')[0];
                    result = data.filter(s => {
                        if (s.jobTitle === 'عقد') return false;
                        const p = getActivePeriod(s, evalDate);
                        return !(p && (p.type === 'إجازة طويلة' || p.type === 'إجازة أمومة'));
                    });
```

Replace, in the stat counter:
```js
                evaluation: staff.filter(s => s.jobTitle !== 'عقد' && s.status !== 'إجازة طويلة' && s.status !== 'إجازة أمومة').length,
```
with:
```js
                evaluation: staff.filter(s => {
                    if (s.jobTitle === 'عقد') return false;
                    const p = getActivePeriod(s, new Date().toISOString().split('T')[0]);
                    return !(p && (p.type === 'إجازة طويلة' || p.type === 'إجازة أمومة'));
                }).length,
```

`getActivePeriod` must be declared above the stat counter. Check with `grep -n "const getActivePeriod\|evaluation: staff.filter"`; if the counter comes first, move the Task 1 helper block above it and re-run both gates.

- [ ] **Step 3: Verify**

Run: `grep -c "status !== 'إجازة طويلة'" index.html` → `0`
Run: `node scratch/check_babel_block.js index.html` → `OK`
Run: `node scratch/smoke_render.js index.html` → `OK`

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Exclude from evaluation by the period covering today

Both the evaluation view and its dashboard counter tested the employee's
status flag, so a long leave that ended last week still excluded him and
one starting tomorrow did not. Both now ask which period covers today.
No half-month rule here: an evaluation is a moment, not a span.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Mirror to the other editions and update the documentation

**Files:**
- Modify: `نظام_ادارة_الملاك_v8.5_cloud.html` (by copy), `نظام_ادارة_الملاك_v8.5_offline.html` (by porting), `نظام_ادارة_الملاك_الدليل_الشامل_للقواعد.md`

- [ ] **Step 1: Mirror the cloud edition**

```bash
cp index.html "نظام_ادارة_الملاك_v8.5_cloud.html"
diff -q index.html "نظام_ادارة_الملاك_v8.5_cloud.html" && echo identical
```

- [ ] **Step 2: Port into the offline edition**

Every change in Tasks 1–6 is pure logic and UI with no network call, so all of them belong in the offline edition too. Apply the same edits, using the same anchors — the offline file carries the same function names and the same two resolver sites. Do **not** copy `index.html` over it: that edition has its own local-code login and no Firebase, and overwriting it would destroy that.

One exception: Task 4's `confirmReturn` calls `pushDataToCloud` and `logAuditEvent`. In the offline edition, keep the `setStaff` and `safeStorage` lines and drop those two calls — there is no cloud and no audit log there. Say in your report exactly what you dropped.

- [ ] **Step 3: Verify all three**

```bash
for f in "index.html" "نظام_ادارة_الملاك_v8.5_cloud.html" "نظام_ادارة_الملاك_v8.5_offline.html"; do
  node scratch/check_babel_block.js "$f"; node scratch/smoke_render.js "$f"; done
grep -c "firebaseio\|identitytoolkit\|AIza" "نظام_ادارة_الملاك_v8.5_offline.html"
```
Expected: six `OK` lines, and `0` for the offline isolation count.

- [ ] **Step 4: Update the rules guide**

In `نظام_ادارة_الملاك_الدليل_الشامل_للقواعد.md`:

* Section 4.1's status table gains a row for `إجازة بدون راتب` (treated as ordinary leave, included in the Thursday–Sunday bridging rule).
* A new section documents the dated periods: the seven types, that an empty end date means open-ended, that a daily override beats a period, the three-day warning and the return prompt, and that answering "no" opens an open-ended absence.
* Section 8's water-list description gains the two exclusion rules with the worked example from the spec's section 6.2, and the permanent-exclusion field replacing the hardcoded name.

- [ ] **Step 5: Publish the Desktop copies**

```bash
python publish_desktop_copies.py
```
Expected: it reports parity and isolation both fine, then copies. If it refuses, fix what it names rather than bypassing it.

- [ ] **Step 6: Commit**

```bash
git add index.html "نظام_ادارة_الملاك_v8.5_cloud.html" "نظام_ادارة_الملاك_v8.5_offline.html" "نظام_ادارة_الملاك_الدليل_الشامل_للقواعد.md"
git commit -m "Mirror dated periods into both editions and document the rules

Every change in this feature is logic and UI with no network call, so
the offline edition receives all of it — ported rather than copied,
since that edition has its own local-code login and must keep zero
Firebase references. Its return prompt drops the cloud push and the
audit call, which have no meaning there.

The rules guide gains the dated-period model, unpaid leave in the status
table, and the two water-list rules with their worked example.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Ordering note

Task 1 must land first: Tasks 3, 5 and 6 all call `getActivePeriod` or `periodsOf`. Task 3 must precede Task 4, whose prompt reads `periodAlerts`. Tasks 5 and 6 are independent of each other and of Task 4. Task 7 is last because it mirrors the finished result.
