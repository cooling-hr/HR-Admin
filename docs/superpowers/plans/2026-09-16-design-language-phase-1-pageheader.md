# لغة التصميم — المرحلة 1: ترويسة الصفحات PageHeader — خطة التنفيذ

> **للمنفِّذ الآلي:** مهارة فرعية إلزامية: استخدم `superpowers:subagent-driven-development` (موصى بها) أو `superpowers:executing-plans` لتنفيذ هذه الخطة مهمة مهمة. الخطوات تُتابَع عبر صناديق اختيار (`- [ ]`).

**الهدف:** استبدال بانرات الشاشات التسع المتدرّجة اللون بمكوّن `PageHeader` موحّد ومحايد، دون أي تغيير في المنطق التجاري أو البيانات أو نصوص الواجهة (إلا انتقال العدّاد من داخل البانر إلى شارة `meta` بجانب العنوان، كما نصّت المواصفة).

**المعمارية:** الملف بأكمله (`index.html`، ~14790 سطراً) مكوّن جذر واحد `StaffSystem()` (سطر 1029)، والشاشات التسع فروع JSX شرطية داخل نفس دالة الإرجاع — لا مكوّنات منفصلة. أربع من التسع (الملاك، التقييم، الماء، تجهيزات السلامة) يرسمها **عنصر JSX واحد حرفياً** (سطور 11573-11608) يتفرّع داخلياً بشرط `view === 'x'`، فتُنفَّذ هذه الأربع كمهمة واحدة لا أربع. مكوّن `PageHeader` جديد كلياً (لا يوجد اليوم)، يُعرَّف مرة واحدة في المهمة 1 ثم يُستهلَك في المهام 2-7 دون تعديل واجهته.

**التقنية:** React 18 + Babel داخل المتصفح، Tailwind Play CDN (قيم حرّة `bg-[var(--x)]`)، بلا خطوة بناء. اختبارات Playwright في `scratch/*.js` (Node، بلا إطار اختبار — كل ملف سكربت مستقل يطبع PASS/FAIL ويخرج برمز 0/1).

**المواصفة:** `docs/superpowers/specs/2026-09-15-unified-design-language-design.md` — تحديداً §5 (الرموز)، §6.1 (`PageHeader`)، §7 (التوزيع)، §9 صفّ «1 — ترويسات الصفحات»، §10 (الوضع الليلي أثناء الانتقال).

## قيود عامة (من المواصفة، تنطبق ضمنياً على كل مهمة أدناه)

- **لا تدرّج جديد، لا لون صريح جديد إلا عبر متغيّر CSS** (`--surface`, `--surface-muted`, `--border`, `--border-strong`, `--ink`, `--ink-2`, `--action`, `--action-hover`, `--action-ink`) — كلها معرَّفة فعلاً في طبقتي النهاري (سطور ~460-480) والليلي (~525-540) من المرحلة 0، **لا تحتاج تعريفاً جديداً**، فقط استهلاكاً عبر `bg-[var(--x)]` / `text-[color:var(--x)]` / `border-[color:var(--x)]`.
- **الأزرار تبقى أزراراً خاماً بأصنافها الحالية، لا مكوّن `Button`** — تبنّي `Button`/`StatusBadge` لهذه الشاشات مهمة المرحلة 4 صراحةً (المواصفة §9)، لا تُستبَق هنا.
- **استثناء واحد إلزامي، سببه فيزيائي لا تجميلي:** كل زر كان يعتمد على خلفية بانر ملوّنة ليتباين (`bg-white ...`، أو `bg-white/opacity-N ...`، أو حدّ `border-white`) سينكسر بصرياً فوق ترويسة محايدة (زر أبيض فوق سطح أبيض في النهاري = غير مرئي). قاعدة ثابتة لكل مهمة: أي صنف لون كان **يفترض خلفية متدرّجة** (`bg-white`, `bg-white/opacity-*`, `border-white*`, `hover:bg-{color}-50` المصمّم كتباين فوق تدرّج) يُستبدَل بمكافئه المحايد من الرموز (`bg-[var(--action)] hover:bg-[var(--action-hover)] text-white` للزر الرئيسي، `bg-[var(--surface-muted)] hover:bg-[var(--border)] text-[color:var(--ink)] border border-[color:var(--border-strong)]` للزر الثانوي/الرجوع). أي لون **صلب أصلاً** لا يعتمد على الخلفية (`bg-blue-500`, `bg-amber-500`, `bg-emerald-500`) **يبقى بلا أي تغيير**. هذا الاستثناء الوحيد المسموح على قاعدة «الأزرار تنتقل كما هي» — التوسيع الفعلي: نص الزر، حجمه، شكله، أيقونته/إيموجيه، ومعالج `onClick` كلها بلا أي تغيير في كل مهمة.
- **توضيح على الاستثناء أعلاه (أُضيف بعد مراجعة المهمة 2):** `shadow-sm` في مكافئ الزر الرئيسي **جزء من الاستثناء نفسه لا تغيير إضافي منفصل** — هو حرفياً نفس مقطع الظل في `BUTTON_VARIANTS.primary` الموجود فعلاً في `index.html:1002` (`bg-[var(--action)] hover:bg-[var(--action-hover)] text-white shadow-sm`)، ومطابق لقاعدة المواصفة العامة §5.3 («`shadow-sm` للمرفوع: الحبّة النشطة، الزر الأساسي»). أي زر أصله `shadow-md`/`shadow-lg`/بلا ظل أصلاً وصار `shadow-sm` بعد الاستبدال **ليس عطلاً** — إعادة استخدام قيمة معتمدة سلفاً في نظام التصميم، لا اختراع قيمة جديدة. لا حاجة لمراجع أن يُبلغ هذا كملاحظة مكرّرة.
- **الملفات الثلاثة الحية في كل مهمة تنفيذ:** `index.html` (المصدر)، ثم `نظام_ادارة_الملاك_v9.5_cloud.html` (نسخ حرفي `cp`)، ثم **الأوفلاين منفصل** — التعديل يُرحَّل يدوياً بالبحث عن نفس النص المميِّز (لا رقم السطر، يختلف بين الملفين) وتطبيق نفس التحويل، مع التحقق النهائي أن `grep -c "firebaseio\|identitytoolkit\|AIza" "نظام_ادارة_الملاك_v9.5_offline.html"` يبقى **0**.
- **بعد كل مهمة:** `node scratch/check_babel_block.js <file>` و`node scratch/smoke_render.js <file>` على الملفين (index.html كافٍ لتمثيل السحابية لأنها نسخة حرفية)، ثم `python publish_desktop_copies.py`.
- **الالتزام مستقل لكل مهمة** (لا التزام ضخم واحد)، برسالة تصف الشاشة المنقولة تحديداً.

---

### Task 1 — المهمة 1: مكوّن `PageHeader` وأيقونتان جديدتان

**الملفات:**
- تعديل: `index.html:955-956` (إضافة مفتاحين إلى `ICON_PATHS`)
- تعديل: `index.html:1027-1029` (إدراج `PageHeader` بين `StatusBadge` و`function StaffSystem()`)
- تعديل: `نظام_ادارة_الملاك_v9.5_cloud.html` (نسخ حرفي بعد `index.html`)
- تعديل: `نظام_ادارة_الملاك_v9.5_offline.html` (نفس الإضافتين، ابحث عن `'footprints':` و`const StatusBadge` لتحديد الموضعين المطابقين)
- لا ملف اختبار جديد — لا مستهلِك بعد لهذا المكوّن (يطابق سابقة مهمة 1 في المرحلة 0: رموز بلا أثر مرئي).

