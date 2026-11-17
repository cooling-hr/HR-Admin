import { localDateStr } from '../core/dates.js';
import type { Employee, ShiftKind, WorkPoint } from './types.js';

export type { ShiftKind, WorkPoint } from './types.js';

// حالة الموظف (نوع الدوام والوجبة ونوع المناوبة) في تاريخ معيّن
export interface WorkState { workType: string; squad: string; shiftKind?: ShiftKind }

// عدد الأيام قبل بداية الفترة التي يبدأ فيها التنبيه
export const NOMINATION_ALERT_DAYS = 7;

// إضافة أيام إلى تاريخ YYYY-MM-DD (بالتاريخ المحلي لا UTC)
const addDays = (dateStr: string, n: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return localDateStr(new Date(y, m - 1, d + n));
};

// ترتيب النقاط بـ from ('' أقدم من كل تاريخ) دون تعديل الأصل
const sortPoints = (pts: WorkPoint[]): WorkPoint[] =>
  [...pts].sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));

// وضع نقطة: الأحدث تحل محل أي نقطة بالتاريخ نفسه، والترتيب محفوظ
const putPoint = (pts: WorkPoint[], p: WorkPoint): WorkPoint[] =>
  sortPoints([...pts.filter(x => x.from !== p.from), p]);

// السجل الحالي، أو لقطة {from:''} بحقلي الموظف إن لم يكن له سجل
const baseHistory = (emp: Employee): WorkPoint[] =>
  emp.workHistory && emp.workHistory.length
    ? emp.workHistory
    : [{ from: '', workType: (emp.workType || 'صباحي') as WorkPoint['workType'], squad: emp.squad || '' }];

// نسخة من الموظف بسجل جديد
const withHistory = (emp: Employee, pts: WorkPoint[]): Employee => ({ ...emp, workHistory: pts });

// النقطة السارية في date (آخر from <= date) إن لم تنتهِ بـ until، وإلا undefined
const activePointOn = (emp: Employee, date: string): WorkPoint | undefined => {
  let hit: WorkPoint | undefined;
  for (const p of sortPoints(emp.workHistory || [])) { if (p.from <= date) hit = p; }
  return hit && !(hit.until && date > hit.until) ? hit : undefined;
};

// حالة الموظف في تاريخ date: آخر نقطة from <= date، وتنتهي بـ until فيعود صباحياً
export const workOn = (emp: Employee, date: string): WorkState => {
  const pts = emp.workHistory;
  if (pts && pts.length) {
    let hit: WorkPoint | undefined;
    for (const p of sortPoints(pts)) { if (p.from <= date) hit = p; }
    if (hit) {
      if (hit.until && date > hit.until) return { workType: 'صباحي', squad: '' };
      return { workType: hit.workType, squad: hit.squad, shiftKind: hit.shiftKind };
    }
  }
  return { workType: emp.workType || '', squad: emp.squad || '', shiftKind: undefined };
};

// الموظف كما كان في date: المرجع نفسه إن لم يتغير شيء، وإلا نسخة بحقولها المؤرَّخة
export const employeeOn = (emp: Employee, date: string): Employee => {
  if (!emp.workHistory || !emp.workHistory.length) return emp;
  const s = workOn(emp, date);
  if (s.workType === (emp.workType || '') && s.squad === (emp.squad || '') && s.shiftKind === emp.shiftKind) return emp;
  return { ...emp, workType: s.workType, squad: s.squad, shiftKind: s.shiftKind };
};

// هل مناوبته ثلاثية (24 ساعة) في date؟ بلا نوع صريح يُقرأ من الموقع كما في الكود الحالي
export const isThreeShiftOn = (emp: Employee, date: string): boolean => {
  const k = workOn(emp, date).shiftKind;
  if (k === '24h') return true;
  if (k === '12h') return false;
  return !!(emp.location && typeof emp.location === 'string' && emp.location.includes('نهر بن عمر'));
};

// ترشيح للمناوبة من start إلى until؛ يرفض من كان مناوباً في start
export const nominate = (emp: Employee, p: { start: string; until: string; shiftKind: ShiftKind }): Employee => {
  if (workOn(emp, p.start).workType === 'مناوب') return emp;
  return withHistory(emp, putPoint(baseHistory(emp), {
    from: p.start, workType: 'مناوب', squad: '', shiftKind: p.shiftKind, until: p.until,
  }));
};

