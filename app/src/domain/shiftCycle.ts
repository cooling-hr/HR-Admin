// تاريخ مرجع الدورة مشترك بين المناوبتين، ولكل منهما وجبتها المرجعية. فتغيير التاريخ عند معايرة نوع يزيح دورة
// النوع الآخر ما لم تُحسب وجبته في التاريخ الجديد وتُحفظ معه. دورة كل نوع 4 أيام، ومعادلاتها هنا مطابقة
// لـgetShiftCycleStatus وgetSquadsOnDuty.

import { getDaysBetweenDates } from '../core/dates.js';

const TRIPLE_SQUADS = ['A', 'B', 'C', 'D'];
// الوجبة الصباحية في كل يوم من أيام الدورة الثنائية: A ثم C ثم D ثم B
const DOUBLE_MORNING_SQUADS = ['A', 'C', 'D', 'B'];

const cycleIndex = (start: number, diffDays: number): number => ((start + diffDays) % 4 + 4) % 4;

export type ShiftAnchors = { anchorDate: string; threeSquad: string; twoSquad: string };

export const recalibrateAnchors = (current: ShiftAnchors, type: '24h' | '12h', squad: string, date: string): ShiftAnchors => {
    const diffDays = getDaysBetweenDates(date, current.anchorDate);
    const tripleIdx = TRIPLE_SQUADS.indexOf(current.threeSquad);
    // الوجبة غير المعروفة تبقى كما هي في الثلاثية، وتُعامَل A في الثنائية، كما في معادلتي الدورة
    const threeSquad = tripleIdx === -1 ? current.threeSquad : TRIPLE_SQUADS[cycleIndex(tripleIdx, diffDays)];
    const twoSquad = DOUBLE_MORNING_SQUADS[cycleIndex(Math.max(DOUBLE_MORNING_SQUADS.indexOf(current.twoSquad), 0), diffDays)];
    return {
        anchorDate: date,
        threeSquad: type === '24h' ? squad : threeSquad,
        twoSquad: type === '12h' ? squad : twoSquad,
    };
};
