// شكل حزمة البيانات المتبادَلة بين الواجهة وطبقة التخزين (Firebase أو التخزين المحلي).
// مطابق تماماً لما يبنيه buildCloudBundle (سحابية) وpushDataToServer (أوفلاين)، ولما
// تقرأه applyDataBundleToState في كلا الملفين — لا تُضِف حقلاً هنا لم يكن موجوداً هناك.
export interface DataBundle {
  staffData?: unknown[];
  systemUsersList?: unknown[];
  officialHolidaysList?: string[];
  hourlyLeaveRecords?: Record<string, unknown>;
  overtimeHoursRecords?: Record<string, unknown>;
  dailyStatusOverrides?: Record<string, unknown>;
  shiftAnchorDate?: string;
  threeShiftAnchorSquad?: unknown;
  twoShiftAnchorSquad?: unknown;
  dataEntryOperator?: string;
  overtimeSelectedIds?: unknown;
  lastCloudUpdate?: string;
  pendingDeletionRequest?: unknown;
  // حقول سحابية إضافية تظهر فقط في حزم السحابية (لقطات الأرشيف وقفل الكتابة)
  writeClaim?: string;
}
