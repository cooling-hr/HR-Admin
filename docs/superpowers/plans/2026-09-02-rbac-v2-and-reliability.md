# RBAC v2 and Sync Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth role (`manager`) between admin and operator along the separation-of-duties line, make the audit log tamper-evident, stop concurrent editors silently overwriting each other, and make a rejected cloud save visible instead of silent.

**Architecture:** All changes live inside the single `<script type="text/babel">` block of `index.html`, then are mirrored byte-for-byte into `نظام_ادارة_الملاك_v8.5_cloud.html` by copying the file. Role authority continues to come from the server-side `roles/{uid}` node read at login. New client state (`currentUserPermissions`, `cloudSyncStatus.error`, peer-lock state) is plain React `useState`. Firebase Security Rules are published by hand from the console as the final task.

**Tech Stack:** Vanilla JS + React 18 (in-browser Babel, no build step), Firebase Realtime Database REST API, Firebase Identity Toolkit REST API.

**Spec:** `docs/superpowers/specs/2026-09-02-rbac-v2-and-reliability-design.md`

## Global Constraints

- **Do not `git push`.** Every task commits locally only. `main` is deployed to GitHub Pages and is the copy the division actually uses; pushing is a deployment. The final task hands the decision to the user.
- No new npm packages, build step, or SDK — stay with the existing plain-`fetch()` REST style.
- `نظام_ادارة_الملاك_v8.5_offline.html` must not be touched by any task. It must keep zero references to `firebaseio.com`, `identitytoolkit`, or `AIza`.
- `index.html` and `نظام_ادارة_الملاك_v8.5_cloud.html` must be byte-identical at the end of Task 9.
- Public read of `system_bundle` stays open (`.read: true`) — browsing and printing without login is deliberate.
- Role keys are exactly `admin`, `manager`, `operator`, `viewer`. Never introduce a fifth string or rename an existing key; `operator`'s *display* label changes but its key does not.
- **No automated test suite exists.** Every task verifies with (a) the Babel compile check from Task 1 Step 1, (b) greps, and (c) named manual browser steps. Run the same check before and after a change to confirm it moved from failing to passing.

---

## Task 1: Set up the compile check and add the `manager` role vocabulary

**Files:**
- Create: `scratch/check_babel_block.js`
- Modify: `index.html` — `canEdit` (~line 966), role `<select>` (~line 6031), role badges (~line 6153)

**Interfaces:**
- Produces: role key `'manager'` accepted throughout the UI; `canEdit(section)` returns `true` for it.

- [ ] **Step 1: Create the reusable compile check**

This project has no test runner. This script is the substitute and every later task calls it. Create `scratch/check_babel_block.js`:

```js
// Extracts the largest <script type="text/babel"> block from an HTML file
// and compiles it with the vendored Babel standalone build. Exits non-zero
// on a syntax error. Usage: node scratch/check_babel_block.js <file.html>
const fs = require('fs');
const vm = require('vm');

const target = process.argv[2];
if (!target) { console.error('usage: node scratch/check_babel_block.js <file.html>'); process.exit(2); }

const html = fs.readFileSync(target, 'utf8');
const blocks = [...html.matchAll(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!blocks.length) { console.error('no babel block found in ' + target); process.exit(2); }
const jsx = blocks.reduce((a, b) => (b.length > a.length ? b : a), '');

const babelCode = fs.readFileSync('scratch/babel.min.js', 'utf8');
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
```

- [ ] **Step 2: Run it on all three files to establish the baseline**

Run:
```bash
for f in "index.html" "نظام_ادارة_الملاك_v8.5_cloud.html" "نظام_ادارة_الملاك_v8.5_offline.html"; do node scratch/check_babel_block.js "$f"; done
```
Expected: three `OK` lines. If any line says `FAIL`, stop — the tree was already broken before this plan started and that must be resolved first.

- [ ] **Step 3: Confirm the current `canEdit` shape**

Run: `grep -n "const canEdit" -A 9 index.html`

Expected: a function that returns `true` only for `'admin'`, then falls through to `currentUserPermissions` for `'operator'`.

- [ ] **Step 4: Grant `manager` full section access in `canEdit`**

Find:
```js
            const canEdit = (section) => {
                if (currentUserRole === 'admin') return true;
                if (currentUserRole !== 'operator') return false;
```
Replace with:
```js
            const canEdit = (section) => {
                // الأدمن والإداري يملكان كل الأقسام؛ الفرق بينهما في الهوية والتعافي والتدمير لا في البيانات
                if (currentUserRole === 'admin' || currentUserRole === 'manager') return true;
                if (currentUserRole !== 'operator') return false;
```

- [ ] **Step 5: Add the role to the user-management `<select>`**

Find:
```jsx
                                            <option value="operator">✍️ إداري مُدخل (صلاحيات مخصصة حسب التبويبات)</option>
                                            <option value="admin">👑 مدير النظام (كامل الصلاحيات والحذف)</option>
                                            <option value="viewer">👁️ مستعرض (عرض وطباعة وبحث فقط)</option>
```
Replace with:
```jsx
                                            <option value="operator">✍️ مُدخل بيانات (صلاحيات مخصصة حسب التبويبات)</option>
                                            <option value="manager">🛡️ إداري (تعديل كل الأقسام بلا إدارة حسابات ولا استعادة)</option>
                                            <option value="admin">👑 مدير النظام (كامل الصلاحيات والحذف)</option>
                                            <option value="viewer">👁️ مستعرض (عرض وطباعة وبحث فقط)</option>
```

- [ ] **Step 6: Add the role badge in the users table**

Find:
```jsx
                                                    if (u.role === 'admin') roleBadge = <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300">👑 مدير النظام</span>;
```
Replace with:
```jsx
                                                    if (u.role === 'admin') roleBadge = <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300">👑 مدير النظام</span>;
                                                    else if (u.role === 'manager') roleBadge = <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-50 text-teal-900 border border-teal-300">🛡️ إداري</span>;
```

- [ ] **Step 7: Grant a `manager` all four permissions on save**

Find:
```js
                const permsToSave = userFormRole === 'admin' 
```
Replace with:
```js
                const permsToSave = (userFormRole === 'admin' || userFormRole === 'manager')
```

- [ ] **Step 8: Verify**

Run: `node scratch/check_babel_block.js index.html`
Expected: `OK`

Run: `grep -c "'manager'" index.html`
Expected: at least `3`.

- [ ] **Step 9: Commit**

