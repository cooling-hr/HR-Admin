import { isLongOrMaternityLeave } from './periods.js';

// فئات أعداد الموقف اليومي لكل وحدة. كل موظف يقع في فئة واحدة، فمجموعها يساوي عدد الوحدة،
// و«أخرى» تكشف موقفاً لم يُصنَّف (مناوب بلا وجبة مثلاً) بدل أن يسقط من العدّ بصمت.
// قرار أسامة 2026-10-19: ورقة العمل والتكليف بواجب حضور، وتعذر الحضور فئة مستقلة لا غياب
// (من يحضر رغمه يُغيَّر موقفه إلى دوام صباحي). والإجازة الزمنية حضور لأنه داوم جزءاً من اليوم.
export type DailyCategory = 'present' | 'leave' | 'course' | 'mission' | 'detached' | 'rest' | 'excused' | 'absent' | 'suspended' | 'other';

export const DAILY_CATEGORY_ORDER: DailyCategory[] = ['present', 'leave', 'course', 'mission', 'detached', 'rest', 'excused', 'absent', 'suspended', 'other'];

const PRESENT_STATUSES = ['دوام صباحي', 'حضور فعلي', 'دوام صباحي (12 ساعة)', 'دوام مسائي (12 ساعة)', 'دوام 24 ساعة', 'ورقة عمل', 'مكلف بواجب', 'إجازة زمنية'];

// «خارج الشعبة» (detached): فئة مستقلة لمن يعمل في قسم آخر أو خرج من الخدمة (المواصفة 6.1).
// والعدة وإصابة العمل إجازة. تُفحص بأسمائها قبل فحوص الكلمات، فلا كلمة «إجازة» فيهما ولا تقع «خارج» في غير موضعها.
const DETACHED_STATUSES = ['أيام بقسم آخر', 'خارج الخدمة'];
const EXTRA_LEAVE_STATUSES = ['أيام العدة', 'إصابة عمل'];

export const dailyStatusCategory = (status?: string | null): DailyCategory => {
    const s = String(status || '');
    if (!s) return 'other';
    if (DETACHED_STATUSES.includes(s)) return 'detached';
    if (EXTRA_LEAVE_STATUSES.includes(s)) return 'leave';
    if (PRESENT_STATUSES.includes(s) || isOvertimeStatus(s) || s.includes('زمنية')) return 'present';
    // سحب اليد يُعامَل كالغياب في الإحصائيات، لكنه يُعدّ ويُسمّى باسمه في الشارات
    if (s === 'سحب يد') return 'suspended';
    if (s.includes('غياب')) return 'absent';
    if (s.includes('تعذر') || s.includes('توقف موقع')) return 'excused';
    if (s.includes('دورة')) return 'course';
    if (s.includes('إيفاد')) return 'mission';
    if (s.includes('إجازة') || s.includes('مرضية') || isLongOrMaternityLeave(s)) return 'leave';
    if (s.includes('استراحة') || s.includes('عطلة')) return 'rest';
    return 'other';
};

// الإضافي (موقف «دوام إضافي»، وساعاته في سجل مستقل) عدد فرعي من الحاضرين لا فئة، فلا يُخلّ بالمجموع
export const isOvertimeStatus = (status?: string | null): boolean => String(status || '').includes('إضافي');

export type DailyCounts = Record<DailyCategory, number> & { total: number; overtime: number };

export const countDailyCategories = (statuses: Array<string | null | undefined>): DailyCounts => {
    const counts = { present: 0, leave: 0, course: 0, mission: 0, detached: 0, rest: 0, excused: 0, absent: 0, suspended: 0, other: 0, total: 0, overtime: 0 };
    statuses.forEach(st => {
        counts[dailyStatusCategory(st)]++;
        counts.total++;
        if (isOvertimeStatus(st)) counts.overtime++;
    });
    return counts;
};
