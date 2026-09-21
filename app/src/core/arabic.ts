// توحيد الأرقام العربية-الهندية والفارسية الممتدة إلى لاتينية عند أي مقارنة أو تخزين للرقم
// الوظيفي — نفس الرقم بخط أرقام مختلف كان يُعامَل كموظفَين مختلفين في كل مطابقة (دمج، حذف، إكسل)
export const ARABIC_INDIC_DIGITS: string = '٠١٢٣٤٥٦٧٨٩';

export const EXTENDED_ARABIC_INDIC_DIGITS: string = '۰۱۲۳۴۵۶۷۸۹';

// دالة توحيد الأحرف العربية (الهمزات والحركات)
export const normalizeArabic = (text?: unknown): string => {
    if (!text) return '';
    return String(text)
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\u200E\u200F\uFEFF\u061C]/g, '')
        .replace(/[\u064B-\u0652]/g, '')
        .replace(/\u0640/g, '')
        .replace(/[أإآءئؤ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .toLowerCase()
        .trim();
};

export const normalizeArabicForSearch = (text?: unknown): string => {
    return normalizeArabic(text).replace(/\s+/g, '');
};

export const normalizeJobNumber = (v?: unknown): string => String(v || '').trim()
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXTENDED_ARABIC_INDIC_DIGITS.indexOf(d)));

// دالة التخمين الذكي للجنس من الاسم
export const guessGender = (name?: string | null): string => {
    if (!name) return 'ذكر';
    const normalizedName = normalizeArabic(name.trim().split(/\s+/)[0]);
    const femaleNames = ['فاطمه', 'زينب', 'مريم', 'ساره', 'نور', 'سناء', 'اسيل', 'نهله', 'ايار', 'ذكاء', 'رغد', 'شهد', 'ريم', 'دعاء', 'الاء', 'اسراء', 'سجي', 'هبه', 'ندي', 'لمي', 'ايمان', 'خديجه', 'عائشه', 'حفصه', 'رقيه', 'سكينه'];
    if (femaleNames.some(n => normalizedName.includes(normalizeArabic(n)))) return 'أنثى';
    if (normalizedName.endsWith('ه') || normalizedName.endsWith('اء') || normalizedName.endsWith('ي')) return 'أنثى';
    return 'ذكر';
};

// دالة توحيد قيم الجنس من Excel
export const normalizeGender = (genderValue?: string | null): string => {
    if (!genderValue) return '';
    const normalized = normalizeArabic(genderValue.trim());
    
    // توحيد الإناث: إناث، انثى، أنثى → أنثى
    if (normalized.includes('انث')) return 'أنثى';
    
    // توحيد الذكور: ذكور، ذكر → ذكر
    if (normalized.includes('ذكر')) return 'ذكر';
    
    return genderValue.trim(); // إرجاع القيمة الأصلية إذا لم تطابق
};

// دالة استخراج الاسم الثلاثي
export const getThreeName = (fullName?: string | null): string => {
    const parts = (fullName || '').trim().split(' ').filter(p => p);
    return parts.slice(0, 3).join(' ');
};

export const getTripleName = (fullName?: string | null): string => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 3) return fullName.trim();
    return parts.slice(0, 3).join(' ');
};

// دالة توحيد النصوص العربية (لحل مشكلة الهمزات والتاء المربوطة)
export const normalizeArabicText = (text?: string | null): string => {
    if (!text) return '';
    return text
        .normalize('NFKC')                             // توحيد ترميز يونيكود ومعالجة أشكال العرض (Shaped Presentation Forms)
        .replace(/[\u064B-\u0652]/g, '')             // إزالة الحركات والتنوين والسكون والشدة
        .replace(/\u0640/g, '')                        // إزالة الكشيدة أو التطويل الحرفي
        .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '') // إزالة كافة الحروف غير المرئية والتحكمية
        .replace(/[أإآٱ]/g, 'ا')                       // توحيد الألف بكل أشكالها
        .replace(/[ىيئي]/g, 'ي')                       // توحيد الياء والألف المقصورة والياء الفارسية والهمزة على النبرة
        .replace(/[كک]/g, 'ك')                         // توحيد الكاف العربية والفارسية
        .replace(/ة/g, 'ه')                            // توحيد التاء المربوطة والهاء
        .replace(/\s+/g, ' ')                          // توحيد المسافات
        .trim()
        .toLowerCase();
};