```bash
git add scratch/check_babel_block.js index.html
git commit -m "Add the manager role to the permission vocabulary

canEdit grants a manager every section, the user-management select and
the users table know the role, and saving one stores all four section
permissions. operator's display label becomes مُدخل بيانات; its key is
unchanged so existing accounts keep working.

Adds scratch/check_babel_block.js, the compile check this project uses
in place of a test runner.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Protect the last admin account

**Files:**
- Modify: `index.html` — `handleSaveUser` (~line 1310), `handleDeleteUser` (~line 1425)

**Interfaces:**
- Consumes: `systemUsers` array, each `{id, name, role, uid, active, permissions}`.
- Produces: `isLastActiveAdmin(userId)` helper used by both handlers.

- [ ] **Step 1: Confirm the handlers exist**

Run: `grep -n "const handleSaveUser\|const handleDeleteUser\|const handleToggleUserActive" index.html`
Expected: three lines.

- [ ] **Step 2: Add the helper immediately above `handleSaveUser`**

Find:
```js
            const handleSaveUser = (e) => {
```
Replace with:
```js
            // حذف آخر مدير أو تنزيل رتبته يقفل إدارة الحسابات نهائياً — لا مخرج إلا يدوياً من لوحة Firebase
            const isLastActiveAdmin = (userId) => {
                const activeAdmins = systemUsers.filter(u => u.role === 'admin' && u.active !== false);
                return activeAdmins.length === 1 && activeAdmins[0].id === userId;
            };

            const handleSaveUser = (e) => {
```

- [ ] **Step 3: Block demoting the last admin**

Find (inside `handleSaveUser`, immediately after the `existingWithUid` check block closes):
```js
                let updatedUsers;
```
Replace with:
```js
                if (editingUserId && userFormRole !== 'admin' && isLastActiveAdmin(editingUserId)) {
                    alert('⛔ لا يمكن تنزيل رتبة آخر مدير نظام نشط.\n\nلو فقد هذا الحساب صفة المدير، لن يستطيع أحد إسناد الأدوار بعدها، ولن يُفتح النظام إلا بتدخل يدوي من لوحة Firebase.\n\nعيّن مديراً آخر أولاً، ثم أعد المحاولة.');
                    return;
                }

                let updatedUsers;
```

- [ ] **Step 4: Block deleting and deactivating the last admin**

Find:
```js
            const handleDeleteUser = (userId) => {
```
Replace with:
```js
            const handleDeleteUser = (userId) => {
                if (isLastActiveAdmin(userId)) {
                    alert('⛔ لا يمكن حذف آخر مدير نظام نشط.\n\nعيّن مديراً آخر أولاً، ثم أعد المحاولة.');
                    return;
                }
```

Find:
```js
            const handleToggleUserActive = (userId) => {
```
Replace with:
```js
            const handleToggleUserActive = (userId) => {
                if (isLastActiveAdmin(userId)) {
                    alert('⛔ لا يمكن تعطيل آخر مدير نظام نشط.\n\nعيّن مديراً آخر أولاً، ثم أعد المحاولة.');
                    return;
                }
```

- [ ] **Step 5: Verify**

Run: `node scratch/check_babel_block.js index.html`
Expected: `OK`

Run: `grep -c "isLastActiveAdmin" index.html`
Expected: `4` (one definition, three call sites).

- [ ] **Step 6: Manual check**

Open `index.html`, log in as admin, open إدارة الحسابات. With only one admin in the list, try each of: changing that admin's role to إداري and saving; pressing 🗑️ on that row; toggling its مفعل badge. Each must refuse with the explanatory message and leave the list unchanged.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Refuse to delete, deactivate, or demote the last active admin

With roles now held server-side in roles/{uid}, losing the only admin
locks account management for everyone — no one can assign a role again,
and the only way back is editing the database by hand in the Firebase
console. All three paths that could reach that state now refuse and
explain why.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Give the manager its specific powers

**Files:**
- Modify: `index.html` — `handleRestoreSnapshot` (~line 1671), header buttons (~line 5466), employee delete guards (~line 4300 and ~line 8834)

**Interfaces:**
- Consumes: `currentUserRole`, `logAuditEvent(action, displayName)` from the auth helpers.
- Produces: `canOpenArchive` — a plain boolean expression reused in the header and the restore modal.

- [ ] **Step 1: Remove the dead duplicate guard in `handleRestoreSnapshot`**

The function currently checks the same condition twice; the second block is unreachable and left over from the PIN removal.

Find:
```js
                if (currentUserRole !== 'admin') {
                    alert('⛔ عذراً، ميزة استعادة البيانات مخصصة حصرياً لمدير النظام 👑');
                    return;
                }
                if (currentUserRole !== 'admin') {
                    alert('❌ رمز الدخول غير صحيح! تم إلغاء عملية الاستعادة للأمان.');
                    return;
                }
```
Replace with:
```js
                if (currentUserRole !== 'admin') {
                    alert('⛔ الاستعادة مخصصة حصرياً لمدير النظام 👑\n\nيمكنك استعراض اللقطات وتنزيلها كملف JSON، أما اعتماد لقطة كقاعدة حية فيبدّل بيانات الشعبة كلها ويبقى بيد المدير.');
                    return;
                }
```

- [ ] **Step 2: Open the archive button to the manager**

The header's admin-only block currently wraps both the accounts button and the archive button. Move the archive button out so a manager sees it.

Find:
```jsx
                                            <button
                                                onClick={() => {
                                                    fetchAvailableSnapshots();
                                                    setShowRestoreCenterModal(true);
                                                }}
                                                className="px-3.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-full text-xs font-black shadow transition flex items-center gap-1 cursor-pointer active:scale-95"
                                                title="مركز الاستعادة والأرشيف الزمني للنسخ الاحتياطية اليومية"
                                            >
                                                <span>🛡️</span>
                                                <span>الأرشيف والاستعادة</span>
                                            </button>
                                        </>
                                    )}
```
Replace with:
```jsx
                                        </>
                                    )}
                                    {(currentUserRole === 'admin' || currentUserRole === 'manager') && (
                                        <button
                                            onClick={() => {
                                                fetchAvailableSnapshots();
                                                setShowRestoreCenterModal(true);
                                            }}
                                            className="px-3.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-full text-xs font-black shadow transition flex items-center gap-1 cursor-pointer active:scale-95"
                                            title={currentUserRole === 'admin' ? "مركز الاستعادة والأرشيف الزمني للنسخ الاحتياطية اليومية" : "استعراض وتنزيل اللقطات اليومية (الاستعادة خاصة بمدير النظام)"}
                                        >
                                            <span>🛡️</span>
                                            <span>{currentUserRole === 'admin' ? 'الأرشيف والاستعادة' : 'الأرشيف'}</span>
                                        </button>
                                    )}
```

- [ ] **Step 3: Hide the two restore buttons from a manager**

Find (the preview modal's restore button):
```jsx
                                            onClick={() => handleRestoreSnapshot(selectedSnapshotPreview)}
```
Wrap its whole `<button>` element in `{currentUserRole === 'admin' && ( ... )}`. Do the same for the per-row restore button whose handler is:
```jsx
                                                                            onClick={() => handleRestoreSnapshot(snap)}
```
Then, so the manager understands why the buttons are absent rather than assuming a bug, add this notice directly above the snapshots table inside the restore modal:
```jsx
                                {currentUserRole !== 'admin' && (
                                    <div className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900">
                                        🛡️ يمكنك استعراض اللقطات وتنزيلها. اعتماد لقطة كقاعدة حية يبدّل بيانات الشعبة كلها ويبقى بيد مدير النظام.
                                    </div>
                                )}
```

- [ ] **Step 4: Add the standalone session-unlock button**

The only unlock control today sits inside the user-management modal, which a manager never opens. Add a header button beside the archive one, plus a small modal listing live sessions.

Find:
```js
            const [showRestoreCenterModal, setShowRestoreCenterModal] = useState(false);
```
Insert immediately after:
```js
            const [showSessionsModal, setShowSessionsModal] = useState(false);
```

Insert this button immediately after the archive button's closing `)}` from Step 2:
```jsx
                                    {(currentUserRole === 'admin' || currentUserRole === 'manager') && (
                                        <button
                                            onClick={() => setShowSessionsModal(true)}
                                            className="px-3.5 py-1 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-full text-xs font-black shadow transition flex items-center gap-1 cursor-pointer active:scale-95"
                                            title="عرض الجلسات النشطة وفك أي جلسة عالقة"
                                        >
                                            <span>🔓</span>
                                            <span>الجلسات النشطة</span>
                                        </button>
                                    )}
