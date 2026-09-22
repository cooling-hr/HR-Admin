import { normalizeArabicText } from '../core/arabic.js';
import { isContractEmployee } from './employees.js';
import type { Employee } from './types.js';

// دالة حساب الرتبة الوظيفية — مستقلة لإمكانية استخدامها في أي مكان
export const getJobRank = (jobTitle?: string | null): number => {
    const title = normalizeArabicText(jobTitle || '');
    let mainCategory = 0;
    if (title.includes('مهندس') || title.includes('هندس') ||
        title.includes('مبرمج') || title.includes('برمج') ||
        title.includes('فيزياوي') || title.includes('فيزيا') ||
        title.includes('كيمياوي') || title.includes('كيميا')) {
        if (title.includes('م.ر.') || (title.includes('م.') && title.includes('ر.'))) mainCategory = 1500;
        else if (title.includes('رييس') || title.includes('ر.')) mainCategory = 1900;
        else if (title.includes('م.')) mainCategory = 1050;
        else mainCategory = 1200;
    // مدير قبل فني — لأن "مدير فني" يحتوي على كلمة "فني"
    } else if (title.includes('مدير')) {
        if (title.includes('م.')) mainCategory = 980;
        else mainCategory = 1000;
    // ملاحظ قبل فني — لأن "ملاحظ فني" يحتوي على كلمة "فني"
    } else if (title.includes('ملاحظ')) {
        if (title.includes('م.ر.') || (title.includes('م.') && title.includes('ر.'))) mainCategory = 735;
        else if (title.includes('رييس') || title.includes('ر.')) mainCategory = 770;
        else if (title.includes('م.')) mainCategory = 720;
        else mainCategory = 750;
    // فني النقي فقط (بعد استثناء مدير وملاحظ)
    } else if (title.includes('فني')) {
        mainCategory = title.includes('م.') ? 750 : 800;
    } else if (title.includes('حرفي') || title.includes('حرف') ||
               title.includes('ميكانيك') || title.includes('كهربائي') || title.includes('كهرباء')) {
        if (title.includes('م.ر.') || (title.includes('م.') && title.includes('ر.'))) mainCategory = 720;
        else if (title.includes('رييس') || title.includes('ر.')) mainCategory = 725;
        else if (title.includes('اول')) mainCategory = 710;
        else mainCategory = 700;
    } else if (title.includes('عقد'))   { mainCategory = 100;
    } else if (title.includes('كاتب'))  { mainCategory = 600;
    } else if (title.includes('عامل'))  { mainCategory = 500;
    } else { mainCategory = 400; }
    let rank = 0;
    if (title.includes('اقدم اول')) rank = 30;
    else if (title.includes('اقدم')) rank = 20;
    else if (title.includes('اول')) rank = 10;
    return mainCategory + rank;
};

export const sortByJobNumber = (arr: Employee[]): Employee[] => {
    // تنظيف الرقم الوظيفي (إزالة المسافات والأحرف غير الرقمية)
    const cleanJobNumber = (num?: unknown): string => String(num || '').trim().replace(/\D/g, '');
    const hasPriority = (s: Employee): boolean => s.globalPriorityRank != null;

    // من يحمل globalPriorityRank يظهر أولاً دائماً (الأصغر أولاً)
    const priorityItems = arr.filter(hasPriority);

    // فصل العقود عن الباقي
    const contracts = arr.filter(s => !hasPriority(s) && isContractEmployee(s));

    const regularItems = arr.filter(s => !hasPriority(s) && !isContractEmployee(s));

    // ترتيب-فرعي بالرقم الوظيفي عند تساوي الأولوية (رتبتان مكرَّرتان خطأً) لضمان ترتيب ثابت
    priorityItems.sort((a, b) => {
        const diff = (a.globalPriorityRank ?? 0) - (b.globalPriorityRank ?? 0);
        if (diff !== 0) return diff;
        return (parseInt(cleanJobNumber(a.jobNumber)) || 999999) - (parseInt(cleanJobNumber(b.jobNumber)) || 999999);
    });

    // ترتيب الباقي حسب الرقم الوظيفي (من الأصغر للأكبر)
    regularItems.sort((a, b) => {
        const numA = parseInt(cleanJobNumber(a.jobNumber)) || 999999;
        const numB = parseInt(cleanJobNumber(b.jobNumber)) || 999999;
        return numA - numB;
    });
    
    // ترتيب العقود حسب الرقم الوظيفي
    contracts.sort((a, b) => {
        const numA = parseInt(cleanJobNumber(a.jobNumber)) || 999999;
        const numB = parseInt(cleanJobNumber(b.jobNumber)) || 999999;
        return numA - numB;
    });
    
    // الأولويات أولاً، ثم الموظفين العاديين، ثم العقود في النهاية
    return [...priorityItems, ...regularItems, ...contracts];
};