**الواجهات:**
- ينتج: `PageHeader({ icon, title, description, meta, actions })` — مكوّن React. `icon`: اسم نصّي من `ICON_PATHS` (الحالة الشائعة، يُعرَض عبر `<Icon name={icon}>`) **أو** عقدة React جاهزة (لهوية ديناميكية ليست بعد في `ICON_PATHS`، كأيقونة/إيموجي الوحدة في المهمة 5). `title`: نص. `description`: نص اختياري، يظهر تحت العنوان. `meta`: عقدة React اختيارية جاهزة التنسيق (الطالب يغلّفها بنفسه بشارة محايدة إن أراد شكل الشارة — `PageHeader` لا يفرض تغليفاً موحّداً لأن بعض الاستدعاءات تحتاج أكثر من عنصر meta واحد بتنسيقين مختلفين، كما في المهمة 5). `actions`: عقدة React اختيارية (زر واحد أو أكثر)، تُعرَض في الجهة المقابلة للعنوان.
- ينتج أيضاً: `ICON_PATHS['clipboard-list']`, `ICON_PATHS['chart-column']` (**ملاحظة تسمية:** مسار Lucide المطلوب في المواصفة اسمه `bar-chart-3` — هذا الاسم **حُذف من مكتبة Lucide الحالية** (تحقّق فعلي: `curl` إلى `bar-chart-3.svg` يعيد 404). الاسم الحالي لنفس مفهوم «رسم بياني بأعمدة عمودية» هو `chart-column`، مصدره الحقيقي مؤكَّد بـ`curl` أدناه — نفس درس المرحلة 0 مع `footprints`: لا رسم يدوي، ولا افتراض اسم قديم دون تحقّق، يُستعمَل الاسم الحالي الحقيقي دائماً).

- [ ] **خطوة 1: إضافة الأيقونتين إلى `ICON_PATHS`**

في `index.html`، بعد المفتاح `'footprints'` الحالي (ينتهي بـ`</>` في السطر 955) وقبل `};` (السطر 956)، أضف فاصلة بعد `footprints` ثم:

```jsx
            // Lucide الرسمي (رخصة ISC)، جُلب بـcurl لا من الذاكرة. اسم المواصفة الأصلي
            // `bar-chart-3` حُذف من المكتبة الحالية؛ `chart-column` هو نفس مفهوم الأعمدة
            // العمودية بالاسم الحديث — تحقّق فعلي عبر curl قبل الاستعمال، لا افتراض.
            'clipboard-list': <><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></>,
            'chart-column': <><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></>
```

- [ ] **خطوة 2: إدراج مكوّن `PageHeader`**

في `index.html`، بين إغلاق `StatusBadge` (السطر 1027 `);`) وبداية `function StaffSystem() {` (السطر 1029)، أدرج:

```jsx
        // ترويسة صفحة موحّدة محايدة (المواصفة §6.1) تحلّ محلّ بانرات التدرّج لكل شاشة.
        // icon إمّا اسم من ICON_PATHS (الحالة الشائعة) أو عقدة React جاهزة — لهوية ديناميكية
        // ليست بعد ضمن ICON_PATHS (أيقونة/إيموجي الوحدة في شاشة «الوحدة المختارة»، تحويلها
        // مهمة المرحلة 3 لا هذه المرحلة). meta لا يفرض تغليف شارة موحّد: بعض الشاشات تحتاج
        // أكثر من عنصر meta بتنسيقين مختلفين (عدّاد + شارة ملوّنة)، فالمستدعي يغلّف بنفسه.
        const PageHeader = ({ icon, title, description, meta, actions }) => (
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[color:var(--border)]">
                <div className="min-w-0">
                    <h1 className="text-lg md:text-xl font-black text-[color:var(--ink)] flex items-center gap-2 flex-wrap">
                        {icon && (typeof icon === 'string'
                            ? <Icon name={icon} className="w-5 h-5 text-[color:var(--action)] flex-shrink-0" />
                            : icon)}
                        <span>{title}</span>
                    </h1>
                    {(description || meta) && (
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {description && <p className="text-xs text-[color:var(--ink-2)]">{description}</p>}
                            {meta}
                        </div>
                    )}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </header>
        );

```

- [ ] **خطوة 3: البوابتان على `index.html`**

```bash
node scratch/check_babel_block.js index.html
node scratch/smoke_render.js index.html
```
متوقَّع: `OK` من الاثنتين. إن فشل `smoke_render` بخطأ TDZ: تأكد أن `PageHeader` قبل `function StaffSystem()` وليس بعده.

- [ ] **خطوة 4: نسخ السحابية والترحيل اليدوي للأوفلاين**

```bash
cp index.html "نظام_ادارة_الملاك_v9.5_cloud.html"
```
في `نظام_ادارة_الملاك_v9.5_offline.html`: ابحث عن `'footprints':` وطبّق نفس إضافة الأيقونتين بعده؛ ابحث عن `const StatusBadge = ({ tone` وأضف `PageHeader` بعد إغلاق تعريفها بنفس الكود أعلاه حرفياً.

```bash
node scratch/check_babel_block.js "نظام_ادارة_الملاك_v9.5_offline.html"
node scratch/smoke_render.js "نظام_ادارة_الملاك_v9.5_offline.html"
grep -c "firebaseio\|identitytoolkit\|AIza" "نظام_ادارة_الملاك_v9.5_offline.html"
```
متوقَّع: `OK` من البوابتين، و`0` من `grep` (لاحظ: `grep -c` يعيد كود خروج 1 عند عدّ صفر — هذا طبيعي، لا يعني فشل الأمر، فقط لا تُسلسِله بـ`&&` مع أمر تالٍ يعتمد على نجاحه).

- [ ] **خطوة 5: النشر والالتزام**

```bash
python publish_desktop_copies.py
git add index.html "نظام_ادارة_الملاك_v9.5_cloud.html" "نظام_ادارة_الملاك_v9.5_offline.html"
git commit -m "$(cat <<'EOF'
Add the PageHeader component and two Lucide icons for phase 1

PageHeader (spec section 6.1) is the neutral header that will replace every
screen's gradient banner in the following tasks. No screen consumes it yet.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2 — المهمة 2: تطبيق `PageHeader` على «الموقف اليومي»

**الملفات:**
- تعديل: `index.html:10487-10503`
- تعديل: `نظام_ادارة_الملاك_v9.5_cloud.html` (نسخ حرفي)
- تعديل: `نظام_ادارة_الملاك_v9.5_offline.html` (ترحيل يدوي — ابحث عن `الموقف اليومي لمنتسبي الشعبة`)
- إنشاء: `scratch/check_page_header_daily_status.js`

**الواجهات:**
- يستهلك: `PageHeader` من المهمة 1 (بلا `meta`، لا عدّاد في هذا البانر أصلاً).

- [ ] **خطوة 1: كتابة الاختبار (فاشل الآن)**

```javascript
const { chromium } = require('playwright');
const path = require('path');
const url = require('url');
const nav = require('./nav');

// يثبت انتقال بانر «الموقف اليومي» المتدرّج (teal->emerald) إلى PageHeader محايد
// (المواصفة §6.1، §9 صفّ 1): نفس العنوان والوصف والزر، بلا bg-gradient-to-*، وأيقونة
// SVG واحدة (clipboard-list) بدل الإيموجي 📋 السابق في العنوان تحديداً (الزر يبقي إيموجيه).
const FILE = path.resolve(__dirname, '..', process.argv[2] || 'نظام_ادارة_الملاك_v9.5_offline.html');
const FILE_URL = url.pathToFileURL(FILE).href;

const testStaff = [
  { id: 's1', name: 'موظف تجريبي أول', jobNumber: '770001', jobTitle: 'فني', workType: 'صباحي', location: 'مقر الشعبة', unit: 'مقر الشعبة', gender: 'ذكر', status: 'نشط' }
];

