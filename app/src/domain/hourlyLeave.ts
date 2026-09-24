// توقيت الإجازة الزمنية ونص ملاحظتها في كشف الموقف اليومي.
// التوقيت يُحفظ في سجل مستقل (hourlyLeaveTimings: تاريخ ← معرّف موظف ← توقيت) بجانب سجل الساعات،
// لا داخله: قيم سجل الساعات أرقام تُجمع في إحصائيات الشهر ويتحقق منها الدمج.

export const HOURLY_LEAVE_TIMINGS: string[] = ['بداية الدوام', 'أثناء الدوام', 'نهاية الدوام'];

const hoursInWords = (hours: number): string =>
    hours === 1 ? 'ساعة واحدة' : hours === 2 ? 'ساعتان' : `${hours} ساعات`;

// «بداية الدوام – ساعتان»؛ والسجل القديم بلا توقيت يُظهر الساعات وحدها
export const formatHourlyLeaveNote = (hours: number, timing?: string | null): string => {
    const h = hoursInWords(hours);
    return timing ? `${timing} – ${h}` : h;
};
