import { normalizeArabicText } from '../core/arabic.js';

// موظفو العقود على صنفين: "عقد 315" و"عقد المحافظة" — والسجلات القديمة بعنوان "عقد" وحده
// لا تزال قائمة. لذا يُعرَّف العقد بورود كلمة "عقد" في العنوان لا بمطابقتها حرفياً،
// وإلا خرج كل عقد مصنَّف من تبويب العقود ومن الإحصاءات وعُدّ موظفاً اعتيادياً.
export const CONTRACT_TITLES = ['عقد 315', 'عقد المحافظة'];

export const isContractEmployee = (s) => normalizeArabicText(s && s.jobTitle).includes('عقد');

// نوع العقد كما يُعرض ويُعدّ؛ العقود القديمة غير المصنَّفة تُجمَع تحت "غير مصنّف"
export const contractTypeOf = (s) => {
    if (!isContractEmployee(s)) return null;
    const t = normalizeArabicText(s.jobTitle);
    if (t.includes('315')) return 'عقد 315';
    if (t.includes('محافظه')) return 'عقد المحافظة';
    return 'غير مصنّف';
};

export const getMissingFields = (emp) => {
    const missing = [];
    if (!emp.jobNumber || !emp.jobNumber.trim()) missing.push('الرقم الوظيفي');
    if (!emp.jobTitle || !emp.jobTitle.trim()) missing.push('العنوان الوظيفي');
    if (!emp.birthDate || !emp.birthDate.trim()) missing.push('التولد');
    if (!emp.hireDate || !emp.hireDate.trim()) missing.push('تاريخ التعيين');
    if (!emp.education || !emp.education.trim()) missing.push('التحصيل الدراسي');
    if (!emp.bank || !emp.bank.trim()) missing.push('التوطين');
    if (!emp.mobile || !emp.mobile.trim()) missing.push('النقال');
    if (!emp.workType || !emp.workType.trim()) {
        missing.push('طبيعة العمل');
    } else if (emp.workType === 'مناوب' && (!emp.squad || !emp.squad.trim())) {
        missing.push('الوجبة');
    }
    return missing;
};