```

Insert this modal immediately before the line `{showRestoreCenterModal && (`:
```jsx
            {showSessionsModal && (
                <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[120] flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-700 to-blue-900 p-4 text-white flex justify-between items-center">
                            <h3 className="text-base font-black flex items-center gap-2"><span>🔓</span><span>الجلسات النشطة</span></h3>
                            <button onClick={() => setShowSessionsModal(false)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full font-bold transition">✕</button>
                        </div>
                        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                            {Object.keys(activeSessions || {}).filter(uid => {
                                const sess = activeSessions[uid];
                                return sess && sess.lastSeen && (Date.now() - sess.lastSeen < 15000);
                            }).map(uid => (
                                <div key={uid} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div>
                                        <div className="font-black text-sm text-slate-900">{activeSessions[uid].name}</div>
                                        <div className="text-[11px] text-slate-500">{activeSessions[uid].role}</div>
                                    </div>
                                    <button
                                        onClick={() => handleForceEvictSession(uid, activeSessions[uid].name)}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black transition"
                                    >
                                        🔓 فك القفل
                                    </button>
                                </div>
                            ))}
                            {Object.keys(activeSessions || {}).filter(uid => {
                                const sess = activeSessions[uid];
                                return sess && sess.lastSeen && (Date.now() - sess.lastSeen < 15000);
                            }).length === 0 && (
                                <div className="text-center text-slate-500 text-sm font-bold py-6">لا توجد جلسات نشطة حالياً.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

```

Note for the implementer: this modal reads `activeSessions`, which only polls continuously after Task 8 Step 9. Until that task lands the list fills only while the user-management modal is open — expected, and resolved there.

- [ ] **Step 5: Let the manager delete an employee, and record it**

There are two delete sites with the same guard. In the employee edit modal, find:
```js
                if (currentUserRole !== 'admin') {
                    alert('❌ الرمز السري غير صحيح! تم إلغاء عملية الحذف للحماية.');
                    return;
                }
```
Replace with:
```js
                if (currentUserRole !== 'admin' && currentUserRole !== 'manager') {
                    alert('⛔ حذف منتسب من الملاك مخصص لمدير النظام والإداري.');
                    return;
                }
                logAuditEvent('delete_employee:' + (editingEmployee.jobNumber || editingEmployee.id), currentUserName);
```

In the staff table row, find:
```jsx
                                                                                if (currentUserRole !== 'admin') {
                                                                                    alert('❌ الرمز السري غير صحيح! تم إلغاء عملية الحذف للحماية.');
                                                                                    return;
                                                                                }
```
Replace with:
```jsx
                                                                                if (currentUserRole !== 'admin' && currentUserRole !== 'manager') {
                                                                                    alert('⛔ حذف منتسب من الملاك مخصص لمدير النظام والإداري.');
                                                                                    return;
                                                                                }
                                                                                logAuditEvent('delete_employee:' + (s.jobNumber || s.id), currentUserName);
```

- [ ] **Step 6: Verify**

Run: `node scratch/check_babel_block.js index.html`
Expected: `OK`

Run: `grep -c "delete_employee:" index.html`
Expected: `2`

Run: `grep -c "handleRestoreSnapshot" index.html`
Expected: `3` (one definition, two call sites).

Run: `grep -c "showSessionsModal" index.html`
Expected: `4`.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Give the manager role its archive, delete, and restore boundaries

- The archive button leaves the admin-only header block: a manager can
  open the restore centre, preview snapshots and download them as JSON,
  but both restore buttons are hidden and a notice explains that
  adopting a snapshot replaces the whole division's data.
- Deleting an employee opens to the manager and now writes a
  delete_employee entry to the audit log from both delete sites.
- handleRestoreSnapshot had the same guard twice, the second
  unreachable and left from the PIN removal; folded into one with a
  message that says what the manager can do instead.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Make a rejected cloud save visible

**Files:**
- Modify: `index.html` — `cloudSyncStatus` state (~line 1506), `pushDataToCloud` (~line 1540), sync indicator JSX (~line 5441)

**Interfaces:**
- Consumes: `cloudFetch`, `setShowLoginModal`, `signOutFirebase`, `setCurrentUserRole`.
- Produces: `cloudSyncStatus.error` — `null` when healthy, otherwise a user-facing Arabic string.

- [ ] **Step 1: Confirm the silent-failure shape**

Run: `grep -n "const res = await cloudFetch(FIREBASE_DB_URL" -A 6 index.html`

Expected: an `if (res.ok) { ... }` with **no** `else`. That missing branch is the bug: a rejected write leaves `syncing: true` forever and says nothing.

- [ ] **Step 2: Add the error field to the state**

Find:
```js
            const [cloudSyncStatus, setCloudSyncStatus] = useState({ connected: true, syncing: false, lastSync: null });
```
Replace with:
```js
            const [cloudSyncStatus, setCloudSyncStatus] = useState({ connected: true, syncing: false, lastSync: null, error: null });
```

- [ ] **Step 3: Handle the rejection**

Find:
```js
                    if (res.ok) {
                        setCloudSyncStatus({ connected: true, syncing: false, lastSync: new Date().toLocaleTimeString('ar-IQ') });
                        logAuditEvent('save_system_bundle', currentUserName);
                    }
```
Replace with:
```js
                    if (res.ok) {
                        setCloudSyncStatus({ connected: true, syncing: false, lastSync: new Date().toLocaleTimeString('ar-IQ'), error: null });
                        logAuditEvent('save_system_bundle', currentUserName);
                    } else if (res.status === 401) {
                        // التوكن منتهٍ وتعذّر تجديده — الاستمرار يعني العمل على نسخة لا تُحفظ
                        setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: 'انتهت جلستك ولم يُحفظ آخر تعديل. يرجى تسجيل الدخول من جديد.' });
                        signOutFirebase();
                        setCurrentUserRole(null);
                        setShowLoginModal(true);
                        alert('⛔ انتهت صلاحية جلستك ولم يصل آخر حفظ إلى السحابة.\n\nسجّل الدخول من جديد ثم أعد التعديل.');
                    } else {
                        setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: `لم يصل آخر حفظ إلى السحابة (رمز ${res.status}). تعديلاتك محفوظة على هذا الجهاز فقط.` });
                    }
```

- [ ] **Step 4: Handle the network failure**

Find:
```js
                } catch (err) {
                    console.warn("Could not push to Firebase Cloud:", err);
                }
```
Replace with:
```js
                } catch (err) {
                    console.warn("Could not push to Firebase Cloud:", err);
                    setCloudSyncStatus({ connected: false, syncing: false, lastSync: null, error: 'تعذّر الوصول إلى السحابة. تعديلاتك محفوظة على هذا الجهاز فقط وستُرفع عند عودة الاتصال.' });
                }
```

- [ ] **Step 5: Show it in the header**

Find:
```jsx
                                    {(typeof cloudSyncStatus !== 'undefined' && cloudSyncStatus && cloudSyncStatus.connected) || syncStatus.connected ? (
```
Insert immediately **before** that line:
```jsx
                                    {cloudSyncStatus && cloudSyncStatus.error && (
                                        <span
                                            className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-600 text-white border border-red-300 shadow animate-pulse cursor-help"
                                            title={cloudSyncStatus.error}
                                        >
                                            ⚠️ الحفظ السحابي متوقف
                                        </span>
                                    )}
```

- [ ] **Step 6: Verify**

Run: `node scratch/check_babel_block.js index.html`
Expected: `OK`

Run: `grep -c "cloudSyncStatus.error\|error: null\|error: '" index.html`
Expected: at least `5`.

- [ ] **Step 7: Manual check**

Open `index.html` and log in. Open DevTools → Network → set throttling to **Offline**. Make any edit that triggers a save. Confirm the red ⚠️ الحفظ السحابي متوقف badge appears in the header and hovering it shows the reason. Set throttling back to **No throttling**, edit again, and confirm the badge clears.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "Surface a rejected or failed cloud save instead of swallowing it

pushDataToCloud handled only the success branch. A rejected write left
the indicator stuck on \"syncing\" with no message, so the user kept
working and believed it saved — silent data loss. Hardening the rules
made that path more likely, not less: an expired token, a missing roles
entry, or a viewer account all return 401/403.

A failed save now clears syncing, records a human-readable reason, and
raises a red badge in the header. A 401 is treated as an expired
session and sends the user back to the login screen rather than letting
them keep editing a copy that cannot be saved.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Refuse to overwrite a colleague's newer save

**Files:**
- Modify: `index.html` — `pushDataToCloud` (~line 1540), `applyDataBundleToState` (~line 1820)

**Interfaces:**
- Consumes: `FIREBASE_DB_URL`, `lastCloudTimeRef`.
- Produces: `knownServerUpdateRef` — a `React.useRef` holding the `lastCloudUpdate` value this device last saw from the server.

- [ ] **Step 1: Confirm the refs in play**

Run: `grep -n "lastCloudTimeRef\|isInitialCloudLoadCompleteRef" index.html | head`
Expected: both refs already exist and are assigned during fetch and push.

- [ ] **Step 2: Add the ref next to the existing ones**

Find:
```js
            const [cloudSyncStatus, setCloudSyncStatus] = useState({ connected: true, syncing: false, lastSync: null, error: null });
```
Insert immediately after:
```js
            // آخر lastCloudUpdate رآه هذا الجهاز من الخادم — يُقارَن قبل كل حفظ لمنع محو عمل زميل
            const knownServerUpdateRef = React.useRef(null);
```

- [ ] **Step 3: Record the server's value whenever a bundle is applied**

Find:
```js
                if (bundle.pendingDeletionRequest !== undefined) {
```
Insert immediately **before** it:
```js
                if (bundle.lastCloudUpdate) {
                    knownServerUpdateRef.current = bundle.lastCloudUpdate;
                }
```

- [ ] **Step 4: Check before writing**

Find:
```js
                    // بث سريع مباشر عبر fetch بدون keepalive (لتفادي حظر المتصفح للحزم الأكبر من 64KB)
                    const res = await cloudFetch(FIREBASE_DB_URL, {
```
Insert immediately **before** that comment:
```js
                    // قراءة صغيرة تسبق الحفظ: هل كتب زميل شيئاً بعد آخر ما رآه هذا الجهاز؟
                    try {
                        const stampRes = await fetch(FIREBASE_DB_URL.replace('.json', '/lastCloudUpdate.json') + '?t=' + Date.now());
                        if (stampRes.ok) {
                            const serverStamp = await stampRes.json();
                            if (serverStamp && knownServerUpdateRef.current && serverStamp > knownServerUpdateRef.current) {
                                setCloudSyncStatus({ connected: true, syncing: false, lastSync: null, error: 'حفظ مستخدم آخر تعديلات بعد آخر تحديث لديك. أعد تحميل الصفحة قبل الحفظ.' });
                                alert('⚠️ حفظ مستخدم آخر تعديلات بعد آخر تحديث وصل إلى جهازك.\n\nلو حفظت الآن ستمحو عمله.\n\nأعد تحميل الصفحة (Ctrl+F5) ثم أعد إدخال تعديلك.');
                                return;
                            }
                        }
                    } catch (e) {
                        // فشل الفحص لا يمنع الحفظ: تعذّر التحقق ليس دليلاً على وجود تعارض
                    }

```

- [ ] **Step 5: Keep our own write from tripping the check**

Find:
```js
                        setCloudSyncStatus({ connected: true, syncing: false, lastSync: new Date().toLocaleTimeString('ar-IQ'), error: null });
                        logAuditEvent('save_system_bundle', currentUserName);
```
Replace with:
```js
                        knownServerUpdateRef.current = nowIso;
                        setCloudSyncStatus({ connected: true, syncing: false, lastSync: new Date().toLocaleTimeString('ar-IQ'), error: null });
                        logAuditEvent('save_system_bundle', currentUserName);
```

- [ ] **Step 6: Verify**

Run: `node scratch/check_babel_block.js index.html`
Expected: `OK`

Run: `grep -c "knownServerUpdateRef" index.html`
Expected: `4`.

- [ ] **Step 7: Manual check**

Open `index.html` in two browser profiles and log in as two different accounts. In profile A, make an edit and let it save. In profile B — **without reloading** — make an edit. Profile B must refuse with the ⚠️ message naming the conflict, and must not overwrite A's work. Reload B and confirm the save then succeeds.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "Refuse a save that would overwrite a colleague's newer work

system_bundle is written whole on every save, so two people saving at
once silently discards one of them. Before writing, the client now
fetches just system_bundle/lastCloudUpdate and refuses if the server has
moved past the value this device last saw, telling the user to reload
first.

The check is deliberately not a Firebase rule: lastCloudUpdate is
client-generated, so a device with a slow clock would be locked out of
saving permanently with no way back. A UI guard is bypassable in theory
but stops the only case that happens in practice — a colleague's
unnoticed edit. A failed check does not block the save, since being
unable to verify is not evidence of a conflict.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Make audit entries provable

**Files:**
- Modify: `index.html` — `logAuditEvent` (~line 1090)

**Interfaces:**
- Consumes: `cloudFetch`, `getStoredAuth`.
- Produces: audit entries shaped exactly `{uid, displayName, action, timestamp}` with `timestamp` a number, matching the `.validate` rule published in Task 10.

- [ ] **Step 1: Confirm the current payload**

Run: `grep -n "const logAuditEvent" -A 20 index.html`
Expected: a body sending `timestamp: new Date().toISOString()` — a string. The rule in Task 10 requires a number compared against the server's `now`, so this must change or every audit write will be rejected.

- [ ] **Step 2: Send a numeric timestamp and cap the action length**

Find:
```js
                        body: JSON.stringify({
                            uid: session.uid,
                            displayName: displayName || '',
                            action,
                            timestamp: new Date().toISOString()
                        })
```
Replace with:
```js
                        body: JSON.stringify({
                            uid: session.uid,
                            displayName: displayName || '',
                            // الحقول الأربعة وأنواعها مقيّدة بشرط .validate على الخادم:
                            // uid يجب أن يساوي auth.uid، والطابع الزمني رقم قريب من وقت الخادم
                            action: String(action).slice(0, 200),
                            timestamp: Date.now()
                        })
```

- [ ] **Step 3: Format the timestamp wherever entries are displayed**

Run: `grep -n "audit_log\|auditEntries" index.html`

If a rendering site exists, format with `new Date(entry.timestamp).toLocaleString('ar-IQ')`. If the grep shows only `FIREBASE_AUDIT_LOG_URL` and `logAuditEvent`, there is no reader UI yet — record that and move on; the log is read from the Firebase console for now.

- [ ] **Step 4: Verify**

Run: `node scratch/check_babel_block.js index.html`
Expected: `OK`

Run: `grep -c "timestamp: Date.now()" index.html`
Expected: `1`

Run: `grep -c "toISOString()" index.html`
Expected: the count must not include the audit payload. Confirm by eye that remaining hits belong to `lastCloudUpdate` and snapshot dates only.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Shape audit entries to match the server-side validate rule

An audit entry was immutable but not trustworthy: every field came from
the client, so any permitted writer could attribute an action to someone
else or backdate it. Task 10 publishes a .validate that binds uid to
auth.uid and requires timestamp to be a number close to the server's
now, so the payload switches from an ISO string to Date.now() and caps
action at 200 characters. Without this change every audit write would be
rejected once the rule is live.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Authenticate the session and role reads

**Files:**
- Modify: `index.html` — login session check (~line 1155), heartbeat read (~line 1229), sessions poll (~line 1275)

**Interfaces:**
- Consumes: `cloudFetch`.
- Produces: no new interface — closes the reads that break once `active_sessions` and `roles` stop being publicly readable in Task 10.

- [ ] **Step 1: Find every plain-`fetch` read of the two nodes**

Run: `grep -n "fetch(\`\${FIREBASE_SESSIONS_URL}" index.html`

Expected: three plain-`fetch` reads — the pre-login session check, the heartbeat's `checkRes`, and the modal's session poll. Each becomes a `401` the moment Task 10's rules are live, so each must carry a token.

- [ ] **Step 2: Switch all three to `cloudFetch`**

Find and change each of the following, leaving arguments untouched:
```js
                    const sessRes = await fetch(`${FIREBASE_SESSIONS_URL}/${targetUser.id}.json?t=${Date.now()}`);
```
to
```js
                    const sessRes = await cloudFetch(`${FIREBASE_SESSIONS_URL}/${targetUser.id}.json?t=${Date.now()}`);
```

```js
                        const checkRes = await fetch(`${FIREBASE_SESSIONS_URL}/${uid}.json?t=${Date.now()}`);
```
to
```js
                        const checkRes = await cloudFetch(`${FIREBASE_SESSIONS_URL}/${uid}.json?t=${Date.now()}`);
```

```js
                        const res = await fetch(`${FIREBASE_SESSIONS_URL}.json?t=${Date.now()}`);
```
to
```js
                        const res = await cloudFetch(`${FIREBASE_SESSIONS_URL}.json?t=${Date.now()}`);
```

- [ ] **Step 3: Verify none are left**

Run: `grep -n "[^d]fetch(\`\${FIREBASE_SESSIONS_URL}" index.html`
Expected: no output.

Run: `node scratch/check_babel_block.js index.html`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Send the ID token with every active_sessions read

Task 10 stops active_sessions being publicly readable, because it
carried employee names and roles for any passer-by to enumerate. The
three reads that consume it — the login session check, the heartbeat,
and the user-management poll — now go through cloudFetch so they keep
working once the rule is live.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Peer edit lock

**Files:**
- Modify: `index.html` — user form state (~line 953), `handleSaveUser`, session record writes (login + heartbeat), `canEdit` (~line 966), user-management form JSX, daily report header JSX

**Interfaces:**
- Consumes: `activeSessions` (already polled into state), `currentUserPermissions`, `currentUserRole`, `currentUserIdRef`.
- Produces:
  - `userFormPriority` / `setUserFormPriority` — string state for the form input.
  - `editPriority` — a number stored on each system user and in `roles/{uid}`.
  - `lockedSections` — `{[section: string]: string}` mapping a section key to the name of the peer holding it.

- [ ] **Step 1: Confirm the session record shape**

Run: `grep -n "sessionId: newSessionId" -A 6 index.html`
Expected: a body writing `{sessionId, userId, name, role, lastSeen}`. Peers cannot be arbitrated without also knowing their permissions and priority, so two fields are added.

- [ ] **Step 2: Add the priority form state**

Find:
```js
            const [userFormUid, setUserFormUid] = useState('');
```
Insert immediately after:
```js
            const [userFormPriority, setUserFormPriority] = useState('1');
```

- [ ] **Step 3: Store the priority when saving a user**

Find:
```js
                    updatedUsers = systemUsers.map(u => u.id === editingUserId ? { ...u, name, role: userFormRole, uid: targetUid, permissions: permsToSave } : u);
```
Replace with:
```js
                    updatedUsers = systemUsers.map(u => u.id === editingUserId ? { ...u, name, role: userFormRole, uid: targetUid, editPriority: priorityToSave, permissions: permsToSave } : u);
```

Find:
```js
                        role: userFormRole,
                        uid: targetUid,
                        permissions: permsToSave,
```
Replace with:
```js
                        role: userFormRole,
                        uid: targetUid,
                        editPriority: priorityToSave,
                        permissions: permsToSave,
```

Find:
```js
                let updatedUsers;
```
Insert immediately **before** it:
```js
                const parsedPriority = parseInt(userFormPriority, 10);
                const priorityToSave = (isNaN(parsedPriority) || parsedPriority < 1) ? 99 : parsedPriority;

```

Find:
```js
                    body: JSON.stringify({ name, role: userFormRole, permissions: permsToSave })
```
Replace with:
```js
                    body: JSON.stringify({ name, role: userFormRole, editPriority: priorityToSave, permissions: permsToSave })
```

- [ ] **Step 4: Load and reset the field with the rest of the form**

Find:
```js
                setUserFormUid(u.uid || '');
```
Insert immediately after:
```js
                setUserFormPriority(String(u.editPriority || 1));
```

Find:
```js
                setUserFormUid('');
```
Insert immediately after:
```js
                setUserFormPriority('1');
```

- [ ] **Step 5: Add the input to the form**

Find this exact block — it is the tail of the UID field including its wrapper:
```jsx
                                            placeholder="UID من Firebase"
                                            className="w-full bg-white border border-amber-400 focus:border-indigo-600 rounded-xl px-3 py-2 text-[11px] font-mono font-bold text-indigo-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                                        />
                                    </div>
```
Insert immediately after it:
```jsx
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="block text-[11px] font-black text-slate-700">🥇 أولوية التحرير:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={userFormPriority}
                                            onChange={(e) => setUserFormPriority(e.target.value)}
                                            title="عند دخول موظفَين بنفس الصلاحية معاً، يحتفظ صاحب الرقم الأصغر بالتعديل ويهبط الآخر للاطلاع"
                                            className="w-full bg-white border border-slate-300 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs font-mono font-black text-indigo-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                                        />
                                    </div>
```

- [ ] **Step 6: Broadcast permissions and priority in the session record**

Find (in `handleLogin`):
```js
                            name: targetUser.name,
                            role: targetUser.role,
                            lastSeen: Date.now()
```
Replace with:
```js
                            name: targetUser.name,
                            role: targetUser.role,
                            permissions: targetUser.permissions || {},
                            editPriority: roleData.editPriority || 99,
                            lastSeen: Date.now()
```

Find (in the heartbeat effect):
```js
                                name: currentUserName,
                                role: currentUserRole,
                                lastSeen: Date.now()
```
Replace with:
```js
                                name: currentUserName,
                                role: currentUserRole,
                                permissions: currentUserPermissions || {},
                                editPriority: currentUserPriorityRef.current,
                                lastSeen: Date.now()
```

Find:
```js
            const currentUserIdRef = React.useRef(null);
```
Insert immediately after:
```js
            const currentUserPriorityRef = React.useRef(99);
```

Find (in `handleLogin`, next to the other `Ref.current` assignments):
```js
                currentUserIdRef.current = targetUser.id;
```
Insert immediately after:
```js
                currentUserPriorityRef.current = roleData.editPriority || 99;
```

- [ ] **Step 7: Compute which sections a higher-priority peer holds**

Find:
```js
            const canEdit = (section) => {
```
Insert immediately **before** it:
```js
            // قفل التحرير بين الأقران: من يحمل نفس الصلاحية وأولوية أصغر يحتفظ بالتعديل
            // المشرفون (admin/manager) خارج المزاحمة — لا يُخفَّضون ولا يُخفِّضون غيرهم،
            // وإلا لأقفل تبويبٌ مفتوح على مكتب المدير طوال اليوم عمل المُدخلين بلا سبب.
            const lockedSections = React.useMemo(() => {
                const locked = {};
                if (currentUserRole !== 'operator') return locked;
                const myUid = currentUserIdRef.current;
                const myPriority = currentUserPriorityRef.current;
                Object.keys(activeSessions || {}).forEach(uid => {
                    const sess = activeSessions[uid];
                    if (!sess || uid === myUid) return;
                    if (sess.role !== 'operator') return;
                    if (!sess.lastSeen || (Date.now() - sess.lastSeen) >= 15000) return;
                    const theirPriority = sess.editPriority || 99;
                    if (theirPriority >= myPriority) return;
                    Object.keys(sess.permissions || {}).forEach(section => {
                        if (sess.permissions[section] && currentUserPermissions && currentUserPermissions[section]) {
                            locked[section] = sess.name || 'زميل';
                        }
                    });
                });
                return locked;
            }, [activeSessions, currentUserRole, currentUserPermissions]);

```

- [ ] **Step 8: Honour the lock in `canEdit`**

Find:
```js
                if (currentUserRole !== 'operator') return false;
```
Replace with:
```js
                if (currentUserRole !== 'operator') return false;
                if (lockedSections[section]) return false;
```

- [ ] **Step 9: Poll sessions continuously, not only when the modal is open**

The peer lock needs `activeSessions` fresh at all times. Find:
```js
            React.useEffect(() => {
                if (!showUserManagementModal) return;
```
Replace with:
```js
            React.useEffect(() => {
                if (!currentUserRole || currentUserRole === 'viewer') return;
```

Then change that same effect's dependency array. Without this the effect never re-runs on login and the poll never starts. Find:
```js
            }, [showUserManagementModal]);
```
Replace with:
```js
            }, [currentUserRole]);
```

- [ ] **Step 10: Tell the demoted user why**

Insert this banner directly inside the daily-report view, above its content:
```jsx
                            {lockedSections['dailyReport'] && (
                                <div className="mb-3 p-3 bg-amber-50 border-2 border-amber-400 rounded-xl text-xs font-black text-amber-900 flex items-center gap-2 no-print">
                                    <span className="text-lg">🔒</span>
                                    <span>{lockedSections['dailyReport']} يعدّل الموقف اليومي الآن — أنت في وضع الاطلاع. تعود صلاحيتك تلقائياً خلال 15 ثانية من خروجه. الطباعة والتصدير متاحان كالمعتاد.</span>
                                </div>
                            )}
```

- [ ] **Step 11: Verify**

Run: `node scratch/check_babel_block.js index.html`
Expected: `OK`

Run: `grep -c "lockedSections" index.html`
Expected: at least `4`.

Run: `grep -c "editPriority" index.html`
Expected: at least `7`.

- [ ] **Step 12: Manual check**

Log in as the admin and set قاسم to أولوية التحرير `1` and حيدر to `2`, both with الموقف اليومي enabled. Then log in as قاسم in one browser profile and حيدر in another. Within about 5 seconds حيدر must show the 🔒 banner naming قاسم, and the daily report's edit controls must be disabled while print and export still work. Close قاسم's tab; within 15 seconds حيدر's banner disappears and editing returns. Finally log in as the admin alongside حيدر and confirm neither is demoted.

- [ ] **Step 13: Commit**

```bash
git add index.html
git commit -m "Add a peer edit lock so equals cannot overwrite each other

Two operators holding the same section permission could both edit the
same day and silently lose one of them. Each account now carries a
numeric editPriority, edited from the user-management modal so
reordering never needs a code change; the session record broadcasts a
user's permissions and priority; and canEdit returns false for exactly
the sections a live higher-priority peer holds, with a banner naming
them. The demotion lifts on its own within 15 seconds of that peer's
session going stale.

Admin and manager sit outside the contest — neither demoted nor
demoting — because a supervisor leaving a tab open all day would
otherwise lock the clerks out of their work. Task 5's lastCloudUpdate
check remains the safety net for that case.

The session poll moves out of the user-management modal, since the lock
needs fresh peer state whenever someone is logged in.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: Mirror to the cloud file and rewrite the permissions guide

**Files:**
- Modify: `نظام_ادارة_الملاك_v8.5_cloud.html` (by copy)
- Rewrite: `نظام_ادارة_الملاك_دليل_الصلاحيات_وحسابات_المستخدمين.md`
- Modify: `نظام_ادارة_الملاك_الدليل_الشامل_للقواعد.md` — section 9

- [ ] **Step 1: Mirror**

```bash
cp index.html "نظام_ادارة_الملاك_v8.5_cloud.html"
diff -q index.html "نظام_ادارة_الملاك_v8.5_cloud.html" && echo "identical"
```
Expected: `identical`

- [ ] **Step 2: Confirm the offline file is untouched**

```bash
git status --short "نظام_ادارة_الملاك_v8.5_offline.html"
grep -c "firebaseio\|identitytoolkit\|AIza" "نظام_ادارة_الملاك_v8.5_offline.html"
```
Expected: no status line, and `0`.

- [ ] **Step 3: Compile-check all three**

```bash
for f in "index.html" "نظام_ادارة_الملاك_v8.5_cloud.html" "نظام_ادارة_الملاك_v8.5_offline.html"; do node scratch/check_babel_block.js "$f"; done
```
Expected: three `OK` lines.

- [ ] **Step 4: Rewrite the permissions guide**

`نظام_ادارة_الملاك_دليل_الصلاحيات_وحسابات_المستخدمين.md` currently documents a system that no longer exists: a PIN column per user, the master code `1975`, a "reveal all passwords" button, and role escalation by entering the admin PIN. All were removed on 2026-09-01. Replace its contents with:

1. **الحسابات** — a table of `اسم المستخدم | البريد | الدور | أولوية التحرير | UID`, stating that accounts are created in the Firebase console and only linked here.
2. **مصفوفة الصلاحيات** — copy section 4 of the design spec verbatim.
3. **الأدوار الأربعة** — copy section 3 of the design spec verbatim.
4. **الأمان** — Firebase Authentication with email and password, no shared codes anywhere, roles held server-side in `roles/{uid}`, an append-only audit log, and the single-session lock (5-second heartbeat, 15-second release).
5. **قفل التحرير بين الأقران** — copy section 7.4 of the design spec verbatim.
6. **دليل المدير** — creating an account in the Firebase console, copying the UID, linking it in the system, assigning a role, permissions and priority; and the note that the last active admin cannot be deleted, deactivated or demoted.

Remove every mention of `PIN`, `1975`, and revealing passwords.

- [ ] **Step 5: Update section 9 of the rules guide**

In `نظام_ادارة_الملاك_الدليل_الشامل_للقواعد.md`, section 9.1 lists three roles and states the master code is `1975`. Replace that list with the four roles from the design spec's section 3, and replace the master-code sentence with: `لا يوجد رمز مرور مشترك في النظام. الدخول بحساب Firebase موثّق، والدور يُقرأ من عقدة roles/{uid} على الخادم ولا يمكن تعديله من المتصفح.`

- [ ] **Step 6: Verify no stale secrets remain in the docs**

```bash
grep -rn "1975" *.md | grep -v "usama.kh1975"
```
Expected: no output (the only surviving match would be part of the admin's email address).

- [ ] **Step 7: Commit**

```bash
git add "نظام_ادارة_الملاك_v8.5_cloud.html" "نظام_ادارة_الملاك_دليل_الصلاحيات_وحسابات_المستخدمين.md" "نظام_ادارة_الملاك_الدليل_الشامل_للقواعد.md"
git commit -m "Mirror RBAC v2 into the cloud edition and rewrite the permissions guide

The permissions guide still documented the PIN system: a password column
per user, the master code 1975, and a reveal-all-passwords button, none
of which have existed since 2026-09-01. Rewritten around the four roles,
Firebase accounts, server-side roles, the append-only audit log and the
peer edit lock. Section 9 of the rules guide gets the same treatment.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 10: Publish the rules and verify end to end

**Files:**
- Modify: none — this task publishes Firebase Security Rules from the console and verifies the whole plan.

**This task needs the user.** Publishing rules is done by hand in the Firebase console, and the manual checks need real accounts.

- [ ] **Step 1: Capture the current behaviour before changing anything**

```bash
DB="https://hr-cooling-default-rtdb.firebaseio.com"
curl -s -o /dev/null -w "roles read: %{http_code}\n" "$DB/roles.json"
curl -s -o /dev/null -w "active_sessions read: %{http_code}\n" "$DB/active_sessions.json"
```
Expected before: `roles read: 401`, `active_sessions read: 200`. The second is the leak this task closes.

- [ ] **Step 2: Publish the rules**

Give the user this exact JSON to paste whole into
`https://console.firebase.google.com/u/0/project/hr-cooling/database/hr-cooling-default-rtdb/rules`
and press **Publish** (not Save draft):

```json
{
  "rules": {
    "system_bundle": {
      ".read": true,
      ".write": "auth != null && root.child('roles').child(auth.uid).exists() && root.child('roles').child(auth.uid).child('role').val() !== 'viewer'"
    },
    "active_sessions": {
      ".read": "auth != null && root.child('roles').child(auth.uid).exists()",
      "$uid": {
        ".write": "auth != null && root.child('roles').child(auth.uid).exists() && (auth.uid === $uid || root.child('roles').child(auth.uid).child('role').val() === 'admin' || root.child('roles').child(auth.uid).child('role').val() === 'manager')"
      }
    },
    "backups_history": {
      ".read": "auth != null && (root.child('roles').child(auth.uid).child('role').val() === 'admin' || root.child('roles').child(auth.uid).child('role').val() === 'manager')",
      ".write": "auth != null && root.child('roles').child(auth.uid).exists() && root.child('roles').child(auth.uid).child('role').val() !== 'viewer'"
    },
    "roles": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('roles').child(auth.uid).child('role').val() === 'admin')",
        ".write": "auth != null && root.child('roles').child(auth.uid).child('role').val() === 'admin'"
      }
    },
    "audit_log": {
      ".read": "auth != null && root.child('roles').child(auth.uid).child('role').val() === 'admin'",
      ".indexOn": "timestamp",
      "$entryId": {
        ".write": "!data.exists() && newData.exists() && auth != null && root.child('roles').child(auth.uid).exists() && root.child('roles').child(auth.uid).child('role').val() !== 'viewer'",
        ".validate": "newData.hasOnly(['uid','displayName','action','timestamp']) && newData.child('uid').val() === auth.uid && newData.child('timestamp').isNumber() && newData.child('timestamp').val() <= now + 60000 && newData.child('timestamp').val() >= now - 300000 && newData.child('action').isString() && newData.child('action').val().length <= 200"
      }
    }
  }
}
```

- [ ] **Step 3: Verify the unauthenticated surface**

```bash
DB="https://hr-cooling-default-rtdb.firebaseio.com"
curl -s -X PUT -d '{"x":1}' "$DB/system_bundle/__probe.json"
curl -s -o /dev/null -w "system_bundle read: %{http_code}\n" "$DB/system_bundle.json"
curl -s -o /dev/null -w "active_sessions read: %{http_code}\n" "$DB/active_sessions.json"
curl -s -o /dev/null -w "roles read: %{http_code}\n" "$DB/roles.json"
curl -s -o /dev/null -w "audit_log read: %{http_code}\n" "$DB/audit_log.json"
```
Expected: `Permission denied` for the write; `200` for `system_bundle`; `401` for the other three. `active_sessions` moving from `200` to `401` is the leak closing.

- [ ] **Step 4: Verify the audit log is append-only and bound to the caller**

Ask the user to log in as the admin, copy an `idToken` from a DevTools Network request, then run with `T` set to that token:

```bash
DB="https://hr-cooling-default-rtdb.firebaseio.com"
ENTRY=$(curl -s "$DB/audit_log.json?auth=$T" | python -c "import sys,json;print(list(json.load(sys.stdin).keys())[0])")
curl -s -X PUT -d '{"uid":"x","displayName":"x","action":"tampered","timestamp":1}' "$DB/audit_log/$ENTRY.json?auth=$T"
curl -s -X DELETE "$DB/audit_log/$ENTRY.json?auth=$T"
curl -s -X POST -d '{"uid":"NOT_MY_UID","displayName":"forged","action":"test","timestamp":'$(date +%s000)'}' "$DB/audit_log.json?auth=$T"
```
Expected: all three return an `error` — the first two prove even an admin cannot edit or delete an entry, the third proves a caller cannot write an entry under another user's uid.

- [ ] **Step 5: Verify each role in the browser**

Log in as each account in turn and confirm:

| Role | Must see | Must not see |
| :--- | :--- | :--- |
| `admin` | إدارة الحسابات، الأرشيف والاستعادة مع زرّي الاستعادة، F12 يعمل | — |
| `manager` | الأرشيف بلا زرّي استعادة مع الشريط التوضيحي، تعديل كل التبويبات، حذف موظف | إدارة الحسابات، F12 محجوب |
| `operator` | التبويبات الممنوحة له فقط | الأرشيف، إدارة الحسابات، حذف موظف، F12 |
| `viewer` | اطلاع وطباعة وتصدير في كل التبويبات | أي زر تعديل أو حفظ |

For `manager`, also confirm that pressing حذف قاعدة البيانات submits a request rather than wiping, and that the admin sees the approval banner.

- [ ] **Step 6: Verify the peer lock and the reliability guards**

Run the manual checks from Task 8 Step 12, Task 5 Step 7, and Task 4 Step 7 against the final tree.

- [ ] **Step 7: Report and hand the push decision to the user**

Do **not** push. Report what was verified and what remains, and ask whether to push `main` to `origin` now. Note that pushing deploys to GitHub Pages, and that the rules are already live, so the deployed copy is running against the new rules until the push lands.

- [ ] **Step 8: Commit**

```bash
git add docs
git commit -m "Mark RBAC v2 plan complete and record the live verification

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Ordering note

Tasks 6 and 7 must both land **before** Task 10 publishes the rules: the
`.validate` on `audit_log` rejects the current ISO-string timestamp, and
the tightened `active_sessions` read breaks the three plain-`fetch`
calls. Publishing the rules first would leave the deployed system unable
to log audit events or check the session lock.