// دالة الترتيب الهرمي حسب العنوان الوظيفي (للوحدات)
export const sortByJobTitleHierarchy = (arr: Employee[], unitName: string = ''): Employee[] => {
    const cleanJobNumber = (num?: unknown): string => String(num || '').trim().replace(/\D/g, '');

    // ترتيب-فرعي بالرقم الوظيفي عند تساوي الأولوية (رتبتان مكرَّرتان خطأً) لضمان ترتيب ثابت
    const byRankThenJobNumber = (rankKey: 'globalPriorityRank' | 'unitPriorityRank') => (a: Employee, b: Employee) => {
        const diff = (a[rankKey] ?? 0) - (b[rankKey] ?? 0);
        if (diff !== 0) return diff;
        return (parseInt(cleanJobNumber(a.jobNumber)) || 999999) - (parseInt(cleanJobNumber(b.jobNumber)) || 999999);
    };

    // فصل الأولويات العامة (globalPriorityRank — تسبق كل الوحدات)
    const generalPriorityItems = arr.filter(s => s.globalPriorityRank != null);
    let remainingItems = arr.filter(s => s.globalPriorityRank == null);
    generalPriorityItems.sort(byRankThenJobNumber('globalPriorityRank'));

    // فصل أولويات الوحدة (unitPriorityRank — تسبق باقي موظفي نفس الوحدة فقط،
    // و arr هنا أصلاً مُقتصرة على موظفي وحدة واحدة عبر استدعاء sortByUnit)
    let unitPriorityItems: Employee[] = [];
    if (unitName) {
        unitPriorityItems = remainingItems.filter(s => s.unitPriorityRank != null);
        unitPriorityItems.sort(byRankThenJobNumber('unitPriorityRank'));
        remainingItems = remainingItems.filter(s => s.unitPriorityRank == null);
    }

    const getJobRank = (jobTitle?: string | null): number => {
        const title = normalizeArabicText(jobTitle);
        let mainCategory = 0;
        
        if (title.includes('مهندس') || title.includes('هندس') || 
            title.includes('مبرمج') || title.includes('برمج') ||
            title.includes('فيزياوي') || title.includes('فيزيا') ||
            title.includes('كيمياوي') || title.includes('كيميا')) {
            if (title.includes('م.ر.') || (title.includes('م.') && title.includes('ر.'))) {
                mainCategory = 1500;
            } else if (title.includes('رييس') || title.includes('ر.')) {
                mainCategory = 1900;
            } else if (title.includes('م.')) {
                mainCategory = 1050;
            } else {
                mainCategory = 1200;
            }
        // مدير قبل فني — لأن "مدير فني" يحتوي "فني"
        } else if (title.includes('مدير')) {
            if (title.includes('م.')) mainCategory = 980;
            else mainCategory = 1000;
        // ملاحظ قبل فني — لأن "ملاحظ فني" يحتوي "فني"
        } else if (title.includes('ملاحظ')) {
            if (title.includes('م.ر.') || (title.includes('م.') && title.includes('ر.'))) {
                mainCategory = 735;
            } else if (title.includes('رييس') || title.includes('ر.')) {
                mainCategory = 770;
            } else if (title.includes('م.')) {
                mainCategory = 720;
            } else {
                mainCategory = 750;
            }
        // فني النقي فقط (بعد استثناء مدير وملاحظ)
        } else if (title.includes('فني')) {
            if (title.includes('م.')) {
                mainCategory = 750;
            } else {
                mainCategory = 800;
            }
        } else if (title.includes('حرفي') || title.includes('حرف')) {
            if (title.includes('م.ر.') || (title.includes('م.') && title.includes('ر.'))) {
                mainCategory = 720; // م.ر.حرفيين (معاون رئيس الحرفيين)
            } else if (title.includes('رييس') || title.includes('ر.')) {
                mainCategory = 725; // ر.حرفيين (رئيس الحرفيين)
            } else if (title.includes('اول')) {
                mainCategory = 710; // حرفي أول
            } else {
                mainCategory = 700; // حرفي
            }
        } else if (title.includes('ميكانيك')) {
            if (title.includes('م.ر.') || (title.includes('م.') && title.includes('ر.'))) {
                mainCategory = 720; // م.ر.ميكانيك (معاون رئيس)
            } else if (title.includes('رييس') || title.includes('ر.')) {
                mainCategory = 725; // ر.ميكانيك
            } else if (title.includes('اول')) {
                mainCategory = 710; // ميكانيك أول
            } else {
                mainCategory = 700; // ميكانيك
            }
        } else if (title.includes('كهربائي') || title.includes('كهرباء')) {
            if (title.includes('م.ر.') || (title.includes('م.') && title.includes('ر.'))) {
                mainCategory = 720; // م.ر.كهربائي (معاون رئيس)
            } else if (title.includes('رييس') || title.includes('ر.')) {
                mainCategory = 725; // ر.كهربائي
            } else if (title.includes('اول')) {
                mainCategory = 710; // كهربائي أول
            } else {
                mainCategory = 700; // كهربائي
            }
        } else if (title.includes('عقد')) {
            mainCategory = 100;
        } else if (title.includes('كاتب')) {
            mainCategory = 600;
        } else if (title.includes('عامل')) {
            mainCategory = 500;
        } else {
            mainCategory = 400;
        }
        
        let rank = 0;
        if (title.includes('اقدم اول')) rank = 30;
        else if (title.includes('اقدم')) rank = 20;
        else if (title.includes('اول')) rank = 10;
        
        return mainCategory + rank;
    };
    
    // ترتيب الباقي حسب الهرمية
    remainingItems.sort((a, b) => {
        const rankA = getJobRank(a.jobTitle);
        const rankB = getJobRank(b.jobTitle);
        if (rankA !== rankB) return rankB - rankA;
        const numA = parseInt(cleanJobNumber(a.jobNumber)) || 999999;
        const numB = parseInt(cleanJobNumber(b.jobNumber)) || 999999;
        return numA - numB;
    });
    
    // الترتيب النهائي: أولويات عامة → مسؤولين الوحدة → الباقي
    return [...generalPriorityItems, ...unitPriorityItems, ...remainingItems];
};

