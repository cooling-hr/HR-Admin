// التاريخ المحلي بصيغة YYYY-MM-DD. لا تستعمل toISOString هنا: هي تعطي
// تاريخ UTC، وبغداد +3 — فبين منتصف الليل والثالثة فجراً يكون تاريخ
// UTC هو تاريخ الأمس، فتُصنَّف فترة انتهت أمس على أنها «توشك أن تنتهي».
export const localDateStr = (input?: string | number | Date | null): string => {
    const d = (input === undefined || input === null) ? new Date() : new Date(input);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
};

// ما يلي يُبنى فوق getEmployeeDailyStatus/getEmployeeDefaultNaturalStatus أعلاه، لذا
// يُصرَّح بعدهما — استدعاء أيٍّ منهما من useMemo قبل تعريفه يُنفَّذ أثناء الرسم مباشرة
// (لا بعده كما في معالِج حدث)، فيفشل بصمت رغم نجاح بوابتي التحقق سابقاً على بيانات فارغة.
export const daysInMonth = (monthStr: string): number => {
    const [y, m] = monthStr.split('-').map(Number);
    return new Date(y, m, 0).getDate();
};

export const getDaysBetweenDates = (d1Str?: string | null, d2Str?: string | null): number => {
    if (!d1Str || !d2Str) return 0;
    const p1 = d1Str.split('-');
    const p2 = d2Str.split('-');
    const d1 = new Date(parseInt(p1[0]), parseInt(p1[1]) - 1, parseInt(p1[2]));
    const d2 = new Date(parseInt(p2[0]), parseInt(p2[1]) - 1, parseInt(p2[2]));
    return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

export const getArabicDayName = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
        const p = dateStr.split('-');
        const d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
        const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return dayNames[d.getDay()] || '';
    } catch (e) {
        return '';
    }
};

export const ARABIC_MONTH_NAMES: string[] = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];

export const getArabicMonthLabel = (monthStr: string): string => {
    const [y, m] = monthStr.split('-').map(Number);
    return ARABIC_MONTH_NAMES[m - 1] + ' / ' + y;
};

export const addMonthsClamped = (dateStr: string, months: number): string => {
    const parts = dateStr.split('-').map(Number);
    const target = new Date(parts[0], parts[1] - 1 + months, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(parts[2], lastDay));
    return localDateStr(target);
};

// formatDateToString الآن غير مطلوب لأن parseExcelDate يرجع نص مباشرة
export const formatDateToString = (dateStr: unknown): string => {
    // إذا كان نص بالفعل، نرجعه كما هو
    if (typeof dateStr === 'string') return dateStr;
    // إذا كان null أو undefined
    if (!dateStr) return '';
    return String(dateStr);
};

// تحويل تاريخ Excel إلى JavaScript Date
export const parseExcelDate = (excelDate: unknown): string | null => {
    if (!excelDate) return null;
    
    // نتوقع نص من Excel
    if (typeof excelDate === 'string') {
        const trimmed = excelDate.trim();
        
        // تنسيق YYYY/MM/DD (من Excel العربي)
        const match1 = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
        if (match1) {
            const [_, year, month, day] = match1;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // تنسيق DD/MM/YYYY
        const match2 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match2) {
            const [_, day, month, year] = match2;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // تنسيق YYYY-MM-DD (جاهز)
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        
        // محاولة أخيرة: تحويل باستخدام Date
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }
    
    return null;
};

// حساب سنوات الخدمة بدقة
export const calculateYearsOfService = (hireDate?: string | number | Date | null): number => {
    if (!hireDate) return 0;
    
    // تحويل التاريخ: إذا كان string بتنسيق YYYY-MM-DD، نحوله لـ Date
    let hire: Date;
    if (typeof hireDate === 'string') {
        // إذا كان بتنسيق YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(hireDate)) {
            hire = new Date(hireDate + 'T00:00:00');
        } else {
            // محاولة تحويل مباشرة
            hire = new Date(hireDate);
        }
    } else {
        hire = new Date(hireDate);
    }
    
    if (!hire || isNaN(hire.getTime())) return 0;
    
    const now = new Date();
    
    // حساب الفرق بالسنوات
    let years = now.getFullYear() - hire.getFullYear();
    
    // التحقق من الشهور والأيام
    const monthDiff = now.getMonth() - hire.getMonth();
    const dayDiff = now.getDate() - hire.getDate();
    
    // إذا لم يكمل السنة بعد (الشهر الحالي قبل شهر التعيين، أو نفس الشهر لكن اليوم قبل يوم التعيين)
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        years--;
    }
    
    return years;
};

// ===== المواقف اليومية والساعات الزمنية والإضافي والعطل والإعدادات في الدمج =====
// حاجة صاحب النظام: تبقى الفترات المؤرخة كلها، ويُجلب من الملف تحديث المواقف حتى اليوم.
// سطر لكل موظف في كل يوم يجمع الموقف وساعاته الزمنية والإضافي: الساعات الزمنية لا تُحتسب إلا مع موقف «إجازة زمنية».
// المطابقة بالرقم الوظيفي: المعرّفات الداخلية قد تختلف بين الجهازين، وقيمة لموظف لا يطابقه أحد تُتجاهل.
// الافتراض: ما في الملف وليس لديك مؤشَّر؛ ما لديك بقيمة أخرى بلا تأشير؛ ويوم تغطيه فترة مؤرخة لديك بنوع آخر
// بلا تأشير مع تنبيه — فالموقف اليومي يتقدّم على الفترة في العرض. العطل تُضاف ولا تُحذف، والإعدادات العامة
// بلا تأشير. لا يُحذف شيء لديك. المعرّفات والتواريخ القادمة من الملف لا تُستعمل مفاتيح في كائن عادي.
export const ISO_DAY: RegExp = /^\d{4}-\d{2}-\d{2}$/;
