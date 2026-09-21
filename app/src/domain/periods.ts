import { addMonthsClamped, localDateStr } from '../core/dates.js';
import type { Employee, PeriodDraft, PeriodType, StatusPeriod } from './types.js';

// ===== الفترات المؤرَّخة للحالات (Dated Status Periods) =====
export const PERIOD_TYPES: PeriodType[] = ['إجازة اعتيادية', 'في دورة', 'إيفاد', 'إجازة بدون راتب', 'إجازة طويلة', 'إجازة أمومة', 'غياب', 'سحب يد'];

// الأنواع مفتوحة النهاية: تُدخَل بتاريخ بداية فقط بلا مدة ولا تاريخ نهاية، وتبقى سارية
// حتى تُنهى يدوياً بإعادة الحالة إلى «نشط». سحب اليد يُعامَل مطابقةً تامة للغياب هنا
// وفي الإحصائيات وقوائم الماء (WATER_LEAVE_TALLY_TYPES) — قرار صريح من المستخدم.
export const OPEN_ENDED_PERIOD_TYPES: PeriodType[] = ['غياب', 'سحب يد'];

// خيارات الإجراء السريع في جدول الملاك. الحالة المخزَّنة قد تكون خارجها (إجازة اعتيادية،
// بدون راتب، أو حالة قديمة من استيراد Excel)، فتُضاف عندئذٍ كخيار معروض حتى لا تعرض
// القائمة أول خيار زوراً — وحينها لا يُطلق اختيار «نشط» حدث تغيير أصلاً.
export const QUICK_STATUS_OPTIONS: string[] = ['نشط', 'في دورة', 'إجازة طويلة', 'إجازة أمومة', 'غياب', 'سحب يد'];

export const periodsOf = (emp?: Employee | null): StatusPeriod[] => (emp && Array.isArray(emp.statusPeriods)) ? emp.statusPeriods : [];

// الفترة التي تغطّي تاريخاً بعينه. to فارغة تعني فترة مفتوحة النهاية.
// الحسابات القديمة التي تحمل حالة دائمة ولا فترات لها تُقرأ كفترة مفتوحة
// مشتقّة — بلا كتابة أي بيانات، فلا يتغيّر موقف أحد لحظة التحديث.
export const getActivePeriod = (emp?: Employee | null, dateStr?: string | null): StatusPeriod | null => {
    if (!emp || !dateStr) return null;
    const list = periodsOf(emp);
    if (list.length > 0) {
        return list.find(p => p && p.from && dateStr >= p.from && (!p.to || dateStr <= p.to)) || null;
    }
    if (emp.status && emp.status !== 'نشط') {
        return { id: 'legacy_' + emp.id, type: emp.status, from: '1900-01-01', to: null, note: '', legacy: true };
    }
    return null;
};

// ===== الفترات المؤرخة في الدمج =====
// الفترات لا تُقارَن كحقل: كل فترة سجلّ بمعرّف، وموظفة لا يختلف أي حقل لها قد تختلف فترتها
// (هكذا غابت «إجازة بدون راتب» عن نافذة المزامنة ولم تنتقل حتى بعد «تحديد الكل»).
// قاعدة صاحب النظام: الفترة المؤرخة لا تضيع بالدمج. ما في الملف وحده يُعرض منبَّهاً عليه، وما لدى
// الجهاز وحده يبقى منبَّهاً عليه — فغيابها عن نسخةٍ قد يعني موقفاً قديماً لم يُدخَل فيها بعد —
// وكل اختلاف يُعرض ليُختار ما يُنفَّذ وما يُلغى.
// الافتراض مبني على الخطر كالحقول: ما لا يمسّ شيئاً لديك كسبٌ فيُؤشَّر؛ وما يمسّ فترة أو حالة
// غير مؤرخة أو يوماً مثبَّتاً لديك، أو يغيّر فترة لديك، يبقى بلا تأشير.
export const periodEndOf = (p?: StatusPeriod | null): string => (p && p.to) ? p.to : '9999-12-31';

// تداخل تواريخ صارم: النهاية الفارغة مفتوحة، والفترتان المتتاليتان لا تتداخلان
export const periodsOverlap = (a: StatusPeriod, b: StatusPeriod): boolean => a.from <= periodEndOf(b) && b.from <= periodEndOf(a);

// هوية الفترة: معرّفها، أو نوعها وتواريخها إن كانت قديمة بلا معرّف — فلا تتطابق فترتان لمجرد غياب معرّفيهما
export const periodIdentityOf = (p: StatusPeriod): string => p.id || ('~' + [p.type, p.from, p.to || ''].join('|'));

export const periodMergeKeyOf = (jobNumber: string, p: StatusPeriod): string => `${jobNumber}::${periodIdentityOf(p)}`;

export const samePeriodDates = (a: StatusPeriod, b: StatusPeriod): boolean => a.type === b.type && a.from === b.from && (a.to || '') === (b.to || '');

export const samePeriodExtras = (a: StatusPeriod, b: StatusPeriod): boolean => (a.note || '') === (b.note || '') && !!a.confirmedReturn === !!b.confirmedReturn;

export const periodPhaseOf = (p: StatusPeriod | null | undefined, today: string): string => (p && p.to && p.to < today) ? 'منتهية' : ((p && p.from > today) ? 'قادمة' : 'سارية');

// النهاية تُحتسب من المدة (يوم البداية محسوب ضمنها) أو تُؤخذ من تقويم النهاية مباشرة
export const quickPeriodEnd = (draft?: PeriodDraft | null): string => {
    if (!draft || !draft.from) return '';
    if (draft.mode === 'date') return draft.to || '';
    // as string لا تغيير في المنطق: count قد يكون غائباً فعلاً، وparseInt(undefined) تعيد NaN
    // الذي يُسقطه السطر التالي — وتعديل التعبير ليحرس على الغياب تغيير سلوك، فاكتُفي بالتأكيد.
    const count = parseInt(draft.count as string, 10);
    if (!count || count < 1) return '';
    return draft.unit === 'months'
        ? localDateStr(new Date(addMonthsClamped(draft.from, count)).getTime() - 86400000)
        : localDateStr(new Date(draft.from).getTime() + (count - 1) * 86400000);
};

export const isLongOrMaternityLeave = (statusStr?: unknown): boolean => {
    if (!statusStr) return false;
    const str = String(statusStr).toLowerCase();
    return str.includes('أموم') || str.includes('اموم') || str.includes('طويل');
};
