// قشرة تخزين بسيطة لتطبيق الهاتف: تُبقي التطبيق قابلاً للفتح بلا إنترنت،
// بشبكة أولاً ثم تخزين مؤقت عند التعذّر أو البطء (مهلة NETWORK_TIMEOUT_MS) — لا حبس على نسخة
// قديمة: الشبكة البطيئة تفتح المخزَّن مرة واحدة، والجديدة محفوظة للفتح التالي مباشرة.
// يقتصر التخزين والاعتراض على ملفات القشرة الأربعة المعروفة فقط (بالتنقّل أو بمطابقة تامة
// للرابط)؛ أي طلب آخر — بما فيه Firebase أو أي تطبيق آخر يشارك نفس أصل GitHub Pages —
// يمرّ دون أي تدخل، وحذف الأرشيف القديم عند التفعيل مقيَّد ببادئة اسم هذا التطبيق وحده.
const CACHE_PREFIX = 'hr-admin-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v1';
const NETWORK_TIMEOUT_MS = 3000;

// كل تنقّل يُخزَّن تحت مفتاح الصفحة الرئيسية، فلا تُحفظ إلا صفحة النظام فعلاً — لا صفحة دخول
// شبكة عامة (Wi-Fi) أو صفحة خطأ تحلّ محلّها فتُفتح هي في كل فتح بلا شبكة لاحقاً
const APP_SHELL_MARKER = 'id="hr-app-source"';
const INDEX_URL = new URL('./index.html', self.location).href;
const SHELL_URLS = ['./', './index.html', './manifest.json', './icon.svg'].map((p) => new URL(p, self.location).href);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME).map((n) => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const isNavigation = req.mode === 'navigate';
    const isShellAsset = SHELL_URLS.includes(req.url);
    if (!isNavigation && !isShellAsset) return;

    const cacheKey = isNavigation ? INDEX_URL : req.url;
    const network = fetch(req).then((response) => {
        if (response.ok) {
            // نسخة تُفحَص وأخرى تُخزَّن كما وصلت تماماً — لا إعادة بناء من النص المفكوك (ترويسات الضغط)
            const toCache = response.clone();
            const toInspect = isNavigation ? response.clone() : null;
            event.waitUntil(
                (toInspect ? toInspect.text().then((body) => body.includes(APP_SHELL_MARKER)) : Promise.resolve(true))
                    .then((isShell) => isShell && caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, toCache)))
                    .catch(() => {})
            );
        }
        return response;
    });
    // يُبقي العامل حياً حتى تكتمل الشبكة ويُحدَّث المخزَّن، ولو رُدّ على الصفحة من المخزَّن قبلها
    event.waitUntil(network.catch(() => {}));

    // الشبكة أولاً، لكن بمهلة: شبكة الهاتف البطيئة (لا المنقطعة) كانت تُبقي شاشة الفتح معلّقة
    // حتى يكتمل تنزيل الصفحة كاملة. بعد المهلة تُفتح النسخة المخزَّنة، والجديدة تُحفظ في الخلفية
    // للفتح التالي. بلا نسخة مخزَّنة يُنتظر الشبكة كما كان.
    event.respondWith((async () => {
        const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS, null));
        const first = await Promise.race([network.catch(() => null), timeout]);
        // خطأ خادم (404/5xx) لا يتقدّم على نسخة مخزَّنة سليمة؛ يُعاد فقط حين لا مخزَّن
        if (first && first.ok) return first;
        const cached = await caches.open(CACHE_NAME).then((cache) => cache.match(cacheKey)).catch(() => undefined);
        return cached || first || network;
    })());
});
