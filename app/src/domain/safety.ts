import type { Employee, SafetyStatus } from './types.js';

export const getSafetyStatus = (deliveryDate?: string | null): SafetyStatus => {
    if (!deliveryDate) return { label: '❌ غير مجهز سابقاً', type: 'due-never', color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
    const delivery = new Date(deliveryDate + 'T00:00:00');
    if (isNaN(delivery.getTime())) return { label: '❌ غير مجهز سابقاً', type: 'due-never', color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
    
    const now = new Date();
    // التأكيدان يُمحيان عند الترجمة فالناتج Math.abs(now - delivery) حرفياً؛ TypeScript وحدها
    // ترفض طرح تاريخين، وتحويل التعبير إلى getTime() تغيير في النص لا داعي له هنا.
    const diffTime = Math.abs((now as unknown as number) - (delivery as unknown as number));
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375));
    
    // البدلة: سنة واحدة (12 شهر) والإنذار المبكر قبل شهرين (10 أشهر)
    // حذاء السلامة: سنتين (24 شهر) والإنذار المبكر قبل شهرين (22 شهر)
    
    if (diffMonths >= 24) {
        // متأخر التجديد في كليهما
        return { label: `❌ متأخر التجديد (بدلة + حذاء) - منذ ${diffMonths} شهر`, type: 'due-both', color: 'bg-red-50 text-red-700 border-red-200 animate-pulse font-bold' };
    } else if (diffMonths >= 22) {
        // يستحق التجهيز الجديد للحذاء والبدلة متأخرة
        return { label: `⚠️ يستحق التجهيز الجديد (حذاء + بدلة) - الاستحقاق قريب`, type: 'alert-both', color: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-bold' };
    } else if (diffMonths >= 12) {
        // متأخر البدلة فقط، الحذاء مجهز (متبقي له أكثر من شهرين)
        const shoesRemaining = 24 - diffMonths;
        return { label: `❌ متأخر البدلة (منذ ${diffMonths} شهر) | حذاء مجهز (متبقي ${shoesRemaining} شهر)`, type: 'due-uniform', color: 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse font-bold' };
    } else if (diffMonths >= 10) {
        // إنذار مبكر للبدلة، الحذاء مجهز
        const uniformRemaining = 12 - diffMonths;
        const shoesRemaining = 24 - diffMonths;
        return { label: `⚠️ يستحق التجهيز (البدلة) - متبقي ${uniformRemaining} شهر | حذاء مجهز (${shoesRemaining} شهر)`, type: 'alert-uniform', color: 'bg-amber-50 text-amber-700 border-amber-200 font-bold' };
    } else {
        // كلاهما مجهز بشكل تام وآمن
        const uniformRemaining = 12 - diffMonths;
        const shoesRemaining = 24 - diffMonths;
        return { label: `✅ مجهز ومحمي (بدلة متبقي ${uniformRemaining} شهر | حذاء متبقي ${shoesRemaining} شهر)`, type: 'ok', color: 'bg-green-50 text-green-700 border-green-200 font-bold' };
    }
};

export const isInSafetyRoster = (s: Employee): boolean => s.gender === 'ذكر' && s.status === 'نشط' && !s.safetyRosterExempt;

// «مستحق التجديد» من جُهِّز سابقاً وحان تجديده أو اقترب؛ من لم يُجهَّز قط فئة مستقلة.
// كانا فلتراً واحداً، وحين يكون أغلب الملاك بلا تاريخ تجهيز يبقى الجدول كما هو تقريباً فيبدو الزر معطلاً
export const safetyFilterGroup = (s: Employee): 'ok' | 'never' | 'renewal' => {
    const type = getSafetyStatus(s.lastSafetyDelivery).type;
    return type === 'ok' ? 'ok' : type === 'due-never' ? 'never' : 'renewal';
};
