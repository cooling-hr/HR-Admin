// جدول إطعام المناوبين: كتلة لكل يوم من الشهر، ولكل موقع صفّان — الأول لوجبة الصباح والثاني
// لوجبة المساء (نهر بن عمر وجبة واحدة 24 ساعة تشغل الصفّين معاً). الهيكل منقول عن استمارة
// القسم الورقية حرفياً، فلا يُغيَّر ترتيب أعمدته ولا نصوصها إلا بطلب.
//
// المخول والبديل يُختاران مرة لكل موقع ولكل وجبة (A–D) ويبقيان ثابتين: الوجبات تتناوب يومياً،
// فمخول الموقع في يوم ما هو مخول الوجبة التي تصادف دوامها ذلك اليوم.
// السجل: mealAuthorizations[الوحدة][الوجبة] = { main: معرّف المخول، alt: معرّف البديل }.

export const DUTY_MEAL_SITES: string[] = ['تبريد باب الزبير', 'تبريد المكينة', 'تبريد المركز الثقافي', 'تبريد نهر بن عمر'];
export const DUTY_MEAL_SQUADS: string[] = ['A', 'B', 'C', 'D'];
export const DUTY_MEAL_SECTION = 'التكييف والتبريد';
export const DUTY_MEAL_HEADERS: string[] = ['ت', 'الموقع', 'عدد المناوبين', 'مناوبة صباحية', 'مناوبة مسائية', 'اسم المخول', 'رقم الهاتف النقال', 'اسم البديل', 'رقم الهاتف النقال', 'القسم'];

// اسم الموقع كما يُكتب في الجدول: بلا «تبريد» في أوله
export const dutyMealSiteLabel = (unit: string): string => unit.replace(/^تبريد\s+/, '');
export const isTripleShiftSite = (unit: string): boolean => unit.includes('نهر بن عمر');

// من يغيب عن موقعه ذلك اليوم لا تُحسب له وجبة: الإجازات (عدا الزمنية) والغياب وسحب اليد
// والدورة والإيفاد والاستراحة. ما سواها (دوام، إضافي، ورقة عمل، مكلف بواجب، إجازة زمنية) حاضر.
export const isPresentForMeal = (status?: string | null): boolean => {
    const s = String(status || '');
    if (!s) return false;
    if (s === 'إجازة زمنية') return true;
    return !/إجازة|غياب|سحب يد|دورة|إيفاد|استراحة|أمومة/.test(s);
};

type Emp = { id: string; name?: string; unit?: string; squad?: string; workType?: string; mobile?: string };
type Pick = { main?: string; alt?: string };
export type MealAuthorizations = Record<string, Record<string, Pick>>;

export type MealPerson = { name: string; mobile: string } | null;
export type MealShiftRow = { squad: string; count: number; main: MealPerson; alt: MealPerson; warning: string };
export type MealSiteBlock = { unit: string; label: string; triple: boolean; total: number; rows: MealShiftRow[] };

// مناوبو موقع في وجبة بعينها — قائمة الاختيار في إعداد المخولين
export const siteSquadMembers = (staff: Emp[], unit: string, squad: string): Emp[] =>
    staff.filter(s => s.workType === 'مناوب' && String(s.unit || '').trim() === unit && s.squad === squad);

type DayDeps = {
    staff: Emp[];
    dateStr: string;
    authorizations: MealAuthorizations;
    getEmployeeDailyStatus: (emp: Emp, dateStr: string) => string;
    getSquadsOnDuty: (dateStr: string) => { triple: string; morning: string; evening: string };
};

export const buildDutyMealDay = ({ staff, dateStr, authorizations, getEmployeeDailyStatus, getSquadsOnDuty }: DayDeps): MealSiteBlock[] => {
    const onDuty = getSquadsOnDuty(dateStr);
    const person = (emp?: Emp): MealPerson => emp ? { name: emp.name || '', mobile: String(emp.mobile || '').trim() } : null;
    const present = (emp: Emp) => isPresentForMeal(getEmployeeDailyStatus(emp, dateStr));

    const shiftRow = (unit: string, squad: string): MealShiftRow => {
        if (!squad) return { squad: '', count: 0, main: null, alt: null, warning: 'دورة المناوبة غير مضبوطة' };
        const members = siteSquadMembers(staff, unit, squad);
        const presentMembers = members.filter(present);
        const pick = (authorizations[unit] && authorizations[unit][squad]) || {};
        const byId = (id?: string) => (id ? members.find(m => m.id === id) : undefined);
        const main = byId(pick.main), alt = byId(pick.alt);
        // الغائب من الاثنين يُسدّ مكانه: البديل يصعد إلى خانة المخول، والخانة الفارغة يشغلها حاضر آخر
        // من الوجبة نفسها بترتيب القائمة — فلا تخرج الاستمارة ناقصة. التنبيه يبيّن الاستبدال على الشاشة.
        const chosen = [main, alt].filter((e): e is Emp => !!e && present(e));
        if (!main && !alt) {
            return { squad, count: presentMembers.length, main: null, alt: null, warning: `لم يُحدَّد مخول للوجبة ${squad}` };
        }
        const filled = [...chosen, ...presentMembers.filter(e => !chosen.includes(e))].slice(0, 2);
        let warning = '';
        if (filled.length === 0) warning = `لا حاضر من الوجبة ${squad}`;
        else if (chosen.length === 0) warning = `المخول والبديل للوجبة ${squad} غائبان — اختير غيرهما`;
        else if (main && !present(main)) warning = 'المخول غائب — حلّ البديل محلّه';
        else if (alt && !present(alt)) warning = 'البديل غائب — اختير غيره';
        return { squad, count: presentMembers.length, main: person(filled[0]), alt: person(filled[1]), warning };
    };

    return DUTY_MEAL_SITES.map(unit => {
        const triple = isTripleShiftSite(unit);
        const rows = triple ? [shiftRow(unit, onDuty.triple)] : [shiftRow(unit, onDuty.morning), shiftRow(unit, onDuty.evening)];
        return { unit, label: dutyMealSiteLabel(unit), triple, total: rows.reduce((n, r) => n + r.count, 0), rows };
    });
};

// «اطعام المناوبين ليوم الخميس المصادف 1-10-2026» — التاريخ بلا أصفار بادئة كما في الاستمارة
export const dutyMealDayTitle = (dateStr: string, dayName: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `اطعام المناوبين ليوم ${dayName} المصادف ${d}-${m}-${y}`;
};

export const monthDates = (monthStr: string): string[] => {
    const [y, m] = monthStr.split('-').map(Number);
    if (!/^\d{4}-\d{2}$/.test(monthStr) || m < 1 || m > 12) return [];
    const days = new Date(y, m, 0).getDate();
    return Array.from({ length: days }, (_, i) => `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
};
