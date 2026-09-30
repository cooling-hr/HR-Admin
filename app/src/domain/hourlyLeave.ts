// توقيت الإجازة الزمنية وورقة العمل، ونص عمود الملاحظات في كشف الموقف اليومي.
// التوقيت يُحفظ في سجل مستقل (hourlyLeaveTimings: تاريخ ← معرّف موظف ← توقيت) بجانب سجل الساعات،
// لا داخله: قيم سجل الساعات أرقام تُجمع في إحصائيات الشهر ويتحقق منها الدمج.
// السجل نفسه يحمل توقيت ورقة العمل: للموظف موقف واحد في اليوم، فلا يجتمع التوقيتان، والملاحظة
// لا تقرأ التوقيت إلا مع موقفه. الاسم باقٍ لأنه مفتاح مزامنة ونسخ احتياطية قائمة.

export const HOURLY_LEAVE_TIMINGS: string[] = ['بداية الدوام', 'أثناء الدوام', 'نهاية الدوام'];

// الموقفان اللذان يُسأل عن توقيتهما
export const TIMED_DAY_STATUSES: string[] = ['إجازة زمنية', 'ورقة عمل'];

// الزمنية وورقة العمل: التوقيت وحده (السجل القديم بلا توقيت يبقى فارغاً)؛ الإضافي: «2 ساعات عمل إضافي»
export const dailyStatusNote = (status: string, timing?: string | null, overtimeHours?: number | null): string => {
    if (TIMED_DAY_STATUSES.includes(status)) return timing || '';
    if (String(status || '').includes('إضافي') && Number(overtimeHours) > 0) {
        const h = Number(overtimeHours);
        return `${h} ${h === 1 ? 'ساعة' : 'ساعات'} عمل إضافي`;
    }
    return '';
};