// إلغاء ترشيح لم تُحدَّد وجبته: يحذف نقطة from===start وحدها إن كانت squad فارغة
export const cancelNomination = (emp: Employee, start: string): Employee => {
  const pts = emp.workHistory;
  if (!pts || !pts.some(x => x.from === start && x.squad === '')) return emp;
  return withHistory(emp, pts.filter(x => !(x.from === start && x.squad === '')));
};

// تحديد وجبة المرشح في نقطة from===start
export const assignSquad = (emp: Employee, start: string, squad: string): Employee => {
  const pts = emp.workHistory;
  if (!pts || !pts.some(x => x.from === start)) return emp;
  return withHistory(emp, pts.map(x => (x.from === start ? { ...x, squad } : x)));
};

// تجديد المناوبة لفترة جديدة بوجبتها
export const renewShift = (
  emp: Employee,
  p: { start: string; until: string; squad: string; shiftKind?: ShiftKind },
): Employee => {
  const pt: WorkPoint = { from: p.start, workType: 'مناوب', squad: p.squad, until: p.until };
  if (p.shiftKind) pt.shiftKind = p.shiftKind;
  return withHistory(emp, putPoint(baseHistory(emp), pt));
};

// عودة صباحية اعتباراً من start
export const returnToMorning = (emp: Employee, start: string): Employee =>
  withHistory(emp, putPoint(baseHistory(emp), { from: start, workType: 'صباحي', squad: '' }));

// تعديل يدوي «اعتباراً من»: نقطة تدمج patch فوق حالته وقتها
export const setWorkFrom = (
  emp: Employee,
  from: string,
  patch: { workType?: string; squad?: string; shiftKind?: ShiftKind; until?: string },
): Employee => {
  const cur = workOn(emp, from);
  const workType = (patch.workType ?? cur.workType) as WorkPoint['workType'];
  const pt: WorkPoint = { from, workType, squad: patch.squad ?? cur.squad };
  const kind = patch.shiftKind ?? cur.shiftKind;
  if (kind) pt.shiftKind = kind;
  // النهاية: تُمرَّر صراحةً (والفارغ يعني بلا نهاية)، وإلا تبقى نهاية النقطة السارية إن بقي مناوباً
  const until = 'until' in patch ? (patch.until || undefined) : (workType === 'مناوب' ? activePointOn(emp, from)?.until : undefined);
  if (until) pt.until = until;
  return withHistory(emp, putPoint(baseHistory(emp), pt));
};

export interface NominationCycle { start: string; until: string; nominees: Employee[]; outgoing: Employee[] }

// الدورات المرشَّحة التي اقتربت (أو بدأت) ولم تُوزَّع وجباتها كلها، الأقدم أولاً
export const pendingNominations = (staff: Employee[], today: string): NominationCycle[] => {
  const groups = new Map<string, NominationCycle>();
  for (const emp of staff) {
    for (const p of emp.workHistory || []) {
      if (p.from === '' || p.workType !== 'مناوب' || p.squad !== '') continue;
      // دورة انتهت، أو حلّ محلّها قرار لاحق سرى (تجديد أو عودة صباحية): لا تُعدّ معلّقة
      if (p.until && p.until < today) continue;
      if ((emp.workHistory || []).some(x => x.from > p.from && x.from <= today)) continue;
      const until = p.until || '';
      const key = p.from + '|' + until;
      let g = groups.get(key);
      if (!g) { g = { start: p.from, until, nominees: [], outgoing: [] }; groups.set(key, g); }
      g.nominees.push(emp);
    }
  }
  const limit = addDays(today, NOMINATION_ALERT_DAYS);
  const out: NominationCycle[] = [];
  for (const g of groups.values()) {
    if (g.start > limit) continue;
    const units = new Set(g.nominees.map(e => e.unit));
    const dayBefore = addDays(g.start, -1);
    g.outgoing = staff.filter(e =>
      units.has(e.unit) &&
      workOn(e, dayBefore).workType === 'مناوب' &&
      !(e.workHistory || []).some(x => x.from === g.start));
    out.push(g);
  }
  return out.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
};