// تحويل رقم صحيح (0-999) إلى كلمات عربية — يُستخدَم فقط لعدد آلاف الدنانير هنا
export const ARABIC_ONES: string[] = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];

export const ARABIC_TEENS: string[] = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

export const ARABIC_TENS: string[] = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];

export const ARABIC_HUNDREDS: string[] = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

export const numberChunkToArabicWords = (n: number): string => {
    if (n <= 0) return '';
    const parts: string[] = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) parts.push(ARABIC_HUNDREDS[h]);
    if (rem > 0 && rem < 10) parts.push(ARABIC_ONES[rem]);
    else if (rem >= 10 && rem < 20) parts.push(ARABIC_TEENS[rem - 10]);
    else if (rem >= 20) {
        const tens = Math.floor(rem / 10);
        const ones = rem % 10;
        parts.push(ones > 0 ? (ARABIC_ONES[ones] + ' و' + ARABIC_TENS[tens]) : ARABIC_TENS[tens]);
    }
    return parts.join(' و');
};

// عدد الأيام المثبَّتة بصيغته العربية بعد «امسح»: يوماً واحداً، يومين، 3–10 أيام، 11 فأكثر يوماً
export const arabicManualDaysCount = (n: number): string => n === 1 ? 'يوماً واحداً مثبَّتاً'
    : n === 2 ? 'يومين مثبَّتين'
    : (n >= 3 && n <= 10) ? `${n} أيام مثبَّتة`
    : `${n} يوماً مثبَّتاً`;

// عدد الساعات بصيغته العربية: ساعة واحدة، ساعتان، 3–10 ساعات، 11 فأكثر ساعة
export const arabicHoursCount = (value?: unknown): string => {
    const n = Number(value);
    return n === 1 ? 'ساعة واحدة' : n === 2 ? 'ساعتان' : (n >= 3 && n <= 10) ? `${n} ساعات` : `${n} ساعة`;
};

// دالة تنسيق رقم الهاتف النقال لتسهيل القراءة (مثل: 0420 329 0770)
export const formatMobileNumber = (phoneStr?: string | null): string => {
    if (!phoneStr || phoneStr === 'غير مسجل') return 'غير مسجل';
    const digits = String(phoneStr).replace(/\D/g, '');
    if (digits.length === 11) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return phoneStr;
};

// إصلاح رقم الهاتف (إضافة 0 إذا كان مفقود)
export const fixPhoneNumber = (phone?: unknown): string => {
    if (!phone) return '';
    const phoneStr = String(phone).trim();
    
    // إذا كان 10 أرقام ويبدأ بـ 7، أضف 0
    if (phoneStr.length === 10 && phoneStr.startsWith('7')) {
        return '0' + phoneStr;
    }
    
    return phoneStr;
};

// ===== دوال البحث الموحد =====
// توسيع الاختصارات: ر=رئيس م=معاون ليتمكن البحث من إيجاد المدخلين
export const expandAbbrev = (q: string): string => {
    let expanded = q;
    if (q === 'ر' || q === 'ر.') expanded = 'رييس';
    else if (q === 'م' || q === 'م.') expanded = 'معاون';
    else if (q.startsWith('ر.') || q.startsWith('ر ')) expanded = 'رييس ' + q.slice(2);
    else if (q.startsWith('م.ر.') || q.startsWith('م ر ')) expanded = 'معاون رييس ' + q.slice(4);
    else if (q.startsWith('م.') || q.startsWith('م ')) expanded = 'معاون ' + q.slice(2);
    return expanded;
};
