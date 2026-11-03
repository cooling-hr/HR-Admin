// إعدادات الجهة (شعبة أو قسم): الأسماء والوحدات والمواقع وكلمة الجهة في النصوص.
// الجسم المشترك يأخذها من createStaffSystem ويمرّرها في ctx.org، ودوال domain تأخذها معاملاً.
// قيم شعبة التبريد في src/org/cooling.js، ولا يستوردها إلا ملفا المدخل.

export interface OrgUnit {
  name: string;            // اسم الوحدة كما يُحفظ في emp.unit
  shortName: string;       // الاسم بلا البادئة (جدول الوجبات)
  tabLabel: string;        // زر الوحدة في الموقف اليومي
  cardIcon: string;        // بطاقة الوحدة في شاشة الوحدات
  cardGradient: string;    // أصناف Tailwind كاملة
  isHeadquarters?: boolean; // مقر الجهة: يُطبَّق عليه ensureTopTwo
}

export interface OrgLocation {
  name: string;            // كما يُحفظ في emp.location
  justification: string;   // مبررات التشغيل في كشف الإضافي
}

// كلمة الجهة بصيغها: «الشعبة/للشعبة/كلها» أو «القسم/للقسم/كله»
export interface OrgTerms {
  the: string;
  forThe: string;
  whole: string;
}

export interface Org {
  ministry: string;
  authority: string;
  company: string;
  companyLegal: string;
  department: string;
  departmentShort: string;
  departmentBare: string;
  section: string;
  sectionShort: string;
  terms: OrgTerms;
  units: OrgUnit[];
  locations: OrgLocation[];
  dutyMealSites: string[];
  shiftUnitOrder: string[];
  shiftViewLocationOrder: string[];
}

export const unitNames = (org: Org): string[] => org.units.map(u => u.name);

export const headquartersUnit = (org: Org): string | undefined => org.units.find(u => u.isHeadquarters)?.name;

export const locationNames = (org: Org): string[] => org.locations.map(l => l.name);

export const locationJustification = (org: Org, location: string): string | undefined =>
  org.locations.find(l => l.name === location)?.justification;
