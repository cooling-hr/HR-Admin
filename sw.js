// قشرة تخزين بسيطة لتطبيق الهاتف: تُبقي التطبيق قابلاً للفتح بلا إنترنت،
// بشبكة أولاً ثم تخزين مؤقت عند التعذّر — لا حبس أبداً على نسخة قديمة متى توفرت الشبكة.
// يقتصر التخزين والاعتراض على ملفات القشرة الأربعة المعروفة فقط (بالتنقّل أو بمطابقة تامة
// للرابط)؛ أي طلب آخر — بما فيه Firebase أو أي تطبيق آخر يشارك نفس أصل GitHub Pages —
// يمرّ دون أي تدخل، وحذف الأرشيف القديم عند التفعيل مقيَّد ببادئة اسم هذا التطبيق وحده.
const CACHE_PREFIX = 'hr-admin-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v1';
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
    event.respondWith(
        fetch(req)
            .then((response) => {
                if (response.ok) {
                    event.waitUntil(
                        caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, response.clone())).catch(() => {})
                    );
                }
                return response;
            })
            .catch(() => caches.open(CACHE_NAME).then((cache) => cache.match(cacheKey)))
    );
});
