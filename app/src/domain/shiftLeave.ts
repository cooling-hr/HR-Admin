// إجازة المناوب تمتد إلى أيام استراحته (قرار أسامة 2026-10-30). الدورة الثنائية: صباحي، مسائي، استراحتان؛
// والثلاثية: 24 ساعة ثم ثلاث استراحات. يقرّر آخرُ يوم إجازة قبل الاستراحة:
// - إجازة في يوم المسائي (ثنائية) أو يوم الـ24 ساعة (ثلاثية): كل الاستراحات بعده إجازة في الموقف اليومي نفسه.
// - إجازة في يوم الصباحي (ثنائية) يليها مسائي يداومه: أول استراحة بعده تبقى استراحة (N في الاستمارة)
//   وتُضاف يوماً إلى عداد الإجازات وعدّ قائمة الماء، مع ملاحظة في كشف الموقف اليومي.
// الإجازة المعتبرة تعديل يومي فقط (الفترة المؤرَّخة تنتهي بتاريخ عودتها)، وكل أنواعها عدا الزمنية.
// والامتداد يعبر حدّ الشهر (تصحيح أسامة 2026-11-01): ما وقع من الاستراحة في الشهر اللاحق يُحسب فيه. موقف مُدخل في يوم الاستراحة يغلب (يفحصه المستدعي).

import { getArabicDayName } from '../core/dates.js';

const SHIFT_REST = 'استراحة مناوبة';
const SHIFT_MORNING = 'دوام صباحي (12 ساعة)';
const SHIFT_EVENING = 'دوام مسائي (12 ساعة)';

export type ShiftLeaveCarry = { type: string; mode: 'leave' | 'counted'; from: string };

export const isCarriedLeaveType = (status: unknown): status is string =>
    typeof status === 'string' && status.includes('إجازة') && status !== 'إجازة زمنية';

const addDaysStr = (dateStr: string, n: number): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

export const shiftLeaveCarry = (
    dateStr: string,
    opts: { isThreeShift: boolean; cycleStatus: (d: string) => string; overrideOf: (d: string) => unknown; workedOn: (d: string) => boolean },
): ShiftLeaveCarry | null => {
    const { isThreeShift, cycleStatus, overrideOf, workedOn } = opts;
    if (cycleStatus(dateStr) !== SHIFT_REST) return null;
    // أقرب يوم دوام قبل الاستراحة: يوم أو يومان في الثنائية، وحتى ثلاثة في الثلاثية
    for (let back = 1; back <= 3; back++) {
        const d = addDaysStr(dateStr, -back);
        const natural = cycleStatus(d);
        if (natural === SHIFT_REST) continue;
        const ov = overrideOf(d);
        if (isCarriedLeaveType(ov)) return { type: ov, mode: 'leave', from: d };
        // الإجازة في الصباحي تخص أول استراحة وحدها، والمسائي بينهما داومه فعلاً (لا غياب ولا دورة فيه)
        if (isThreeShift || natural !== SHIFT_EVENING || back !== 1 || !workedOn(d)) return null;
        const m = addDaysStr(d, -1);
        const ovM = overrideOf(m);
        if (cycleStatus(m) === SHIFT_MORNING && isCarriedLeaveType(ovM)) {
            return { type: ovM, mode: 'counted', from: m };
        }
        return null;
    }
    return null;
};

// نص الملاحظة بصياغة أسامة
export const shiftLeaveCarryNote = (carry: ShiftLeaveCarry | null): string =>
    carry && carry.mode === 'counted'
        ? `ضوعفت الإجازة لأن يوم ${getArabicDayName(carry.from)} ${carry.from} صادف إجازة من مناوبة صباحية`
        : '';
