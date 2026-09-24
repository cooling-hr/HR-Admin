// آمن لبيئة أندرويد و content:// URI لمنع الشاشة البيضاء عند حظر localStorage
const memoryStorage = {};
export const safeStorage = {
    getItem: (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
        } catch (e) {
            console.warn('localStorage getItem fallback:', e);
        }
        return memoryStorage[key] || null;
    },
    setItem: (key, val) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, val);
                return;
            }
        } catch (e) {
            console.warn('localStorage setItem fallback:', e);
        }
        memoryStorage[key] = val;
    },
    removeItem: (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
                return;
            }
        } catch (e) {
            console.warn('localStorage removeItem fallback:', e);
        }
        delete memoryStorage[key];
    },
    clear: () => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.clear();
                return;
            }
        } catch (e) {
            console.warn('localStorage clear fallback:', e);
        }
        for (const k in memoryStorage) delete memoryStorage[k];
    }
};