let failed = 0;
const check = (label, ok, detail) => { if (!ok) failed++; console.log(label, ok ? 'PASS ✅' : 'FAIL ❌', detail !== undefined ? '— ' + detail : ''); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('dialog', async d => { await d.accept(); });

  await page.goto(FILE_URL, { timeout: 90000 });
  await page.evaluate((staff) => { localStorage.clear(); localStorage.setItem('staffData', JSON.stringify(staff)); }, testStaff);
  await page.reload({ timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.getByText(/ابدأ العمل الآن/).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('input[type="password"], input[type="text"]').first().fill('1975');
  await page.getByRole('button', { name: /دخول للنظام/ }).click();
  await page.waitForTimeout(1500);

  await nav.goto.attendance(page);
  await nav.gotoSub(page, 'dailyStatus');

  const header = page.locator('header').filter({ hasText: 'الموقف اليومي لمنتسبي الشعبة' }).first();
  check('1) الترويسة موجودة بعنوانها؟', await header.count() === 1);
  check('2) لا يوجد bg-gradient-to- على الترويسة؟', !(await header.getAttribute('class') || '').includes('bg-gradient-to'));
  check('3) أيقونة clipboard-list ظاهرة داخل h1؟', await header.locator('h1 svg[data-icon="clipboard-list"]').count() === 1);
  check('4) لا إيموجي 📋 في h1 (انتقل بالكامل إلى SVG)؟', !(await header.locator('h1').innerText()).includes('📋'));
  check('5) نص الوصف محفوظ حرفياً؟', (await header.locator('p').innerText()).includes('موقف موحد حسب الوحدات يعرض جميع المناوبين'));
  const btn = header.getByRole('button', { name: /معاينة وتصدير الموقف/ });
  check('6) زر التصدير موجود بنصه ونفس شكله (إيموجي 👁️ لم يُمسّ)؟', (await btn.innerText()).includes('👁️'));

  const lightColor = await header.locator('h1').evaluate(el => getComputedStyle(el).color);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);
  const darkColor = await header.locator('h1').evaluate(el => getComputedStyle(el).color);
  check('7) لون العنوان يتغيّر بين النهاري والليلي (متغيّر CSS لا صنف ثابت)؟', lightColor !== darkColor, `light=${lightColor} dark=${darkColor}`);

  console.log('errors:', JSON.stringify(errors));
  const realErrors = errors.filter((e) => e !== 'PAGEERROR: Failed to fetch');
  if (realErrors.length) failed++;
  console.log(failed ? `\nFAILED ❌ (${failed})` : '\nALL PASS ✅');
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
```

(`nav.goto.attendance` و`nav.gotoSub` مؤكَّدان من قراءة فعلية لـ`scratch/nav.js` — لا `nav.goto.dailyStatus` مباشرة: القسم واحد `attendance`، والشاشات الثلاث تحته `roster`/`dailyStatus`/`periodReport` عبر `nav.gotoSub(page, key)` بعد فتح القسم.)

- [ ] **خطوة 2: تشغيل الاختبار للتأكد من الفشل**

```bash
node scratch/check_page_header_daily_status.js
```
متوقَّع: فشل الفحصين 1 و3 (لا `<header>` بهذا النص بعد، لا `data-icon="clipboard-list"`) — البانر الحالي `<div>` عادي بإيموجي.

- [ ] **خطوة 3: التنفيذ**

استبدل في `index.html:10487-10503` هذا الكود الحالي بالكامل:

```jsx
                                        <div className="p-6 bg-gradient-to-r from-teal-500 to-emerald-600 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <h2 className="text-2xl font-black flex items-center gap-2">
                                                        <span>📋</span>
                                                        <span>الموقف اليومي لمنتسبي الشعبة</span>
                                                    </h2>
                                                    <p className="text-xs md:text-sm mt-1 text-teal-50 opacity-90 font-medium">
                                                        موقف موحد حسب الوحدات يعرض جميع المناوبين (في الدوام أو الاستراحة) والصباحيين غير الحاضرين فقط
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 flex-wrap w-full md:w-auto">
                                                    <button onClick={exportDailyReportExcel} className="bg-white text-teal-700 hover:bg-teal-50 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-md transition active:scale-95 flex items-center gap-1.5 flex-1 md:flex-initial justify-center cursor-pointer">
                                                        <span>👁️</span>
                                                        <span>معاينة وتصدير الموقف</span>
                                                    </button>
                                                </div>
                                            </div>
```

بهذا:

```jsx
                                        <PageHeader
                                            icon="clipboard-list"
                                            title="الموقف اليومي لمنتسبي الشعبة"
                                            description="موقف موحد حسب الوحدات يعرض جميع المناوبين (في الدوام أو الاستراحة) والصباحيين غير الحاضرين فقط"
                                            actions={
                                                <button onClick={exportDailyReportExcel} className="bg-[var(--action)] hover:bg-[var(--action-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition active:scale-95 flex items-center gap-1.5 flex-1 md:flex-initial justify-center cursor-pointer">
                                                    <span>👁️</span>
                                                    <span>معاينة وتصدير الموقف</span>
                                                </button>
                                            }
                                        />
```

(الزر كان `bg-white text-teal-700 hover:bg-teal-50` — يفترض خلفية متدرّجة، فطُبِّق استثناء «القيود العامة»: صار `bg-[var(--action)] hover:bg-[var(--action-hover)] text-white`. النص والحجم والإيموجي و`onClick` بلا أي تغيير.)

- [ ] **خطوة 4: تشغيل الاختبار للتأكد من النجاح**

```bash
node scratch/check_page_header_daily_status.js
```
متوقَّع: `ALL PASS ✅` (7/7).

- [ ] **خطوة 5: البوابتان، النسخ، الترحيل، النشر (كما في خطوات 3-5 من المهمة 1)، ثم تشغيل الاختبار على الأوفلاين أيضاً بلا وسيط**

```bash
node scratch/check_babel_block.js index.html && node scratch/smoke_render.js index.html
node scratch/check_babel_block.js "نظام_ادارة_الملاك_v9.5_offline.html" && node scratch/smoke_render.js "نظام_ادارة_الملاك_v9.5_offline.html"
node scratch/check_page_header_daily_status.js
python publish_desktop_copies.py
```

- [ ] **خطوة 6: الالتزام**

```bash
git add index.html "نظام_ادارة_الملاك_v9.5_cloud.html" "نظام_ادارة_الملاك_v9.5_offline.html"
git commit -m "$(cat <<'EOF'
Replace the daily-status banner with PageHeader

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3 — المهمة 3: تطبيق `PageHeader` على «تقرير الفترة»

**الملفات:**
- تعديل: `index.html:10922-10944`
- تعديل: `نظام_ادارة_الملاك_v9.5_cloud.html`، `نظام_ادارة_الملاك_v9.5_offline.html` (ابحث عن `محرك تقارير موقف الحضور والدوام`)
- إنشاء: `scratch/check_page_header_period_report.js`

**الواجهات:**
- يستهلك: `PageHeader` (بلا `meta`).

- [ ] **خطوة 1: كتابة الاختبار (فاشل الآن)**

احفظ في `scratch/check_page_header_period_report.js`:

```javascript
const { chromium } = require('playwright');
const path = require('path');
const url = require('url');
const nav = require('./nav');

// يثبت انتقال بانر «تقرير الفترة» المتدرّج (blue->indigo->purple) إلى PageHeader محايد
// (المواصفة §6.1، §9 صفّ 1): نفس العنوان والوصف والزر، بلا bg-gradient-to-*، وأيقونة
// SVG واحدة (chart-column، بديل bar-chart-3 المحذوفة من Lucide) بدل الإيموجي 📊 في العنوان
// تحديداً — الزر يبقي إيموجيه 📊 كما هو، هذا فرق موضعي مقصود لا خطأ.
const FILE = path.resolve(__dirname, '..', process.argv[2] || 'نظام_ادارة_الملاك_v9.5_offline.html');
const FILE_URL = url.pathToFileURL(FILE).href;

const testStaff = [
  { id: 's1', name: 'موظف تجريبي أول', jobNumber: '770001', jobTitle: 'فني', workType: 'صباحي', location: 'مقر الشعبة', unit: 'مقر الشعبة', gender: 'ذكر', status: 'نشط' }
];

let failed = 0;
const check = (label, ok, detail) => { if (!ok) failed++; console.log(label, ok ? 'PASS ✅' : 'FAIL ❌', detail !== undefined ? '— ' + detail : ''); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('dialog', async d => { await d.accept(); });

  await page.goto(FILE_URL, { timeout: 90000 });
  await page.evaluate((staff) => { localStorage.clear(); localStorage.setItem('staffData', JSON.stringify(staff)); }, testStaff);
  await page.reload({ timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.getByText(/ابدأ العمل الآن/).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('input[type="password"], input[type="text"]').first().fill('1975');
  await page.getByRole('button', { name: /دخول للنظام/ }).click();
  await page.waitForTimeout(1500);

  await nav.goto.attendance(page);
  await nav.gotoSub(page, 'periodReport');

  const header = page.locator('header').filter({ hasText: 'محرك تقارير موقف الحضور والدوام للفترة المحددة' }).first();
  check('1) الترويسة موجودة بعنوانها؟', await header.count() === 1);
  check('2) لا يوجد bg-gradient-to- على الترويسة؟', !(await header.getAttribute('class') || '').includes('bg-gradient-to'));
  check('3) أيقونة chart-column ظاهرة داخل h1؟', await header.locator('h1 svg[data-icon="chart-column"]').count() === 1);
  check('4) لا إيموجي 📊 في h1؟', !(await header.locator('h1').innerText()).includes('📊'));
  check('5) نص الوصف محفوظ حرفياً؟', (await header.locator('p').innerText()).includes('حدد الفترة الزمنية واضغط على استخراج الموقف'));
  const btn = header.getByRole('button', { name: /معاينة وتصدير تقرير الفترة/ });
  check('6) زر التصدير موجود بنصه ونفس شكله (إيموجي 📊 لم يُمسّ)؟', (await btn.innerText()).includes('📊'));

  const lightColor = await header.locator('h1').evaluate(el => getComputedStyle(el).color);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);
  const darkColor = await header.locator('h1').evaluate(el => getComputedStyle(el).color);
  check('7) لون العنوان يتغيّر بين النهاري والليلي؟', lightColor !== darkColor, `light=${lightColor} dark=${darkColor}`);

  console.log('errors:', JSON.stringify(errors));
  const realErrors = errors.filter((e) => e !== 'PAGEERROR: Failed to fetch');
  if (realErrors.length) failed++;
  console.log(failed ? `\nFAILED ❌ (${failed})` : '\nALL PASS ✅');
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
```

- [ ] **خطوة 2: تشغيل للتأكد من الفشل**

```bash
node scratch/check_page_header_period_report.js
```

- [ ] **خطوة 3: التنفيذ** — استبدل `index.html:10922-10944`:

```jsx
                                            <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <h2 className="text-2xl font-black flex items-center gap-2">
                                                        <span>📊</span>
                                                        <span>محرك تقارير موقف الحضور والدوام للفترة المحددة</span>
                                                    </h2>
                                                    <p className="text-xs md:text-sm mt-1 text-blue-100 opacity-95 font-medium">
                                                        حدد الفترة الزمنية واضغط على استخراج الموقف لمعاينة وسجل إجازات ودورات وغياب ودواير المنتسبين للفترة
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 flex-wrap w-full md:w-auto">
                                                    {/* حُذف زرّ «العودة للموقف اليومي»: صار تقرير الفترة وجهة في
                                                        الشريط الفرعي، فالخروج منه كالدخول إليه — من الشريط نفسه.
                                                        وزرّ تنقّل ثالث في موضع ثالث كان يشتّت لا يساعد. */}
                                                    <button 
                                                        onClick={exportPeriodReportExcel} 
                                                        className="bg-white text-indigo-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-md transition active:scale-95 flex items-center gap-1.5 flex-1 md:flex-initial justify-center cursor-pointer"
                                                    >
                                                        <span>📊</span>
                                                        <span>معاينة وتصدير تقرير الفترة</span>
                                                    </button>
                                                </div>
                                            </div>
```

بهذا:

```jsx
                                            <PageHeader
                                                icon="chart-column"
                                                title="محرك تقارير موقف الحضور والدوام للفترة المحددة"
                                                description="حدد الفترة الزمنية واضغط على استخراج الموقف لمعاينة وسجل إجازات ودورات وغياب ودواير المنتسبين للفترة"
                                                actions={
                                                    <button
                                                        onClick={exportPeriodReportExcel}
                                                        className="bg-[var(--action)] hover:bg-[var(--action-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition active:scale-95 flex items-center gap-1.5 flex-1 md:flex-initial justify-center cursor-pointer"
                                                    >
                                                        <span>📊</span>
                                                        <span>معاينة وتصدير تقرير الفترة</span>
                                                    </button>
                                                }
                                            />
```

(التعليق عن زرّ «العودة» المحذوف تاريخي — لا فائدة منه بعد الآن، يُحذَف معه لا يُنقَل.)

- [ ] **خطوة 4: تشغيل للتأكد من النجاح؛ خطوة 5: البوابتان/النسخ/الترحيل/النشر؛ خطوة 6: الالتزام** — بنفس أوامر المهمة 2 خطوات 4-6، بالملف والرسالة المناسبين (`check_page_header_period_report.js`، رسالة الالتزام "Replace the period-report banner with PageHeader").

---

### Task 4 — المهمة 4: تطبيق `PageHeader` على «الوحدات» (قائمة الوحدات)

**الملفات:**
- تعديل: `index.html:11361-11364`
- تعديل: `نظام_ادارة_الملاك_v9.5_cloud.html`، `نظام_ادارة_الملاك_v9.5_offline.html` (ابحث عن `الوحدات الإدارية`)
- إنشاء: `scratch/check_page_header_units.js` (تُكمَّل بالمهمة 5)

**الواجهات:**
- يستهلك: `PageHeader` (بلا `meta` ولا `actions` — لا عدّاد ولا زر في هذا البانر أصلاً).
- ينتج: هيكل `scratch/check_page_header_units.js` — دالة `checkRosterBanner(page)` تُستدعى من `main()`، والمهمة 5 تضيف `checkSelectedUnitBanner(page)` بجانبها في نفس الملف (لا ملف منفصل — نفس مسار التنقّل: وحدات ← وحدة مختارة).

**ملاحظة نطاق: لا تلمس بانر «سلة العمل الإضافي الموحدة» (سطور 11311-11356، تدرّج teal→emerald) رغم ظهوره في نفس الشاشة — هذا تنبيه سياقي شرطي (`overtimeIds.length > 0`) لا بانر عنوان صفحة، ومصيره مكوّن `Notice` في المرحلة 5 لا `PageHeader` هنا.**

- [ ] **خطوة 1: كتابة هيكل الاختبار (فاشل الآن)**

```javascript
const { chromium } = require('playwright');
const path = require('path');
const url = require('url');
const nav = require('./nav');

// يثبت انتقال بانري «الوحدات» (سطر واحد بلا زر) و«الوحدة المختارة» (ديناميكي: أيقونة/لون
// الوحدة، عدّاد، شارة إضافي شرطية، زرّا عودة وتصدير) إلى PageHeader (المواصفة §6.1، §9 صفّ 1).
// لا يلمس بانر «سلة العمل الإضافي» المشترك بين الشاشتين — يبقى كما هو، مصيره المرحلة 5.
const FILE = path.resolve(__dirname, '..', process.argv[2] || 'نظام_ادارة_الملاك_v9.5_offline.html');
const FILE_URL = url.pathToFileURL(FILE).href;

const testStaff = [
  { id: 's1', name: 'موظف تجريبي أول', jobNumber: '770001', jobTitle: 'فني', workType: 'صباحي', location: 'مقر الشعبة', unit: 'مقر الشعبة', gender: 'ذكر', status: 'نشط' },
  { id: 's2', name: 'موظف تجريبي ثان', jobNumber: '770002', jobTitle: 'فني', workType: 'مناوب', location: 'مقر الشعبة', unit: 'مقر الشعبة', gender: 'ذكر', status: 'نشط' }
];

let failed = 0;
const check = (label, ok, detail) => { if (!ok) failed++; console.log(label, ok ? 'PASS ✅' : 'FAIL ❌', detail !== undefined ? '— ' + detail : ''); };

async function checkRosterBanner(page) {
  await nav.goto.attendance(page);
  await nav.gotoSub(page, 'roster');
  const header = page.locator('header').filter({ hasText: 'الوحدات الإدارية' }).first();
  check('1) ترويسة الوحدات موجودة؟', await header.count() === 1);
  check('2) لا bg-gradient-to- عليها؟', !(await header.getAttribute('class') || '').includes('bg-gradient-to'));
  check('3) أيقونة building-2؟', await header.locator('h1 svg[data-icon="building-2"]').count() === 1);
  check('4) لا إيموجي 🏢 في h1؟', !(await header.locator('h1').innerText()).includes('🏢'));
  check('5) وصف "اختر وحدة لعرض موظفيها" محفوظ؟', (await header.locator('p').innerText()).includes('اختر وحدة لعرض موظفيها'));
}

async function checkSelectedUnitBanner(page) {
  // يُكمَل في المهمة 5
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('dialog', async d => { await d.accept(); });

  await page.goto(FILE_URL, { timeout: 90000 });
  await page.evaluate((staff) => { localStorage.clear(); localStorage.setItem('staffData', JSON.stringify(staff)); }, testStaff);
  await page.reload({ timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.getByText(/ابدأ العمل الآن/).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('input[type="password"], input[type="text"]').first().fill('1975');
  await page.getByRole('button', { name: /دخول للنظام/ }).click();
  await page.waitForTimeout(1500);

  await checkRosterBanner(page);
  await checkSelectedUnitBanner(page);

  console.log('errors:', JSON.stringify(errors));
  const realErrors = errors.filter((e) => e !== 'PAGEERROR: Failed to fetch');
  if (realErrors.length) failed++;
  console.log(failed ? `\nFAILED ❌ (${failed})` : '\nALL PASS ✅');
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
```

- [ ] **خطوة 2: تشغيل للتأكد من الفشل** — `node scratch/check_page_header_units.js` (متوقَّع فشل الفحوص 1-3).

- [ ] **خطوة 3: التنفيذ** — استبدل `index.html:11361-11364`:

```jsx
                                        <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                            <h2 className="text-2xl font-bold">🏢 الوحدات الإدارية</h2>
                                            <p className="text-sm opacity-90 mt-1">اختر وحدة لعرض موظفيها</p>
                                        </div>
```

بهذا:

```jsx
                                        <PageHeader icon="building-2" title="الوحدات الإدارية" description="اختر وحدة لعرض موظفيها" />
```

- [ ] **خطوة 4: تشغيل للتأكد من النجاح (5/5)؛ خطوة 5: البوابتان/النسخ/الترحيل/النشر؛ خطوة 6: الالتزام** — رسالة "Replace the units-roster banner with PageHeader".

---

### Task 5 — المهمة 5: تطبيق `PageHeader` على «الوحدة المختارة»

**الملفات:**
- تعديل: `index.html:11418-11482`
- تعديل: `نظام_ادارة_الملاك_v9.5_cloud.html`، `نظام_ادارة_الملاك_v9.5_offline.html` (ابحث عن `منتسبو {selectedUnit.name}` أو `bg-gradient-to-r \${selectedUnit.gradient}`)
- تعديل: `scratch/check_page_header_units.js` (إكمال `checkSelectedUnitBanner`، لا ملف جديد)

**الواجهات:**
- يستهلك: `PageHeader` مع `icon` كعقدة React جاهزة (وليس اسماً نصياً — أيقونة الوحدة إيموجي ديناميكي لكل وحدة، تحويلها SVG مهمة المرحلة 3 لا هذه)، و`meta` بعنصرين مختلفي التنسيق (نص عادي + شارة ملوّنة شرطية) — هذا بالضبط سبب أن `PageHeader` لا يفرض تغليف `meta` موحّداً (انظر تعليق المهمة 1).

- [ ] **خطوة 1: كتابة الاختبار (فاشل الآن)** — عدِّل `checkSelectedUnitBanner` في `scratch/check_page_header_units.js`:

```javascript
async function checkSelectedUnitBanner(page) {
  await nav.goto.attendance(page);
  await nav.gotoSub(page, 'roster');
  const unitCard = page.getByRole('button', { name: /مقر الشعبة/ });
  await unitCard.click();
  await page.waitForTimeout(500);

  const header = page.locator('header').filter({ hasText: 'منتسبو' }).first();
  check('6) ترويسة الوحدة المختارة موجودة؟', await header.count() === 1);
  check('7) لا bg-gradient-to- عليها (زال التدرّج الديناميكي)؟', !(await header.getAttribute('class') || '').includes('bg-gradient-to'));
  check('8) عنوانها "منتسبو مقر الشعبة"؟', (await header.locator('h1').innerText()).includes('منتسبو مقر الشعبة'));
  check('9) عدّاد "2 موظف" ضمن meta؟', (await header.innerText()).includes('2 موظف'));
  const backBtn = header.getByRole('button', { name: /عودة/ });
  const exportBtn = header.getByRole('button', { name: /معاينة وتصدير/ });
  check('10) زرّا العودة والتصدير موجودان؟', await backBtn.count() === 1 && await exportBtn.count() === 1);
  await backBtn.click();
  await page.waitForTimeout(400);
  check('11) العودة تعمل: نعود لقائمة الوحدات؟', await page.locator('header').filter({ hasText: 'الوحدات الإدارية' }).count() === 1);
}
```

- [ ] **خطوة 2: تشغيل للتأكد من الفشل** — `node scratch/check_page_header_units.js`.

- [ ] **خطوة 3: التنفيذ** — استبدل `index.html:11418-11482`:

```jsx
                                                <div className={`p-6 bg-gradient-to-r ${selectedUnit.gradient} text-white`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                onClick={() => setSelectedUnit(null)}
                                                                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-4 py-2 font-bold transition backdrop-blur-sm"
                                                            >
                                                                ← عودة
                                                            </button>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-4xl">{selectedUnit.icon}</span>
                                                                <div>
                                                                    <h2 className="text-2xl font-bold">منتسبو {selectedUnit.name}</h2>
                                                                    <p className="text-sm opacity-90 mt-1 flex flex-wrap items-center gap-2">
                                                                        <span>{sortedStaff.length} موظف</span>
                                                                        {sortedStaff.filter(s => overtimeIds.includes(s.id)).length > 0 && (
                                                                            <span className="bg-emerald-500 bg-opacity-90 border border-emerald-400 text-white font-bold px-2.5 py-0.5 rounded text-xs shadow-sm flex items-center gap-1">
                                                                                <span>🛒 مشمولو الإضافي بالوحدة:</span>
                                                                                <span>{sortedStaff.filter(s => overtimeIds.includes(s.id)).length}</span>
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const exportData = sortedStaff.map((s, i) => ({
                                                                    type: 'data',
                                                                    'ت': i + 1,
                                                                    'الاسم الكامل': s.name,
                                                                    'الرقم الوظيفي': s.jobNumber || '',
                                                                    'العنوان الوظيفي': s.jobTitle || '',
                                                                    'القسم': s.department || '',
                                                                    'الشعبة': s.section || '',
                                                                    'الموقع': s.location || '',
                                                                    'الوحدة': s.unit || '',
                                                                    'طبيعة العمل': s.workType || '',
                                                                    'هاتف العمل': s.workPhone || '',
                                                                    'التولد': s.birthDate || '',
                                                                    'رقم العمل': s.workNumber || '',
                                                                    'تاريخ التعيين': s.hireDate || '',
                                                                    'التحصيل الدراسي': s.education || '',
                                                                    'سنة التخرج': s.graduationYear || '',
                                                                    'الاختصاص': s.specialization || '',
                                                                    'الجنس': s.gender || '',
                                                                    'التوطين': s.bank || '',
                                                                    'النقال': s.mobile || '',
                                                                    'الحالة': s.status || '',
                                                                    'أيام الإجازة': s.vacationDays || '',
                                                                    'قياس البدلة': s.uniformSize || '',
                                                                    'قياس حذاء السلامة': s.shoeSafetySize || '',
                                                                    'تاريخ آخر تجهيز': s.lastSafetyDelivery || '',
                                                                    'البريد الإلكتروني': s.email || ''
                                                                }));
                                                                setPreviewData(exportData);
                                                                setVisiblePreviewColumns(['الرقم الوظيفي', 'العنوان الوظيفي', 'رقم الهاتف النقال']);
                                                                setShowPreview(true);
                                                            }}
                                                            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-6 py-3 font-bold transition backdrop-blur-sm"
                                                        >
                                                            👁️ معاينة وتصدير
                                                        </button>
                                                    </div>
                                                </div>
```

بهذا:

```jsx
                                                <PageHeader
                                                    icon={<span className="text-4xl flex-shrink-0">{selectedUnit.icon}</span>}
                                                    title={`منتسبو ${selectedUnit.name}`}
                                                    meta={
                                                        <>
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[color:var(--ink-2)]">{sortedStaff.length} موظف</span>
                                                            {sortedStaff.filter(s => overtimeIds.includes(s.id)).length > 0 && (
                                                                <span className="bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded text-xs shadow-sm inline-flex items-center gap-1">
                                                                    <span>🛒 مشمولو الإضافي بالوحدة:</span>
                                                                    <span>{sortedStaff.filter(s => overtimeIds.includes(s.id)).length}</span>
                                                                </span>
                                                            )}
                                                        </>
                                                    }
                                                    actions={
                                                        <>
                                                            <button
                                                                onClick={() => setSelectedUnit(null)}
                                                                className="bg-[var(--surface-muted)] hover:bg-[var(--border)] text-[color:var(--ink)] border border-[color:var(--border-strong)] rounded-lg px-4 py-2 font-bold transition"
                                                            >
                                                                ← عودة
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const exportData = sortedStaff.map((s, i) => ({
                                                                        type: 'data',
                                                                        'ت': i + 1,
                                                                        'الاسم الكامل': s.name,
                                                                        'الرقم الوظيفي': s.jobNumber || '',
                                                                        'العنوان الوظيفي': s.jobTitle || '',
                                                                        'القسم': s.department || '',
                                                                        'الشعبة': s.section || '',
                                                                        'الموقع': s.location || '',
                                                                        'الوحدة': s.unit || '',
                                                                        'طبيعة العمل': s.workType || '',
                                                                        'هاتف العمل': s.workPhone || '',
                                                                        'التولد': s.birthDate || '',
                                                                        'رقم العمل': s.workNumber || '',
                                                                        'تاريخ التعيين': s.hireDate || '',
                                                                        'التحصيل الدراسي': s.education || '',
                                                                        'سنة التخرج': s.graduationYear || '',
                                                                        'الاختصاص': s.specialization || '',
                                                                        'الجنس': s.gender || '',
                                                                        'التوطين': s.bank || '',
                                                                        'النقال': s.mobile || '',
                                                                        'الحالة': s.status || '',
                                                                        'أيام الإجازة': s.vacationDays || '',
                                                                        'قياس البدلة': s.uniformSize || '',
                                                                        'قياس حذاء السلامة': s.shoeSafetySize || '',
                                                                        'تاريخ آخر تجهيز': s.lastSafetyDelivery || '',
                                                                        'البريد الإلكتروني': s.email || ''
                                                                    }));
                                                                    setPreviewData(exportData);
                                                                    setVisiblePreviewColumns(['الرقم الوظيفي', 'العنوان الوظيفي', 'رقم الهاتف النقال']);
                                                                    setShowPreview(true);
                                                                }}
                                                                className="bg-[var(--action)] hover:bg-[var(--action-hover)] text-white rounded-lg px-6 py-3 font-bold transition shadow-sm"
                                                            >
                                                                👁️ معاينة وتصدير
                                                            </button>
                                                        </>
                                                    }
                                                />
```

(`selectedUnit.gradient` كان يُستهلَك فقط لتلوين هذا الغلاف — لم يعد له مستهلِك في هذا الموضع بعد الحذف؛ **لا تحذف الحقل نفسه من مصفوفة الوحدات** — بطاقات الوحدات في شبكة `الوحدات` (سطر ~11383) ما زالت تستهلكه، والمرحلة 3 وحدها تقرّر مصيره هناك.)

- [ ] **خطوة 4: تشغيل للتأكد من النجاح (11/11)؛ خطوة 5: البوابتان/النسخ/الترحيل/النشر؛ خطوة 6: الالتزام** — رسالة "Replace the selected-unit banner with PageHeader".

---

### Task 6 — المهمة 6: تطبيق `PageHeader` على الشاشات الأربع المشتركة (الملاك، التقييم، الماء، تجهيزات السلامة)

**الملفات:**
- تعديل: `index.html:11573-11608`
- تعديل: `نظام_ادارة_الملاك_v9.5_cloud.html`، `نظام_ادارة_الملاك_v9.5_offline.html` (ابحث عن `{current.length} موظف` — **تحذير: قد يتكرر النص فيما حولها؛ تحقّق أنك في العنصر الصحيح بمطابقة الأصناف `bg-gradient-to-r from-blue-500 to-indigo-500` كاملة قبل الاستبدال**)
- إنشاء: `scratch/check_page_header_shared.js`

**الواجهات:**
- يستهلك: `PageHeader` مع `icon`/`title` مشتقّين من `view` (جدول ثابت أدناه، لا من مصفوفة `sections` الموجودة داخل إغلاق التنقّل — الوصول إليها من هنا يتطلّب رفعها لنطاق مشترك، خارج نطاق هذه المهمة المحدَّد «عرض فقط»).

جدول الاشتقاق (يُبنى كخريطة ثابتة صغيرة مباشرة عند موضع الاستخدام، لا تُستورَد من مكان آخر):

| `view` | `icon` | `title` |
|---|---|---|
| `all` / `morning` / `shift` / `contract` | `users` | «الملاك» |
| `evaluation` | `star` | «التقييم» |
| `maa` | `droplet` | «الماء» |
| `safety` | `shield-check` | «تجهيزات السلامة» |

(الأيقونات الأربع نفسها المستخدَمة فعلاً في أزرار التنقّل الرئيسية لنفس الأقسام — سطور 8460/8472/8482/8485 — لا اختيار جديد، اتّساق مقصود.)

- [ ] **خطوة 1: كتابة الاختبار (فاشل الآن)**

```javascript
const { chromium } = require('playwright');
const path = require('path');
const url = require('url');
const nav = require('./nav');

// يثبت انتقال البانر المشترك الواحد (سطور 11573-11608 في index.html) الذي يخدم سبع قيم
// view (all/morning/shift/contract/evaluation/safety/maa) إلى PageHeader واحد بأيقونة وعنوان
// مشتقّين من view، ووصف/أزرار محفوظة شرطياً كما كانت (المواصفة §6.1، §9 صفّ 1).
const FILE = path.resolve(__dirname, '..', process.argv[2] || 'نظام_ادارة_الملاك_v9.5_offline.html');
const FILE_URL = url.pathToFileURL(FILE).href;

const testStaff = [
  { id: 's1', name: 'موظف تجريبي أول', jobNumber: '770001', jobTitle: 'فني', workType: 'صباحي', location: 'مقر الشعبة', unit: 'مقر الشعبة', gender: 'ذكر', status: 'نشط', uniformSize: 'L', shoeSafetySize: '42' },
  { id: 's2', name: 'موظف تجريبي ثان', jobNumber: '770002', jobTitle: 'فني', workType: 'مناوب', location: 'مقر الشعبة', unit: 'مقر الشعبة', gender: 'ذكر', status: 'نشط', uniformSize: 'XL', shoeSafetySize: '43' }
];

let failed = 0;
const check = (label, ok, detail) => { if (!ok) failed++; console.log(label, ok ? 'PASS ✅' : 'FAIL ❌', detail !== undefined ? '— ' + detail : ''); };

async function checkOne(page, { gotoFn, expectIcon, expectTitle, expectDesc, expectSafetyToggle, expectExcelBtn, label }) {
  await gotoFn(page);
  const header = page.locator('header').filter({ has: page.locator(`svg[data-icon="${expectIcon}"]`) }).first();
  check(`${label} — الترويسة بأيقونة ${expectIcon}؟`, await header.count() === 1);
  check(`${label} — لا bg-gradient-to- عليها؟`, !(await header.getAttribute('class') || '').includes('bg-gradient-to'));
  check(`${label} — العنوان "${expectTitle}"؟`, (await header.locator('h1').innerText()).includes(expectTitle));
  check(`${label} — عدّاد موظفين ضمن meta؟`, /\d+ موظف/.test(await header.innerText()));
  if (expectDesc) {
    check(`${label} — الوصف محفوظ؟`, (await header.innerText()).includes(expectDesc));
  }
  check(`${label} — زر معاينة وتصدير؟`, await header.getByRole('button', { name: /معاينة وتصدير/ }).count() >= 1);
  check(`${label} — زر تبديل السلامة ${expectSafetyToggle ? 'ظاهر' : 'غائب'} كما متوقَّع؟`,
    (await header.getByRole('button', { name: /مستحقي التجديد|كل المجهزين/ }).count() > 0) === expectSafetyToggle);
  check(`${label} — زر Excel القياسي ${expectExcelBtn ? 'ظاهر' : 'غائب'} كما متوقَّع؟`,
    (await header.getByRole('button', { name: /تصدير جدول قياسي Excel/ }).count() > 0) === expectExcelBtn);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('dialog', async d => { await d.accept(); });

  await page.goto(FILE_URL, { timeout: 90000 });
  await page.evaluate((staff) => { localStorage.clear(); localStorage.setItem('staffData', JSON.stringify(staff)); }, testStaff);
  await page.reload({ timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.getByText(/ابدأ العمل الآن/).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('input[type="password"], input[type="text"]').first().fill('1975');
  await page.getByRole('button', { name: /دخول للنظام/ }).click();
  await page.waitForTimeout(1500);

  await checkOne(page, { gotoFn: nav.goto.all, expectIcon: 'users', expectTitle: 'الملاك', expectSafetyToggle: false, expectExcelBtn: true, label: '1) الملاك' });
  await checkOne(page, { gotoFn: nav.goto.evaluation, expectIcon: 'star', expectTitle: 'التقييم', expectDesc: 'استبعاد الإجازات الطويلة طويلة وأمومة', expectSafetyToggle: false, expectExcelBtn: false, label: '2) التقييم' });
  await checkOne(page, { gotoFn: nav.goto.water, expectIcon: 'droplet', expectTitle: 'الماء', expectDesc: 'استبعاد من في دورة', expectSafetyToggle: false, expectExcelBtn: false, label: '3) الماء' });
  await checkOne(page, { gotoFn: nav.goto.safety, expectIcon: 'shield-check', expectTitle: 'تجهيزات السلامة', expectSafetyToggle: true, expectExcelBtn: false, label: '4) السلامة' });

  console.log('errors:', JSON.stringify(errors));
  const realErrors = errors.filter((e) => e !== 'PAGEERROR: Failed to fetch');
  if (realErrors.length) failed++;
  console.log(failed ? `\nFAILED ❌ (${failed})` : '\nALL PASS ✅');
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
```

(`nav.goto.all`/`evaluation`/`water`/`safety` الأربعة مؤكَّدة حرفياً من قراءة فعلية لـ`scratch/nav.js` — لا حاجة تخمين.)

- [ ] **خطوة 2: تشغيل للتأكد من الفشل** — `node scratch/check_page_header_shared.js`.

- [ ] **خطوة 3: التنفيذ** — استبدل `index.html:11573-11608`:

```jsx
                                    <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold">{current.length} موظف</h2>
                                            <p className="text-sm opacity-90 mt-1">
                                                {view === 'maa' && 'استبعاد من في دورة، ومن غاب نصف الشهر فأكثر بإجازة طويلة أو أمومة، ومن استُثني دائماً'}
                                                {view === 'evaluation' && 'استبعاد الإجازات الطويلة طويلة وأمومة'}
                                                {view === 'morning' && 'الاسم الثلاثي فقط'}
                                                {view === 'contract' && `عقود 315: ${stats.contract315} · عقود المحافظة: ${stats.contractGov}${stats.contractUnclassified ? ` · غير مصنّف: ${stats.contractUnclassified}` : ''}`}
                                                {view === 'shift' && 'مرتب حسب المواقع'}
                                            </p>
                                        </div>
                                        <div className="flex gap-3 flex-wrap justify-end">
                                            {view === 'safety' && (
                                                <button 
                                                    onClick={() => setShowDueSafetyOnly(!showDueSafetyOnly)}
                                                    className={`px-5 py-2.5 rounded-lg font-bold shadow-md transition active:scale-95 flex items-center gap-1.5 border ${
                                                        showDueSafetyOnly 
                                                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-white' 
                                                            : 'bg-white/20 hover:bg-white/30 text-white border-white/40'
                                                    }`}
                                                >
                                                    <span>🦺</span>
                                                    <span>{showDueSafetyOnly ? 'عرض كل المجهزين' : 'عرض مستحقي التجديد فقط'}</span>
                                                </button>
                                            )}
                                            <button onClick={preparePreview} className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 shadow-lg transition">
                                                👁️ معاينة وتصدير
                                            </button>
                                            {view === 'all' && (
                                                <button onClick={exportStandardExcel}
                                                    className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 shadow-lg transition">
                                                    📊 تصدير جدول قياسي Excel
                                                </button>
                                            )}
                                        </div>
                                    </div>
```

بهذا:

```jsx
                                    <PageHeader
                                        icon={{ all: 'users', morning: 'users', shift: 'users', contract: 'users', evaluation: 'star', maa: 'droplet', safety: 'shield-check' }[view]}
                                        title={{ all: 'الملاك', morning: 'الملاك', shift: 'الملاك', contract: 'الملاك', evaluation: 'التقييم', maa: 'الماء', safety: 'تجهيزات السلامة' }[view]}
                                        description={
                                            (view === 'maa' && 'استبعاد من في دورة، ومن غاب نصف الشهر فأكثر بإجازة طويلة أو أمومة، ومن استُثني دائماً') ||
                                            (view === 'evaluation' && 'استبعاد الإجازات الطويلة طويلة وأمومة') ||
                                            (view === 'morning' && 'الاسم الثلاثي فقط') ||
                                            (view === 'contract' && `عقود 315: ${stats.contract315} · عقود المحافظة: ${stats.contractGov}${stats.contractUnclassified ? ` · غير مصنّف: ${stats.contractUnclassified}` : ''}`) ||
                                            (view === 'shift' && 'مرتب حسب المواقع') ||
                                            undefined
                                        }
                                        meta={<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[color:var(--ink-2)]">{current.length} موظف</span>}
                                        actions={
                                            <>
                                                {view === 'safety' && (
                                                    <button
                                                        onClick={() => setShowDueSafetyOnly(!showDueSafetyOnly)}
                                                        className={`px-5 py-2.5 rounded-lg font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 border ${
                                                            showDueSafetyOnly
                                                                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                                                                : 'bg-[var(--surface-muted)] hover:bg-[var(--border)] text-[color:var(--ink-2)] border-[color:var(--border-strong)]'
                                                        }`}
                                                    >
                                                        <span>🦺</span>
                                                        <span>{showDueSafetyOnly ? 'عرض كل المجهزين' : 'عرض مستحقي التجديد فقط'}</span>
                                                    </button>
                                                )}
                                                <button onClick={preparePreview} className="bg-[var(--action)] hover:bg-[var(--action-hover)] text-white px-6 py-3 rounded-lg font-bold shadow-sm transition">
                                                    👁️ معاينة وتصدير
                                                </button>
                                                {view === 'all' && (
                                                    <button onClick={exportStandardExcel}
                                                        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 shadow-lg transition">
                                                        📊 تصدير جدول قياسي Excel
                                                    </button>
                                                )}
                                            </>
                                        }
                                    />
```

(القيمة الافتراضية `undefined` في سلسلة `||` تضمن أن `description` يصير `undefined` لا `false` حين لا يطابق أي شرط — يطابق تماماً كيف كانت `<p>` تُرسَم فارغة فعلياً عند `all`/`safety` سابقاً، والآن `PageHeader` لا يرسم فقرة الوصف مطلقاً هناك بدل رسم فقرة فارغة، وهو تحسين لا انحراف.)

- [ ] **خطوة 4: تشغيل للتأكد من النجاح (٤ شاشات × ٦ فحوص ≈ 24 فحصاً)؛ خطوة 5: البوابتان/النسخ/الترحيل/النشر؛ خطوة 6: الالتزام** — رسالة "Replace the shared staff/evaluation/water/safety banner with one PageHeader".

---

### Task 7 — المهمة 7: إضافة `PageHeader` إلى «لوحة التحكم»

**قرار تنفيذي (سجِّله في تقرير الالتزام، فهو الوحيد من نوعه في هذه المرحلة):** لوحة التحكم **لا تملك بانر عنوان واحد قابلاً للاستبدال** — بنيتها مختلفة جذرياً عن الشاشات الثماني الأخرى (تسلسل بطاقات وتنبيهات متعددة الأغراض، لا عنوان `h1/h2` ظاهر في المحتوى أصلاً؛ راجع تقرير الاستكشاف). المواصفة (§9 صفّ 1) تُدرِج «لوحة التحكم» صراحة ضمن التسع، ومبدأ الاتساق (§4-4، §12-4) يقتضي أن تحمل كل شاشة الهوية نفسها. القرار: **إضافة** `PageHeader` جديد كلياً أعلى محتوى اللوحة (لا استبدال أي عنصر قائم)، محايد تماماً، بلا `description`/`meta`/`actions` (لا شيء قائم يقابلها — لا تُخترَع بيانات). بانر «تنبيه حماية البيانات» (تدرّج كهرماني نابض) وبطاقة الإحصائيات وشرائط رؤوس البطاقات **لا تُمسّ إطلاقاً** — الأول مصيره صراحةً `Notice` بالمرحلة 5 (المواصفة §6.5 تسمّيه حرفياً)، والبقية بطاقات محتوى لا بانرات شاشة.

**الملفات:**
- تعديل: `index.html` (إدراج قبل السطر 9703، انظر التوثيق أدناه)
- تعديل: `نظام_ادارة_الملاك_v9.5_cloud.html`، `نظام_ادارة_الملاك_v9.5_offline.html` (ابحث عن التعليق `{/* تنبيه النسخ الاحتياطي التلقائي */}` وأدرج قبله في نفس الموضع البنيوي)
- إنشاء: `scratch/check_page_header_dashboard.js`

**الواجهات:**
- يستهلك: `PageHeader` بأبسط استدعاء ممكن (`icon` و`title` فقط).

- [ ] **خطوة 1: التحقّق من موضع الإدراج قبل أي تعديل**

اقرأ `index.html:9695-9705` وتأكد أن السطر 9701 هو `)}`  إغلاق شرط نافذة مركز الاستعادة، والسطر 9703 تعليق `{/* تنبيه النسخ الاحتياطي التلقائي */}` يليه مباشرة السطر 9704 `{showBackupWarning && (`. إن اختلف رقم السطر عمّا هنا (تعديلات سابقة قد تكون أزاحته) اعثر على نفس التعليق نصياً بدل الاعتماد على الرقم.

- [ ] **خطوة 2: كتابة الاختبار (فاشل الآن)**

```javascript
const { chromium } = require('playwright');
const path = require('path');
const url = require('url');

// يثبت وجود PageHeader جديد أعلى لوحة التحكم (المواصفة §9 صفّ 1) — إضافة لا استبدال، لأن
// اللوحة لم تملك بانر عنوان واحد أصلاً. لا يلمس هذا الاختبار تنبيه النسخ الاحتياطي (Notice
// مستقبلي، المرحلة 5) ولا بطاقة الإحصائيات — كلاهما يجب أن يبقيا كما هما تماماً.
const FILE = path.resolve(__dirname, '..', process.argv[2] || 'نظام_ادارة_الملاك_v9.5_offline.html');
const FILE_URL = url.pathToFileURL(FILE).href;

const testStaff = [
  { id: 's1', name: 'موظف تجريبي أول', jobNumber: '770001', jobTitle: 'فني', workType: 'صباحي', location: 'مقر الشعبة', unit: 'مقر الشعبة', gender: 'ذكر', status: 'نشط' }
];

let failed = 0;
const check = (label, ok, detail) => { if (!ok) failed++; console.log(label, ok ? 'PASS ✅' : 'FAIL ❌', detail !== undefined ? '— ' + detail : ''); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('dialog', async d => { await d.accept(); });

  await page.goto(FILE_URL, { timeout: 90000 });
  await page.evaluate((staff) => { localStorage.clear(); localStorage.setItem('staffData', JSON.stringify(staff)); }, testStaff);
  await page.reload({ timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.getByText(/ابدأ العمل الآن/).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('input[type="password"], input[type="text"]').first().fill('1975');
  await page.getByRole('button', { name: /دخول للنظام/ }).click();
  await page.waitForTimeout(1500);
  // الدخول يهبط على لوحة التحكم افتراضياً (useState('dashboard'))، لا حاجة تنقّل إضافي.

  const header = page.locator('header').filter({ has: page.locator('svg[data-icon="layout-dashboard"]') }).first();
  check('1) ترويسة لوحة التحكم موجودة؟', await header.count() === 1);
  check('2) عنوانها "لوحة التحكم"؟', (await header.locator('h1').innerText()).includes('لوحة التحكم'));
  check('3) لا bg-gradient-to- عليها؟', !(await header.getAttribute('class') || '').includes('bg-gradient-to'));

  // التأكيدات السلبية: العناصر الأخرى بلا تغيير.
  const statsCard = page.locator('.bg-gradient-to-br').filter({ hasText: 'إجمالي موظفي الشعبة' });
  check('4) بطاقة الإحصائيات المتدرّجة لم تُمسّ؟', await statsCard.count() === 1);

  console.log('errors:', JSON.stringify(errors));
  const realErrors = errors.filter((e) => e !== 'PAGEERROR: Failed to fetch');
  if (realErrors.length) failed++;
  console.log(failed ? `\nFAILED ❌ (${failed})` : '\nALL PASS ✅');
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
```

- [ ] **خطوة 3: تشغيل للتأكد من الفشل الجزئي** — `node scratch/check_page_header_dashboard.js` (الفحص 4 ينجح من الآن لأنه سلبي؛ 1-3 تفشل).

- [ ] **خطوة 4: التنفيذ** — في `index.html`، مباشرة قبل السطر 9703 (`{/* تنبيه النسخ الاحتياطي التلقائي */}`)، أدرج سطراً جديداً بنفس عمق المسافة البادئة:

```jsx
                                <PageHeader icon="layout-dashboard" title="لوحة التحكم" />

```

- [ ] **خطوة 5: تشغيل للتأكد من النجاح (4/4)؛ خطوة 6: البوابتان/النسخ/الترحيل/النشر؛ خطوة 7: الالتزام** — رسالة "Add a PageHeader to the dashboard (the only screen with no existing banner to replace)".

---

### Task 8 — المهمة 8: إغلاق المرحلة

**الملفات:**
- تعديل: `scratch/run_suite.sh` (إضافة الاختبارات الستة الجديدة إلى `TESTS`)
- تعديل: `docs/superpowers/specs/2026-09-15-unified-design-language-design.md` (تحديث صفّ «1» في جدول §9)

- [ ] **خطوة 1: تسجيل الاختبارات الستة في المجموعة الكاملة**

في `scratch/run_suite.sh`، أضف إلى مصفوفة `TESTS`:
```
check_page_header_daily_status check_page_header_period_report check_page_header_units check_page_header_shared check_page_header_dashboard
```
(خمسة أسماء ملفات لا ستة — اختبار «الوحدة المختارة» من المهمة 5 يعيش داخل `check_page_header_units.js` نفسه، لا ملف مستقل.)

- [ ] **خطوة 2: تشغيل المجموعة الكاملة**

```bash
bash scratch/run_suite.sh
```
يجب أن تنتهي بـ«المجموعة: N ناجح، 0 فاشل» لكامل العدد (36 من المرحلة السابقة + 5 جديدة = 41). أي فشل: عد لمهمته، لا تكمل بفشل معلَّق.

- [ ] **خطوة 3: مراجعة Codex** (البوابة الثالثة في `CLAUDE.md` — إلزامية لكل تعديل جوهري، مستقلة القرار لا تنتظر إذناً)

راجع الفرق التراكمي الكامل لهذه المرحلة (من نقطة بداية المهمة 1 إلى الالتزام الأخير) عبر `mcp__plugin_engineering-ai-hub_engineering-ai-hub__review_code` — كود وبيانات مصطنعة فقط، لا بيانات موظفين حقيقية. زِن أي ملاحظة، اعتمدها أو وثِّق سبب رفضها، أصلح ما يستحق، والتزم الإصلاح منفصلاً إن وُجد.

- [ ] **خطوة 4: عرض اللقطات على Antigravity**

التقط لقطات لكل شاشة من التسع عند 400/1024/1500px، نهاري وليلي (نفس منهجية لقطات المرحلة 0)، واعرضها على Antigravity عبر `mcp__antigravity__ask_antigravity` للتأكد البصري من: لا فيضان أفقي، تباين كافٍ لكل زر منقول (خصوصاً الأزرار المعدَّلة اللون في المهام 2-6)، واتساق الأيقونات مع بقية النظام.

- [ ] **خطوة 5: تحديث المواصفة**

في `docs/superpowers/specs/2026-09-15-unified-design-language-design.md`، جدول §9، صفّ «1 — ترويسات الصفحات»: أضف ملاحظة أن التنفيذ تم، مع الإشارة إلى قرار «لوحة التحكم» (إضافة لا استبدال) والإشارة إلى استبدال `bar-chart-3`↔`chart-column`، بنفس أسلوب تحديث §14 في المرحلة 0.

- [ ] **خطوة 6: الالتزام والنشر والتقرير**

```bash
git add scratch/run_suite.sh docs/superpowers/specs/2026-09-15-unified-design-language-design.md
git commit -m "$(cat <<'EOF'
Close out phase 1: register the new tests, document the rollout in the spec

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
python publish_desktop_copies.py
```

أبلغ المستخدم بعدد الالتزامات غير المرفوعة الآن، واعرض الرفع صراحة في نفس الرسالة (لا تنتظر أن يُسأل — «إتمام مرحلة» في هذا المشروع يعني عرض الرفع في التقرير نفسه).
