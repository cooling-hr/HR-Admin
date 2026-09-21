import { normalizeArabicText } from '../core/arabic.js';
import { isContractEmployee } from './employees.js';

// دالة حساب الرتبة الوظيفية — مستقلة لإمكانية استخدامها في أي مكان
export const getJobRank = (jobTitle) => {
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

export const sortByJobNumber = (arr) => {
    // أسامة ووسام دائماً في البداية (حسب الرقم الوظيفي)
    const priorityNumbers = ['49158', '79944'];  // أسامة، وسام
    
    // تنظيف الرقم الوظيفي (إزالة المسافات والأحرف غير الرقمية)
    const cleanJobNumber = (num) => String(num || '').trim().replace(/\D/g, '');
    
    const priorityItems = arr.filter(s => 
        priorityNumbers.includes(cleanJobNumber(s.jobNumber))
    );
    
    // فصل العقود عن الباقي
    const contracts = arr.filter(s => 
        !priorityNumbers.includes(cleanJobNumber(s.jobNumber)) && isContractEmployee(s)
    );
    
    const regularItems = arr.filter(s => 
        !priorityNumbers.includes(cleanJobNumber(s.jobNumber)) && !isContractEmployee(s)
    );
    
    // ترتيب الأولويات: أسامة (49158) أولاً، ثم وسام (79944)
    priorityItems.sort((a, b) => {
        const indexA = priorityNumbers.indexOf(cleanJobNumber(a.jobNumber));
        const indexB = priorityNumbers.indexOf(cleanJobNumber(b.jobNumber));
        return indexA - indexB;
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
export const sortByJobTitleHierarchy = (arr, unitName = '') => {
    const priorityNumbers = ['49158', '79944'];
    const cleanJobNumber = (num) => String(num || '').trim().replace(/\D/g, '');
    
    // أولويات خاصة حسب الوحدة (المسؤولين في كل موقع)
    const unitPriorities = {
        'تبريد باب الزبير': ['نورس', 'حسين صالح', 'اسامه عباس', 'اسيل'],
        'ورشة التبريد': ['756873', '656698', '722609'], // أمين، سرى، نهلة (بالأرقام)
        'تبريد المركز الثقافي': ['حازم', 'سناء', 'حسن'],
        'تبريد المكينة': ['93289', '612456', '698636', '642231', '752894'] // فوزي، محمد عيسى، ايار، محمد ريسان، ذكاء
    };
    
    // فصل الأولويات العامة (أسامة ووسام)
    const generalPriorityItems = arr.filter(s => priorityNumbers.includes(cleanJobNumber(s.jobNumber)));
    let remainingItems = arr.filter(s => !priorityNumbers.includes(cleanJobNumber(s.jobNumber)));
    
    // ترتيب الأولويات العامة
    generalPriorityItems.sort((a, b) => {
        const indexA = priorityNumbers.indexOf(cleanJobNumber(a.jobNumber));
        const indexB = priorityNumbers.indexOf(cleanJobNumber(b.jobNumber));
        return indexA - indexB;
    });
    
    // فصل أولويات الوحدة (المسؤولين)
    let unitPriorityItems = [];
    if (unitName && unitPriorities[unitName]) {
        const priorityNames = unitPriorities[unitName];
        
        // استخراج المسؤولين حسب الترتيب
        priorityNames.forEach(priorityName => {
            const normalizedPriority = normalizeArabicText(priorityName);
            
            // البحث بمرونة: يطابق الرقم الوظيفي أو الاسم
            const found = remainingItems.find(s => {
                const normalizedName = normalizeArabicText(s.name);
                const cleanedJobNum = cleanJobNumber(s.jobNumber);
                
                // يطابق إذا:
                // 1. الرقم الوظيفي يطابق
                if (cleanedJobNum === priorityName) return true;
                
                // 2. الاسم المطلوب جزء من الاسم الكامل
                if (normalizedName.includes(normalizedPriority)) return true;
                
                // 3. أول كلمة من الاسم تطابق
                if (normalizedPriority.includes(normalizedName.split(' ')[0])) return true;
                
                return false;
            });
            
            if (found) {
                unitPriorityItems.push(found);
            }
        });
        
        // إزالة المسؤولين من القائمة الرئيسية
        remainingItems = remainingItems.filter(s => 
            !unitPriorityItems.some(p => p.id === s.id)
        );
    }
    
    const getJobRank = (jobTitle) => {
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
// دالة لضمان أن أسامة (49158) ووسام (79944) يكونون في البداية دائماً
export const ensureTopTwo = (arr) => {
    const topJobNumbers = ['49158', '79944'];
    const topEmployees = [];
    const otherEmployees = [];
    
    arr.forEach(emp => {
        if (topJobNumbers.includes(emp.jobNumber)) {
            topEmployees.push(emp);
        } else {
            otherEmployees.push(emp);
        }
    });
    
    // ترتيب الموظفين الأوائل: أسامة أولاً، ووسام ثانياً
    topEmployees.sort((a, b) => {
        return topJobNumbers.indexOf(a.jobNumber) - topJobNumbers.indexOf(b.jobNumber);
    });
    
    return [...topEmployees, ...otherEmployees];
};

export const sortByUnit = (arr) => {
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
    const byUnit = {};
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
    const result = [];
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
