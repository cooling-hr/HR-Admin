import type { PeriodType } from './types.js';

// 4 قناني/يوم من أيار حتى أيلول، وقنينتان من تشرين الأول حتى نيسان
export const getWaterSeasonalRate = (monthStr: string): number => {
    const m = parseInt(monthStr.split('-')[1], 10);
    return (m >= 5 && m <= 9) ? 4 : 2;
};

// الدورة والإيفاد يُخصمان من قائمة الشهر التالي لا من شهرهما: قائمة الشهر تُرفع قبل بدايته،
// فدورة تقع فيه لا تُحذف منها بعد إرسالها (قرار أسامة 2026-10-18)
export const WATER_NEXT_MONTH_TYPES: PeriodType[] = ['في دورة', 'إيفاد'];

export const previousMonthStr = (monthStr: string): string => {
    const [y, m] = monthStr.split('-').map(Number);
    return m === 1 ? (y - 1) + '-12' : y + '-' + String(m - 1).padStart(2, '0');
};

export const WATER_LEAVE_TALLY_TYPES: PeriodType[] = ['إجازة اعتيادية', 'إجازة بدون راتب', 'إجازة طويلة', 'إجازة أمومة', 'غياب', 'سحب يد'];

export const isShiftOnDutyStatus = (status?: string | null): boolean => status === 'دوام 24 ساعة' || status === 'دوام صباحي (12 ساعة)' || status === 'دوام مسائي (12 ساعة)';