// دالة الترتيب حسب الوحدات (لتبويبة "الكل")
// دالة لضمان أن حاملي globalPriorityRank يكونون في البداية دائماً
export const ensureTopTwo = (arr: Employee[]): Employee[] => {
    const cleanJobNumber = (num?: unknown): string => String(num || '').trim().replace(/\D/g, '');
    const topEmployees = arr.filter(emp => emp.globalPriorityRank != null);
    const otherEmployees = arr.filter(emp => emp.globalPriorityRank == null);

    // ترتيب-فرعي بالرقم الوظيفي عند تساوي الأولوية (رتبتان مكرَّرتان خطأً) لضمان ترتيب ثابت
    topEmployees.sort((a, b) => {
        const diff = (a.globalPriorityRank ?? 0) - (b.globalPriorityRank ?? 0);
        if (diff !== 0) return diff;
        return (parseInt(cleanJobNumber(a.jobNumber)) || 999999) - (parseInt(cleanJobNumber(b.jobNumber)) || 999999);
    });

    return [...topEmployees, ...otherEmployees];
};

export const sortByUnit = (arr: Employee[]): Employee[] => {
    // ترتيب الوحدات المطلوب
    const unitOrder = [
        'مقر الشعبة',
        'تبريد باب الزبير',
        'ورشة التبريد',
        'تبريد المكينة',
        'تبريد نهر بن عمر',
        'تبريد المركز الثقافي'
    ];
    
    // تجميع الموظفين حسب الوحدة
    const byUnit: Record<string, Employee[]> = {};
    unitOrder.forEach(unit => { byUnit[unit] = []; });
    
    arr.forEach(employee => {
        const unit = employee.unit || 'غير محدد';
        if (byUnit[unit]) {
            byUnit[unit].push(employee);
        } else {
            if (!byUnit['غير محدد']) byUnit['غير محدد'] = [];
            byUnit['غير محدد'].push(employee);
        }
    });
    
    // ترتيب الموظفين داخل كل وحدة حسب الهرمية والمسؤولية
    const result: Employee[] = [];
    unitOrder.forEach(unit => {
        if (byUnit[unit] && byUnit[unit].length > 0) {
            const sorted = sortByJobTitleHierarchy(byUnit[unit], unit);
            result.push(...sorted);
        }
    });
    
    // إضافة أي موظفين غير محددين في النهاية
    if (byUnit['غير محدد'] && byUnit['غير محدد'].length > 0) {
        result.push(...sortByJobNumber(byUnit['غير محدد']));
    }
    
    // ضمان أن أسامة ووسام في البداية دائماً
    return ensureTopTwo(result);
};
