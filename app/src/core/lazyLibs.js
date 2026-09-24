// مكتبات الاستيراد والتصدير (نحو 2.4MB) تُحمَّل عند أول حاجة إليها لا مع فتح التطبيق: كانت
// تُنزَّل وتُحلَّل قبل ظهور أي شيء في كل فتح — وهو ما يُبطئ الهاتف تحديداً — وأغلب مرات الفتح
// لا تصدير فيها. بعد أول تحميل تبقى في ذاكرة المتصفح (روابط بإصدار ثابت، مخزَّنة سنة كاملة).
const LAZY_LIBS = {
    xlsx: { global: 'XLSX', src: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js' },
    exceljs: { global: 'ExcelJS', src: 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js' },
    docx: { global: 'docx', src: 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js' },
    fileSaver: { global: 'saveAs', src: 'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js' }
};
const lazyLibPromises = {};
const loadLazyLib = (name) => {
    const lib = LAZY_LIBS[name];
    if (window[lib.global]) return Promise.resolve(window[lib.global]);
    if (!lazyLibPromises[name]) {
        lazyLibPromises[name] = new Promise((resolve, reject) => {
            const el = document.createElement('script');
            el.src = lib.src;
            el.async = true;
            // الفشل يمسح الوعد والوسم، فتُعاد المحاولة من الصفر عند الضغطة التالية (بعد عودة الاتصال مثلاً)
            const fail = () => { delete lazyLibPromises[name]; el.remove(); reject(new Error(name)); };
            el.onload = () => (window[lib.global] ? resolve(window[lib.global]) : fail());
            el.onerror = fail;
            document.head.appendChild(el);
        });
    }
    return lazyLibPromises[name];
};
export const ensureLibs = async (...names) => {
    try {
        await Promise.all(names.map(loadLazyLib));
        return true;
    } catch (e) {
        alert('⚠️ تعذّر تحميل مكتبة الاستيراد/التصدير — تحقّق من الاتصال بالإنترنت ثم أعد المحاولة.');
        return false;
    }
};
