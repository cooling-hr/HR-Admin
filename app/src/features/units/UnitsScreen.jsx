import React from 'react';
import { PageHeader } from '../../ui/PageHeader';
import { ARABIC_MONTH_NAMES, getArabicDayName, getDaysBetweenDates } from '../../core/dates';
import { getThreeName, getTripleName } from '../../core/arabic';
import { getMissingFields } from '../../domain/employees';
import { isLongOrMaternityLeave } from '../../domain/periods';
import { sortByJobTitleHierarchy } from '../../domain/sorting';

// شاشة الوحدات بشاشاتها الفرعية الثلاث (الموقف اليومي، تقرير الفترة، الوحدات). الحالة والمنطق
// كلها في StaffSystem؛ هذه الشاشة ترسم فقط وتستلم ما تحتاجه عبر ctx صريح.
export const UnitsScreen = ({ ctx }) => {
    const { DAY_MATRIX_LEGEND, anchorDate, changeReportDateByDays, dailyReportDate, dailyStats, dailyStatusOverrides, dataEntryOperator, expandedEmpPeriod, exportDailyReportExcel, exportPeriodReportExcel, getDayMatrixCell, getEmployeeDailyStatus, getEmployeeDefaultNaturalStatus, lockedSections, officialHolidays, openEditModal, overtimeIds, overtimeListMonth, periodEndDate, periodReportData, periodReportRows, periodSearchQuery, periodShowMatrix, periodStartDate, periodUnitFilter, periodWorkTypeFilter, printDayMatrix, safeStorage, selectedDailyUnitTab, selectedUnit, setDailyReportDate, setDataEntryOperator, setEmployeeDailyStatusOverride, setExpandedEmpPeriod, setOvertimeIds, setOvertimeListMonth, setPendingShiftConfirm, setPeriodEndDate, setPeriodPreset, setPeriodSearchQuery, setPeriodShowMatrix, setPeriodStartDate, setPeriodUnitFilter, setPeriodWorkTypeFilter, setPreviewData, setPreviewTitle, setSelectedDailyUnitTab, setSelectedUnit, setShowHolidaysModal, setShowPreview, setShowSquadSchedule, setUnitBulkStatus, setUnitsSubView, setVisiblePreviewColumns, staff, threeShiftAnchorSquad, twoShiftAnchorSquad, unitsSubView } = ctx;
    return (
        <div className="space-y-5 animate-fadeIn">
            {/* شاشات القسم الثلاث انتقلت إلى الشريط الملتصق أعلى الصفحة، في صفّ تحت
                الأقسام، فتبقى ظاهرة مع التمرير — انظر «شاشات الوحدات والموقف» داخل <nav>. */}

            {unitsSubView === 'dailyStatus' ? (
                <div className="space-y-5 animate-fadeIn">
                    {lockedSections['dailyReport'] && (
                        <div className="mb-3 p-3 bg-amber-50 border-2 border-amber-400 rounded-xl text-xs font-black text-amber-900 flex items-center gap-2 no-print">
                            <span className="text-lg">🔒</span>
                            <span>{lockedSections['dailyReport']} يعدّل الموقف اليومي الآن — أنت في وضع الاطلاع. تعود صلاحيتك تلقائياً خلال 15 ثانية من خروجه. الطباعة والتصدير متاحان كالمعتاد.</span>
                        </div>
                    )}
                    {/* شريط الموقف اليومي البصري */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="px-6 pt-6">
                    <PageHeader
                        icon="clipboard-list"
                        title="الموقف اليومي لمنتسبي الشعبة"
                        description="موقف موحد حسب الوحدات يعرض جميع المناوبين (في الدوام أو الاستراحة) والصباحيين غير الحاضرين فقط"
                        actions={
                            <button onClick={exportDailyReportExcel} className="bg-[var(--action)] hover:bg-[var(--action-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition active:scale-95 flex items-center gap-1.5 flex-1 md:flex-initial justify-center cursor-pointer">
                                <span>👁️</span>
                                <span>معاينة وتصدير الموقف</span>
                            </button>
                        }
                    />
                    </div>

                        <div className="p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            {/* منتقي التاريخ - 4 أعمدة يمين في RTL */}
                            <div className="md:col-span-4 space-y-1.5">
                                <label className="block text-xs font-black text-slate-800">📅 تاريخ الموقف اليومي:</label>
                                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-slate-300 shadow-sm focus-within:border-blue-500">
                                    <button
                                        onClick={() => changeReportDateByDays(-1)}
                                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-amber-400 font-black rounded-lg text-xs transition cursor-pointer border border-slate-700 active:scale-95 flex items-center gap-1 whitespace-nowrap"
                                        title="اليوم السابق"
                                    >
                                        <span>◀️</span>
                                        <span>السابق</span>
                                    </button>

                                    <div className="relative flex-1 flex items-center gap-1.5 px-1">
                                        <span className="text-slate-400 text-sm">📅</span>
                                        <input 
                                            type="date"
                                            value={dailyReportDate}
                                            onChange={(e) => setDailyReportDate(e.target.value)}
                                            className="w-full outline-none font-black text-slate-800 text-xs bg-transparent cursor-pointer font-mono text-center"
                                        />
                                    </div>

                                    <button
                                        onClick={() => changeReportDateByDays(1)}
                                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-amber-400 font-black rounded-lg text-xs transition cursor-pointer border border-slate-700 active:scale-95 flex items-center gap-1 whitespace-nowrap"
                                        title="اليوم التالي"
                                    >
                                        <span>التالي</span>
                                        <span>▶️</span>
                                    </button>
                                </div>
                            </div>

                            {/* زر إدارة العطل الرسمية والأعياد المستقل - عمودان */}
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-xs font-black text-amber-900">🎉 العطل والأعياد:</label>
                                <button
                                    onClick={() => setShowHolidaysModal(true)}
                                    className={`w-full py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
                                        officialHolidays.includes(dailyReportDate)
                                            ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 ring-2 ring-rose-200'
                                            : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                                    }`}
                                    title="إدارة وإعلان العطل الرسمية والأعياد المتعددة الأيام"
                                >
                                    <span>🎉</span>
                                    <span>{officialHolidays.includes(dailyReportDate) ? 'محدد كـ عطلة' : 'إدارة العطل'}</span>
                                </button>
                            </div>

                            {/* اسم منظم الموقف / مدخل البيانات - 3 أعمدة */}
                            <div className="md:col-span-3 space-y-1.5">
                                <label className="block text-xs font-black text-slate-800">👤 اسم منظم الموقف / مدخل البيانات:</label>
                                <div className="bg-white border-2 border-slate-300 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-2 focus-within:border-blue-500">
                                    <span className="text-slate-400 text-sm">✍️</span>
                                    <input 
                                        type="text" 
                                        value={dataEntryOperator} 
                                        onChange={(e) => setDataEntryOperator(e.target.value)} 
                                        placeholder="اسم منظم الموقف..." 
                                        className="w-full outline-none font-bold text-slate-800 text-xs bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* زر محرك تقارير موقف الفترة - 3 أعمدة يسار في RTL */}
                            <div className="md:col-span-3 space-y-1.5">
                                <label className="block text-xs font-black text-blue-900">📊 موقف فترة زمنية (من - إلى):</label>
                                <button 
                                    onClick={() => setUnitsSubView('periodReport')}
                                    className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs shadow-sm hover:shadow transition transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-blue-400 whitespace-nowrap"
                                    title="فتح محرك تقارير موقف الفترة الزمانية"
                                >
                                    <span>📊</span>
                                    <span>محرك تقارير موقف الفترة</span>
                                </button>
                            </div>
                            
                            {/* مطابقة الوجبات */}
                            <div className="md:col-span-8 bg-white border border-slate-150 p-4 rounded-xl shadow-sm space-y-3">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b pb-2">
                                    <span>⚙️</span>
                                    <span>مطابقة وجبات الدوام لتاريخ الموقف المحدد:</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                                    <div className="space-y-1.5">
                                        <span className="block text-slate-500 text-[10px]">الوجبة المستلمة للوجبة الثلاثية (24 ساعة) اليوم:</span>
                                        <div className="flex gap-1">
                                            {['A', 'B', 'C', 'D'].map(sq => {
                                                const diffDays = getDaysBetweenDates(dailyReportDate, anchorDate);
                                                const idxAnchor = ['A', 'B', 'C', 'D'].indexOf(threeShiftAnchorSquad);
                                                const idxActive = (idxAnchor + (diffDays % 4) + 4) % 4;
                                                const isCurrentActive = sq === ['A', 'B', 'C', 'D'][idxActive];
                                                
                                                return (
                                                    <button 
                                                        key={sq}
                                                        onClick={() => { setPendingShiftConfirm({ type: '24h', squad: sq, date: dailyReportDate }); }}
                                                        title={isCurrentActive ? 'الوجبة المستلمة للدوام اليوم (24 ساعة)' : 'وجبة استراحة (انقر لتثبيتها كمستلمة اليوم)'}
                                                        className={`flex-1 py-1 px-1 rounded-lg border-2 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                                                            isCurrentActive 
                                                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm font-black'
                                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <span className="text-[11px] font-black">الوجبة {sq}</span>
                                                        {isCurrentActive ? (
                                                            <span className="text-[9px] bg-purple-700/70 px-1 py-0.2 rounded mt-0.5 block font-bold">🕒 مستلمة (24س)</span>
                                                        ) : (
                                                            <span className="text-[9px] text-slate-400 mt-0.5 block">🏖️ استراحة</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <span className="block text-slate-500 text-[10px]">وجبات الدوام الثنائية (12 ساعة) اليوم (صباحي + مسائي):</span>
                                        <div className="flex gap-1">
                                            {['A', 'B', 'C', 'D'].map(sq => {
                                                const diffDays = getDaysBetweenDates(dailyReportDate, anchorDate);
                                                const squadToDayMap = { 'A': 1, 'C': 2, 'D': 3, 'B': 4 };
                                                const anchorDay = squadToDayMap[twoShiftAnchorSquad] || 1;
                                                const cycleDay = ((anchorDay - 1 + diffDays) % 4 + 4) % 4 + 1;
                                                
                                                const dayShiftMap = { 1: 'A', 2: 'C', 3: 'D', 4: 'B' };
                                                const nightShiftMap = { 1: 'B', 2: 'A', 3: 'C', 4: 'D' };
                                                
                                                const isMorning = sq === dayShiftMap[cycleDay];
                                                const isNight = sq === nightShiftMap[cycleDay];
                                                
                                                let btnStyle = 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100';
                                                let badge = <span className="text-[9px] text-slate-400 mt-0.5 block">🏖️ استراحة</span>;
                                                
                                                if (isMorning) {
                                                    btnStyle = 'bg-amber-500 border-amber-500 text-white shadow-sm font-black';
                                                    badge = <span className="text-[9px] bg-amber-600/70 px-1 py-0.2 rounded mt-0.5 block font-bold">☀️ صباحي (12س)</span>;
                                                } else if (isNight) {
                                                    btnStyle = 'bg-indigo-700 border-indigo-700 text-white shadow-sm font-black';
                                                    badge = <span className="text-[9px] bg-indigo-800/70 px-1 py-0.2 rounded mt-0.5 block font-bold">🌙 مسائي (12س)</span>;
                                                }
                                                
                                                return (
                                                    <button 
                                                        key={sq}
                                                        onClick={() => { setPendingShiftConfirm({ type: '12h', squad: sq, date: dailyReportDate }); }}
                                                        title={isMorning ? 'الوجبة الصباحية العاملة اليوم' : isNight ? 'الوجبة المسائية العاملة اليوم' : 'وجبة استراحة (انقر لتثبيتها كصباحي اليوم)'}
                                                        className={`flex-1 py-1 px-1 rounded-lg border-2 text-center transition cursor-pointer flex flex-col items-center justify-center ${btnStyle}`}
                                                    >
                                                        <span className="text-[11px] font-black">الوجبة {sq}</span>
                                                        {badge}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>

                    {/* لوحة إحصاءات الدوام لليوم */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 no-print">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
                            <div className="text-2xl mb-1">🏢</div>
                            <div className="text-[10px] font-bold text-slate-400">الدوام الفعلي للشعبة</div>
                            <div className="text-xl font-black text-slate-800 mt-1">{dailyStats.onDuty} موظف</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
                            <div className="text-2xl mb-1">☀️</div>
                            <div className="text-[10px] font-bold text-slate-400">الدوام الصباحي</div>
                            <div className="text-xl font-black text-blue-600 mt-1">{dailyStats.morningOnDuty} موظف</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
                            <div className="text-2xl mb-1">⏱️</div>
                            <div className="text-[10px] font-bold text-slate-400">مناوب صباحي (12س)</div>
                            <div className="text-xl font-black text-orange-600 mt-1">{dailyStats.dayShift12h} موظف</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
                            <div className="text-2xl mb-1">🌙</div>
                            <div className="text-[10px] font-bold text-slate-400">مناوب مسائي (12س)</div>
                            <div className="text-xl font-black text-slate-700 mt-1">{dailyStats.nightShift12h} موظف</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
                            <div className="text-2xl mb-1">🕒</div>
                            <div className="text-[10px] font-bold text-slate-400">مناوب 24 ساعة</div>
                            <div className="text-xl font-black text-purple-600 mt-1">{dailyStats.shift24h} موظف</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
                            <div className="text-2xl mb-1">🏖️</div>
                            <div className="text-[10px] font-bold text-slate-400">الإجازات والاستراحات</div>
                            <div className="text-xl font-black text-slate-500 mt-1">{dailyStats.rest + dailyStats.off} موظف</div>
                        </div>
                    </div>

                    {/* شريط أزرار الفلترة الكحلي والذهبي المجمد أسفل شريط التنقل الرئيسي تماماً.
                        موضعه من ارتفاع الشريط الحيّ (--nav-h) + 6px، لا من top-[68px] الثابتة:
                        حين صار الشريط سطرين في هذا القسم دفن ذلك الرقم 37px من اللوحة خلفه (مقيس). */}
                    <div id="dailyUnitPickerBar" className="sticky z-20 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-slate-700 space-y-2 no-print my-4 transition-all" style={{ top: 'calc(var(--nav-h, 62px) + 6px)' }}>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs md:text-sm font-black text-amber-400 flex items-center gap-1.5">
                                <span>📍</span>
                                <span>اختر الوحدة لتصفية وتسجيل الموقف المباشر:</span>
                            </span>
                            <span className="text-[11px] text-slate-300 font-bold">
                                {selectedDailyUnitTab === 'all' ? 'عرض جميع الوحدات' : `وحدة: ${selectedDailyUnitTab}`}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {[
                                { id: 'all', name: '🏢 كافة الوحدات', count: staff.length },
                                { id: 'مقر الشعبة', name: '📍 مقر الشعبة', count: staff.filter(s => s.unit === 'مقر الشعبة').length },
                                { id: 'تبريد باب الزبير', name: '❄️ باب الزبير', count: staff.filter(s => s.unit === 'تبريد باب الزبير').length },
                                { id: 'ورشة التبريد', name: '🔧 ورشة التبريد', count: staff.filter(s => s.unit === 'ورشة التبريد').length },
                                { id: 'تبريد المكينة', name: '🏭 تبريد المكينة', count: staff.filter(s => s.unit === 'تبريد المكينة').length },
                                { id: 'تبريد نهر بن عمر', name: '🌊 نهر بن عمر', count: staff.filter(s => s.unit === 'تبريد نهر بن عمر').length },
                                { id: 'تبريد المركز الثقافي', name: '🏛️ المركز الثقافي', count: staff.filter(s => s.unit === 'تبريد المركز الثقافي').length }
                            ].map(u => {
                                const isActive = selectedDailyUnitTab === u.id;
                                return (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            setSelectedDailyUnitTab(u.id);
                                            // الانتقال المباشر لكشف الوحدة المختارة نفسه بدل قفزة ثابتة لأعلى الصفحة.
                                            // التأخير يمنح React فرصة إعادة الرسم أولاً ليصير عنصر الوحدة موجوداً.
                                            setTimeout(() => {
                                                if (u.id === 'all') {
                                                    window.scrollTo({ top: 340, behavior: 'smooth' });
                                                    return;
                                                }
                                                const section = document.getElementById('unitSection-' + u.id);
                                                if (!section) {
                                                    window.scrollTo({ top: 340, behavior: 'smooth' });
                                                    return;
                                                }
                                                // الإزاحة تُقاس لحظة النقر: الشريط الملتصق + لوحة الوحدات + فراغ. كانت 150 ثابتة،
                                                // واللوحة وحدها تنتهي عند 170 (68 + ارتفاعها 102) — فكان عنوان الوحدة يُدفن 20px
                                                // حتى قبل أن يصير الشريط سطرين (مقيس).
                                                const navEl = document.querySelector('nav');
                                                const pickerEl = document.getElementById('dailyUnitPickerBar');
                                                const offset = (navEl ? navEl.getBoundingClientRect().height : 62)
                                                             + (pickerEl ? pickerEl.getBoundingClientRect().height : 102) + 18;
                                                const target = section.getBoundingClientRect().top + window.scrollY - offset;
                                                window.scrollTo({ top: target > 0 ? target : 0, behavior: 'smooth' });
                                            }, 60);
                                        }}
                                        className={`py-2 px-3.5 rounded-xl font-black text-xs md:text-sm whitespace-nowrap transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-sm ${
                                            isActive
                                                ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-lg scale-105'
                                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                        }`}
                                    >
                                        <span>{u.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-black ${isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-900 text-slate-300'}`}>
                                            {u.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* كشوفات الموظفين مجمعة حسب الوحدات */}
                    <div className="space-y-6">
                        {['مقر الشعبة', 'تبريد باب الزبير', 'ورشة التبريد', 'تبريد المكينة', 'تبريد نهر بن عمر', 'تبريد المركز الثقافي'].map(unitName => {
                             if (selectedDailyUnitTab !== 'all' && selectedDailyUnitTab !== unitName) return null;
                            const unitStaff = staff.filter(s => s.unit === unitName);
                            if (unitStaff.length === 0) return null;
                            
                            const unitDailyStaff = unitStaff.filter(s => {
                                const status = getEmployeeDailyStatus(s, dailyReportDate);
                                if (isLongOrMaternityLeave(status)) return false;
                                return true;
                            });
                             if (unitDailyStaff.length === 0) return null;
                             // نفس دالة ترتيب "الوحدات والموقف" — معيار واحد موحَّد في كل شاشات الوحدات:
                             // أولويات عامة، ثم مسؤولو الوحدة، ثم الهرمية الوظيفية، والعقود تُحسَب دائماً
                             // أدنى رتبة (mainCategory=100) فتنتهي في آخر كل قائمة وحدة تلقائياً
                             const sortedStaff = sortByJobTitleHierarchy(unitDailyStaff, unitName);
                            
                            return (
                                <div key={unitName} id={'unitSection-' + unitName} className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                                    <div className="bg-slate-50/90 px-4 md:px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2">
                                                <span>📍</span>
                                                <span>{unitName}</span>
                                            </h3>
                                            <span className="bg-slate-200 text-slate-700 font-black px-2.5 py-0.5 rounded-full text-xs">
                                                {unitStaff.length} موظف
                                            </span>
                                        </div>

                                        {/* أزرار الإجراء السريع الجماعي لموقع / وحدة الدوام */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => setUnitBulkStatus(unitName, 'تعذر حضور')}
                                                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                                                title={`تسليط تعذر حضور لموظفي الصباحي فقط في (${unitName}) لهذا اليوم بضغطة واحدة`}
                                            >
                                                <span>🚧</span>
                                                <span>تسليط تعذر حضور (للصباحي)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setUnitBulkStatus(unitName, 'default')}
                                                className="px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                                title={`استعادة الموقف الطبيعي الافتراضي لكافة منتسبي (${unitName}) لهذا اليوم`}
                                            >
                                                <span>🔄</span>
                                                <span>استعادة الافتراضي</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-x-auto w-full">
                                        <table className="w-full text-right border-collapse text-sm md:text-base">
                                            <thead>
                                                <tr className="bg-slate-100/70 text-slate-700 border-b border-slate-200">
                                                    <th className="px-4 py-4 font-black text-slate-600 w-14 text-center text-sm md:text-base">ت</th>
                                                    <th className="px-5 py-4 font-black text-slate-900 w-2/5 text-right text-sm md:text-base">الاسم الثلاثي</th>
                                                    <th className="px-4 py-4 font-black text-slate-700 w-1/4 text-center text-sm md:text-base">طبيعة الدوام</th>
                                                    <th className="px-4 py-4 font-black text-slate-800 w-1/3 text-center text-sm md:text-base">الموقف اليومي</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedStaff.map((emp, idx) => {
                                                    const status = getEmployeeDailyStatus(emp, dailyReportDate);
                                                    const isOverride = dailyStatusOverrides[dailyReportDate] && dailyStatusOverrides[dailyReportDate][emp.id];
                                                    const missingFields = getMissingFields(emp);
                                                    
                                                    let statusBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                                                    if (status === 'دوام صباحي') statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
                                                    else if (status === 'دوام صباحي (12 ساعة)') statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
                                                    else if (status === 'دوام مسائي (12 ساعة)') statusBadgeColor = 'bg-indigo-900 text-indigo-100 border-indigo-900 hover:bg-indigo-800';
                                                    else if (status === 'دوام 24 ساعة') statusBadgeColor = 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
                                                    else if (status.includes('استراحة')) statusBadgeColor = 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
                                                    else if (status.includes('إجازة') || status.includes('مرضية')) statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
                                                    else if (status === 'ورقة عمل') statusBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold';
                                                    else if (status === 'مكلف بواجب') statusBadgeColor = 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 font-bold';
                                                    else if (status.includes('تعذر') || status.includes('توقف موقع')) statusBadgeColor = 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 font-bold';
                                                    else if (status.includes('دورة')) statusBadgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
                                                    else if (status === 'غياب') statusBadgeColor = 'bg-red-600 text-white border-red-600 hover:bg-red-700';
                                                    else if (status === 'سحب يد') statusBadgeColor = 'bg-red-800 text-white border-red-800 hover:bg-red-900';
                                                    
                                                    const selectValue = isOverride ? ((status.includes('تعذر') || status.includes('توقف موقع')) ? 'تعذر حضور' : status) : 'default';

                                                    return (
                                                        <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition items-center">
                                                            <td className="px-4 py-3.5 text-center text-slate-500 font-extrabold w-14 text-sm md:text-base">{idx + 1}</td>
                                                            <td className="px-5 py-3.5 font-bold text-slate-900 w-2/5">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <button onClick={() => openEditModal(emp)} className="font-black text-blue-700 hover:text-blue-900 hover:underline cursor-pointer text-right outline-none text-base md:text-lg">
                                                                        {getTripleName(emp.name)}
                                                                    </button>
                                                                    {missingFields.length > 0 && (
                                                                        <span className="text-[10px] text-red-600 font-bold self-start bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                                                                            ⚠️ نواقص: {missingFields.join('، ')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center font-bold text-slate-600 w-1/4">
                                                                <span className={`inline-block px-4 py-1.5 rounded-xl text-xs md:text-sm font-black ${
                                                                    emp.workType === 'مناوب' ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm' : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                                                                }`}>
                                                                    {emp.workType}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center w-1/3">
                                                                <select 
                                                                    value={selectValue}
                                                                    onChange={(e) => setEmployeeDailyStatusOverride(emp.id, dailyReportDate, e.target.value)}
                                                                    className={`w-full text-xs md:text-sm font-black rounded-xl px-3.5 py-2.5 border shadow-sm outline-none cursor-pointer transition-all ${statusBadgeColor}`}
                                                                >
                                                                    <option value="default" className="bg-white text-slate-800 font-bold">
                                                                        ⚙️ الافتراضي ({getEmployeeDefaultNaturalStatus(emp, dailyReportDate)})
                                                                    </option>
                                                                    <option value="دوام صباحي" className="bg-white text-blue-700 font-bold">🟢 دوام صباحي (حضور فعلي)</option>
                                                                    <option value="دوام إضافي" className="bg-white text-emerald-800 font-bold">⚡ دوام إضافي</option>
                                                                    <option value="إجازة اعتيادية" className="bg-white text-rose-700 font-bold">🏖️ إجازة اعتيادية</option>
                                                                    <option value="إجازة بدون راتب" className="bg-white text-orange-800 font-bold">💸 إجازة بدون راتب</option>
                                                                    <option value="إجازة خارج العراق" className="bg-white text-cyan-800 font-bold">🌍 إجازة خارج العراق</option>
                                                                    <option value="إجازة مرضية" className="bg-white text-rose-700 font-bold">🏥 إجازة مرضية</option>
                                                                    <option value="إجازة زمنية" className="bg-white text-amber-700 font-bold">⏰ إجازة زمنية</option>
                                                                    <option value="في دورة" className="bg-white text-indigo-700 font-bold">🎓 في دورة</option>
                                                                    <option value="إيفاد داخل العراق" className="bg-white text-purple-700 font-bold">🇮🇶 إيفاد داخل العراق</option>
                                                                    <option value="إيفاد خارج العراق" className="bg-white text-indigo-900 font-bold">🌐 إيفاد خارج العراق</option>
                                                                    <option value="ورقة عمل" className="bg-white text-emerald-700 font-bold">📝 ورقة عمل</option>
                                                                    <option value="مكلف بواجب" className="bg-white text-sky-700 font-bold">🛠️ مكلف بواجب</option>
                                                                    <option value="تعذر حضور" className="bg-white text-amber-800 font-bold">🚧 تعذر حضور</option>
                                                                    <option value="استراحة ذوي الاحتياجات الخاصة" className="bg-white text-teal-800 font-bold">♿ استراحة ذوي الاحتياجات الخاصة</option>
                                                                    <option value="سحب يد" className="bg-white text-red-700 font-bold">✋ سحب يد</option>
                                                                    <option value="غياب" className="bg-white text-red-700 font-bold">❌ غياب</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : unitsSubView === 'periodReport' ? (
                <div className="space-y-6 animate-fadeIn">
                    {/* شريط العنوان والتقرير الشامل للفترة */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                        <div className="px-6 pt-6">
                        <PageHeader
                            icon="chart-column"
                            title="محرك تقارير موقف الحضور والدوام للفترة المحددة"
                            description="حدد الفترة الزمنية واضغط على استخراج الموقف لمعاينة وسجل إجازات ودورات وغياب ودواير المنتسبين للفترة"
                            actions={
                                <button
                                    onClick={exportPeriodReportExcel}
                                    className="bg-[var(--action)] hover:bg-[var(--action-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition active:scale-95 flex items-center gap-1.5 flex-1 md:flex-initial justify-center cursor-pointer"
                                >
                                    <span>📊</span>
                                    <span>معاينة وتصدير تقرير الفترة</span>
                                </button>
                            }
                        />
                        </div>

                        {/* شريط التحكم بالفترة والفلترة */}
                        <div className="p-6 bg-slate-50/70 border-b border-slate-200 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                {/* من تاريخ */}
                                <div className="md:col-span-3 space-y-1.5">
                                    <label className="block text-xs font-black text-slate-700">📅 من تاريخ:</label>
                                    <div className="relative bg-white border-2 border-slate-300 rounded-xl px-3 py-2 shadow-sm focus-within:border-indigo-500 flex items-center gap-2">
                                        <span className="text-slate-400 text-base">🗓️</span>
                                        <input 
                                            type="date"
                                            value={periodStartDate}
                                            onChange={(e) => setPeriodStartDate(e.target.value)}
                                            className="w-full outline-none font-black text-slate-800 text-sm bg-transparent cursor-pointer font-mono"
                                        />
                                    </div>
                                </div>

                                {/* إلى تاريخ */}
                                <div className="md:col-span-3 space-y-1.5">
                                    <label className="block text-xs font-black text-slate-700">📅 إلى تاريخ:</label>
                                    <div className="relative bg-white border-2 border-slate-300 rounded-xl px-3 py-2 shadow-sm focus-within:border-indigo-500 flex items-center gap-2">
                                        <span className="text-slate-400 text-base">🏁</span>
                                        <input 
                                            type="date"
                                            value={periodEndDate}
                                            onChange={(e) => setPeriodEndDate(e.target.value)}
                                            className="w-full outline-none font-black text-slate-800 text-sm bg-transparent cursor-pointer font-mono"
                                        />
                                    </div>
                                </div>

                                {/* فلتر الوحدة */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-xs font-black text-slate-700">📍 فلترة حسب الوحدة:</label>
                                    <select
                                        value={periodUnitFilter}
                                        onChange={(e) => setPeriodUnitFilter(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 shadow-sm font-bold text-slate-800 text-xs md:text-sm outline-none cursor-pointer focus:border-indigo-500"
                                    >
                                        <option value="all">🏢 جميع الوحدات</option>
                                        {['مقر الشعبة', 'تبريد باب الزبير', 'ورشة التبريد', 'تبريد المكينة', 'تبريد نهر بن عمر', 'تبريد المركز الثقافي'].map(u => (
                                            <option key={u} value={u}>📍 {u}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* فلتر طبيعة الدوام — أيام الدوام تُحتسب لكل موظف حسب نمطه (صباحي أو دورة مناوبة) */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-xs font-black text-slate-700">⏰ طبيعة الدوام:</label>
                                    <select
                                        value={periodWorkTypeFilter}
                                        onChange={(e) => setPeriodWorkTypeFilter(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 shadow-sm font-bold text-slate-800 text-xs md:text-sm outline-none cursor-pointer focus:border-indigo-500"
                                    >
                                        <option value="all">👥 الكل</option>
                                        <option value="صباحي">☀️ الصباحي</option>
                                        <option value="مناوب">🔄 المناوبين</option>
                                    </select>
                                </div>

                                {/* حقل البحث */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-xs font-black text-slate-700">🔍 بحث بالاسم/الرقم الوظيفي:</label>
                                    <div className="relative bg-white border-2 border-slate-300 rounded-xl px-3 py-2 shadow-sm focus-within:border-indigo-500 flex items-center gap-2">
                                        <span className="text-slate-400 text-sm">🔍</span>
                                        <input
                                            type="text"
                                            placeholder="ابحث..."
                                            value={periodSearchQuery}
                                            onChange={(e) => setPeriodSearchQuery(e.target.value)}
                                            className="w-full outline-none font-bold text-slate-800 text-xs md:text-sm bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* أزرار الفترات السريعة */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                                <span className="text-xs font-bold text-slate-500 ml-2">⚡ اختصارات سريعة للفترة:</span>
                                <button onClick={() => setPeriodPreset('currentMonth')} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition border border-indigo-200 cursor-pointer">
                                    🗓️ الشهر الحالي
                                </button>
                                <button onClick={() => setPeriodPreset('prevMonth')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition border border-slate-300 cursor-pointer">
                                    📅 الشهر الماضي
                                </button>
                                <button onClick={() => setPeriodPreset('last7')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition border border-slate-300 cursor-pointer">
                                    ⏩ آخر 7 أيام
                                </button>
                                <button onClick={() => setPeriodPreset('last30')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition border border-slate-300 cursor-pointer">
                                    ⏪ آخر 30 يوماً
                                </button>
                            </div>
                        </div>

                        {/* بطاقات الملخص التجميعي للفترة */}
                        <div className="p-4 bg-slate-50/60 border-b border-slate-200 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[11px] font-black text-slate-500">👥 الموظفون المشمولون بالتقرير:</div>
                                        <div className="text-2xl font-black text-slate-900 mt-1">{periodReportData.summary.totalStaff} منتسب</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                            {(periodUnitFilter === 'all' && periodWorkTypeFilter === 'all' && !periodSearchQuery.trim())
                                                ? 'يشمل جميع كادر الشعبة المعتمد بالكامل'
                                                : `مُصفّى: ${[periodUnitFilter !== 'all' ? periodUnitFilter : null, periodWorkTypeFilter !== 'all' ? (periodWorkTypeFilter === 'صباحي' ? 'الملاك الصباحي' : 'الملاك المناوب') : null, periodSearchQuery.trim() ? 'بحث بالاسم/الرقم' : null].filter(Boolean).join(' — ')}`}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                                        👥
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[11px] font-black text-slate-500">📅 أيام الفترة المحددة بالتقرير:</div>
                                        <div className="text-2xl font-black text-indigo-600 mt-1">{periodReportData.summary.totalDaysCount} يوم</div>
                                        <div className="text-[10px] font-mono font-bold text-indigo-500 mt-0.5">من {periodStartDate} إلى {periodEndDate}</div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                                        🗓️
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-4 py-2 text-xs font-bold text-amber-950 flex items-center gap-2 shadow-xs">
                                <span className="text-base flex-shrink-0">💡</span>
                                <span>تنبيه ذكي: يتم حساب <strong>أيام الحضور</strong> والإحصائيات التراكمية تلقائياً من بداية الفترة وتزداد يوماً بعد يوم للأيام المنقضية حتى تاريخ اليوم الحالي.</span>
                            </div>
                        </div>
                    </div>

                    {/* جدول موقف المنتسبين التفصيلي للفترة */}
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-100/80 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2">
                                <span>📋</span>
                                <span>سجل حضور وإجازات المنتسبين للفترة من ({periodStartDate}) إلى ({periodEndDate})</span>
                            </h3>
                            <div className="flex items-center gap-2">
                                {/* مبدّل العرض: إجمالي لكل موظف، أو مصفوفة يوماً بيوم للمجموعة كلها */}
                                <div className="flex bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm no-print">
                                    <button
                                        onClick={() => setPeriodShowMatrix(false)}
                                        className={`px-3 py-1.5 text-[11px] font-black transition cursor-pointer ${!periodShowMatrix ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        📊 إجمالي
                                    </button>
                                    <button
                                        onClick={() => setPeriodShowMatrix(true)}
                                        className={`px-3 py-1.5 text-[11px] font-black transition cursor-pointer ${periodShowMatrix ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        📅 مصفوفة الأيام
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowSquadSchedule(true)}
                                    disabled={periodReportData.datesList.length === 0}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm transition no-print flex items-center gap-1 ${
                                        periodReportData.datesList.length === 0
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                                    }`}
                                    title="جدول الوجبات المستلمة لكل يوم في الفترة وفق دورة المناوبة، بغض النظر عن الإجازات"
                                >
                                    🔄 توزيع الوجبات
                                </button>
                                {/* الطباعة هنا لا في زر التصدير العام: ذاك يُخرج مستند الإجماليات، وهذا يُخرج المصفوفة */}
                                {periodShowMatrix && (
                                    <button
                                        onClick={printDayMatrix}
                                        disabled={periodReportData.employees.length === 0}
                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm transition no-print flex items-center gap-1 ${
                                            periodReportData.employees.length === 0
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                                        }`}
                                        title="طباعة المصفوفة بمفتاح الرموز على ورق أفقي"
                                    >
                                        🖨️ طباعة المصفوفة
                                    </button>
                                )}
                                <span className="bg-indigo-100 text-indigo-800 font-extrabold px-3 py-1 rounded-full text-xs">
                                    {periodReportData.employees.length} منتسب
                                </span>
                            </div>
                        </div>

                        {periodShowMatrix ? (
                            /* مصفوفة الأيام: صف لكل موظف، عمود لكل يوم — كشف الحضور بشكله الرسمي المعتاد */
                            <div>
                                <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                                    <span className="text-[11px] font-black text-slate-500">مفتاح الرموز:</span>
                                    {DAY_MATRIX_LEGEND.map(l => (
                                        <span key={l.code} className="flex items-center gap-1">
                                            <span className={`inline-flex items-center justify-center w-6 h-5 rounded font-black text-[10px] ${l.cls}`}>{l.code}</span>
                                            <span className="text-[10px] font-bold text-slate-500">{l.label}</span>
                                        </span>
                                    ))}
                                </div>
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-right border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-black">
                                                <th className="px-2 py-2 text-center w-8 sticky right-0 bg-slate-100 z-10">ت</th>
                                                <th className="px-3 py-2 text-right sticky right-8 bg-slate-100 z-10 min-w-[150px]">الاسم الكامل</th>
                                                {periodReportData.datesList.map(d => {
                                                    const dayNum = d.split('-')[2];
                                                    return (
                                                        <th key={d} className="px-1 py-2 text-center min-w-[34px] border-r border-slate-200" title={`${d} — ${getArabicDayName(d)}`}>
                                                            <div className="font-mono font-black text-[11px] text-slate-700">{dayNum}</div>
                                                            <div className="text-[9px] font-bold text-slate-400">{getArabicDayName(d).slice(0, 3)}</div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {periodReportRows.map((item, idx) => (
                                                <tr key={item.employee.id || idx} className="border-b border-slate-100 hover:bg-indigo-50/30">
                                                    <td className="px-2 py-1.5 text-center font-mono text-slate-400 text-[11px] sticky right-0 bg-white z-10">{idx + 1}</td>
                                                    <td className="px-3 py-1.5 text-right font-bold text-slate-800 text-[11px] sticky right-8 bg-white z-10 whitespace-nowrap">
                                                        {item.employee.name}
                                                        <span className="block text-[9px] font-mono font-normal text-slate-400">{item.employee.jobNumber}</span>
                                                    </td>
                                                    {item.dailyLog.map(dayItem => {
                                                        const cell = getDayMatrixCell(dayItem.status, dayItem.isFuture);
                                                        return (
                                                            <td key={dayItem.dateStr} className="px-0.5 py-1.5 text-center border-r border-slate-100" title={`${dayItem.dateStr} — ${dayItem.dayName}: ${cell.label}`}>
                                                                <span className={`inline-flex items-center justify-center w-7 h-6 rounded font-black text-[10px] ${cell.cls}`}>
                                                                    {cell.code}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {periodReportData.employees.length === 0 && (
                                    <div className="p-8 text-center text-slate-400 font-bold text-sm">لا يوجد منتسبون ضمن الفلاتر المحددة</div>
                                )}
                            </div>
                        ) : (
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-right border-collapse text-xs md:text-sm">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-black text-[12px]">
                                        <th className="px-3 py-3.5 text-center w-10">ت</th>
                                        <th className="px-4 py-3.5 text-right">الاسم الكامل</th>
                                        <th className="px-3 py-3.5 text-center">الرقم الوظيفي</th>
                                        <th className="px-3 py-3.5 text-center">طبيعة الدوام</th>
                                        <th className="px-3 py-3.5 text-center text-emerald-700 bg-emerald-50/50">أيام الحضور</th>
                                        <th className="px-3 py-3.5 text-center text-emerald-800 bg-emerald-100/40">دوام إضافي</th>
                                        <th className="px-3 py-3.5 text-center text-amber-900 bg-amber-100/70 font-black">ساعات الإضافي ⚡</th>
                                        <th className="px-3 py-3.5 text-center text-rose-700">إجازات</th>
                                        <th className="px-3 py-3.5 text-center text-purple-700">دورات</th>
                                        <th className="px-3 py-3.5 text-center text-indigo-700">إيفادات</th>
                                        <th className="px-3 py-3.5 text-center text-red-700">غياب</th>
                                        <th className="px-3 py-3.5 text-center">سجل الأيام</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {periodReportData.employees.length === 0 ? (
                                        <tr>
                                            <td colSpan="12" className="px-4 py-8 text-center text-slate-500 font-bold">
                                                🚫 لا توجد نتائج مطابقة لخيارات الفلترة المحددة.
                                            </td>
                                        </tr>
                                    ) : (
                                        periodReportRows.map((item, idx) => {
                                            const emp = item.employee;
                                            const isExpanded = expandedEmpPeriod === emp.id;
                                            return (
                                                <React.Fragment key={emp.id}>
                                                    <tr className={`border-b border-slate-100 hover:bg-indigo-50/40 transition ${isExpanded ? 'bg-indigo-50/60' : ''}`}>
                                                        <td className="px-3 py-3 text-center text-slate-500 font-extrabold">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-black text-slate-900">
                                                            <button onClick={() => openEditModal(emp)} className="text-blue-700 hover:underline outline-none text-right">
                                                                {getTripleName(emp.name)}
                                                            </button>
                                                        </td>
                                                        <td className="px-3 py-3 text-center font-mono font-bold text-slate-600">{emp.jobNumber || '-'}</td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-[11px] font-black ${emp.workType === 'مناوب' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                {emp.workType}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center font-black text-emerald-700 bg-emerald-50/30">{item.regularDuty} يوم</td>
                                                        <td className="px-3 py-3 text-center font-black bg-emerald-50/40 text-emerald-800">
                                                            {item.overtimeDuty > 0 ? `${item.overtimeDuty} يوم` : '0'}
                                                        </td>
                                                        <td className="px-3 py-3 text-center font-black bg-amber-50/60">
                                                            {item.monthlyOvertimeHoursSum > 0 ? (
                                                                <span className="px-2.5 py-1 bg-amber-200 text-amber-950 rounded-lg font-black text-xs ring-1 ring-amber-300">
                                                                    ⚡ {item.monthlyOvertimeHoursSum}س
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 font-bold">0</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-center font-black text-rose-700">{item.leaves > 0 ? `${item.leaves} يوم` : '0'}</td>
                                                        <td className="px-3 py-3 text-center font-black text-purple-700">{item.courses > 0 ? `${item.courses} يوم` : '0'}</td>
                                                        <td className="px-3 py-3 text-center font-black text-indigo-700">{item.deputations > 0 ? `${item.deputations} يوم` : '0'}</td>
                                                        <td className="px-3 py-3 text-center font-black text-red-700">{item.absence > 0 ? `${item.absence} يوم` : '0'}</td>
                                                        <td className="px-3 py-3 text-center">
                                                            <button
                                                                onClick={() => setExpandedEmpPeriod(isExpanded ? null : emp.id)}
                                                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-amber-400 font-bold rounded-lg text-xs transition cursor-pointer"
                                                            >
                                                                {isExpanded ? 'إخفاء 🔼' : 'عرض السجل 🔽'}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* السجل اليومي التفصيلي عند الضغط */}
                                                    {isExpanded && (
                                                        <tr className="bg-slate-900 text-white border-b-2 border-slate-700">
                                                            <td colSpan="12" className="p-4 space-y-3">
                                                                <div className="flex justify-between items-center">
                                                                    <h4 className="font-black text-amber-400 text-xs md:text-sm flex items-center gap-1.5">
                                                                        <span>🗓️</span>
                                                                        <span>السجل اليومي التفصيلي للمنتسب: ({emp.name}) للفترة من {periodStartDate} إلى {periodEndDate}</span>
                                                                    </h4>
                                                                    <span className="text-slate-400 text-xs">إجمالي الأيام: {item.dailyLog.length} يوم</span>
                                                                </div>

                                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1 scrollbar-thin">
                                                                    {item.dailyLog.map(dayItem => {
                                                                        let bgClass = 'bg-slate-800 border-slate-700 text-slate-200';
                                                                        if (dayItem.status === 'دوام صباحي' || dayItem.status.includes('12 ساعة') || dayItem.status.includes('24 ساعة')) bgClass = 'bg-slate-800 border-emerald-500/50 text-emerald-300';
                                                                        else if (dayItem.status === 'دوام إضافي' || dayItem.status.includes('إضافي')) bgClass = 'bg-amber-950 border-amber-500 text-amber-300 font-black';
                                                                        else if (dayItem.status.includes('إجازة') || dayItem.status.includes('مرضية')) bgClass = 'bg-rose-950 border-rose-500 text-rose-300';
                                                                        else if (dayItem.status === 'غياب') bgClass = 'bg-red-900 border-red-500 text-white font-black';
                                                                        else if (dayItem.status === 'سحب يد') bgClass = 'bg-red-900 border-red-300 text-white font-black';

                                                                        return (
                                                                            <div key={dayItem.dateStr} className={`p-2 rounded-lg border text-xs space-y-1 ${bgClass}`}>
                                                                                <div className="flex justify-between items-center text-[10px] opacity-80">
                                                                                    <span>{dayItem.dayName}</span>
                                                                                    <span className="font-mono">{dayItem.dateStr}</span>
                                                                                </div>
                                                                                <div className="font-bold text-[11px] truncate" title={dayItem.status}>
                                                                                    {dayItem.isOverride ? '📌 ' : ''}{dayItem.status}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
            {overtimeIds.length > 0 && (
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-4 rounded-xl shadow-lg mb-6 flex flex-wrap gap-4 items-center justify-between no-print animate-fadeIn">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">🛒</div>
                        <div>
                            <h4 className="font-bold text-sm">سلة العمل الإضافي الموحدة للشعبة</h4>
                            <p className="text-xs opacity-90 mt-0.5">
                                قمت بتحديد ({overtimeIds.length}) موظف لإدراجهم في كشف الساعات الإضافية الموحد للشعبة.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1.5 bg-teal-700/60 px-3 py-1.5 rounded-lg text-xs font-bold" title="شهر الكشف — يظهر في عنوانه">
                            <span>📅 شهر الكشف:</span>
                            <input
                                type="month"
                                value={overtimeListMonth}
                                onChange={(e) => setOvertimeListMonth(e.target.value)}
                                className="bg-white text-teal-800 rounded px-1.5 py-0.5 font-mono font-black outline-none cursor-pointer"
                            />
                        </label>
                        <button 
                            onClick={() => {
                                const selectedEmployees = staff.filter(s => overtimeIds.includes(s.id));
                                const sortedSelected = sortByJobTitleHierarchy(selectedEmployees, 'كشف الإضافي');
                                
                                const exportData = sortedSelected.map((s, i) => ({
            type: 'data',
            'ت': i + 1,
            'الرقم الوظيفي': s.jobNumber || '',
            'الاسم': getThreeName(s.name),
            'العنوان الوظيفي': s.jobTitle || ''
        }));
        
        setPreviewData(exportData);
        setVisiblePreviewColumns(['الرقم الوظيفي', 'الاسم', 'العنوان الوظيفي']);
                                const [otY, otM] = (overtimeListMonth || '').split('-').map(Number);
                                const otMonth = otY && otM ? ` لشهر ${ARABIC_MONTH_NAMES[otM - 1]} ${otY}` : '';
                                setPreviewTitle(`كشف الساعات الإضافية${otMonth} لشعبة تبريد المركز ومحطة عزل نهر بن عمر`);
                                setShowPreview(true);
                            }}
                            className="bg-white text-teal-700 hover:bg-teal-50 px-4 py-2 font-bold rounded-lg text-xs transition shadow-sm cursor-pointer"
                        >
                            👁️ معاينة وتصدير الكشف الموحد
                        </button>
                        <button 
                            onClick={() => {
                                if (confirm('❓ هل أنت متأكد من إفراغ سلة العمل الإضافي وتصفير القائمة بالكامل؟')) {
                                    setOvertimeIds([]);
                                    safeStorage.setItem('overtimeSelectedIds', JSON.stringify([]));
                                }
                            }}
                            className="bg-teal-700 hover:bg-teal-800 text-teal-100 px-3 py-2 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                            🗑️ تصفير السلة
                        </button>
                    </div>
                </div>
            )}
            {!selectedUnit ? (
                // عرض الملصقات
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 pt-6">
                    <PageHeader icon="building-2" title="الوحدات الإدارية" description="اختر وحدة لعرض موظفيها" />
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {name: 'مقر الشعبة', icon: '🏢', color: 'blue', gradient: 'from-blue-500 to-blue-600'},
                                {name: 'تبريد باب الزبير', icon: '❄️', color: 'indigo', gradient: 'from-indigo-500 to-indigo-600'},
                                {name: 'ورشة التبريد', icon: '🔧', color: 'purple', gradient: 'from-purple-500 to-purple-600'},
                                {name: 'تبريد المكينة', icon: '⚙️', color: 'pink', gradient: 'from-pink-500 to-pink-600'},
                                {name: 'تبريد نهر بن عمر', icon: '💧', color: 'cyan', gradient: 'from-cyan-500 to-cyan-600'},
                                {name: 'تبريد المركز الثقافي', icon: '🎭', color: 'teal', gradient: 'from-teal-500 to-teal-600'}
                            ].map(unit => {
                                const unitStaff = staff.filter(s => s.unit === unit.name);
                                const activeCount = unitStaff.filter(s => s.status === 'نشط').length;
                                
                                return (
                                    <button
                                        key={unit.name}
                                        onClick={() => setSelectedUnit(unit)}
                                        className={`bg-gradient-to-br ${unit.gradient} text-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer text-right`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="text-5xl">{unit.icon}</div>
                                            <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-sm font-bold backdrop-blur-sm">
                                                {unitStaff.length} موظف
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">{unit.name}</h3>
                                        <div className="text-sm opacity-90">
                                            <div>نشط: {activeCount}</div>
                                            <div className="mt-1">صباحي: {unitStaff.filter(s => s.workType === 'صباحي').length} • مناوب: {unitStaff.filter(s => s.workType === 'مناوب').length}</div>
                                            {unitStaff.filter(s => overtimeIds.includes(s.id)).length > 0 && (
                                                <div className="mt-2 font-bold text-xs bg-white text-teal-800 rounded px-2.5 py-1 inline-block bg-opacity-95 shadow-sm">
                                                    🛒 مشمولو الإضافي: {unitStaff.filter(s => overtimeIds.includes(s.id)).length}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 text-sm font-bold opacity-75">
                                            ← اضغط للعرض
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                // عرض موظفي الوحدة المختارة
                (() => {
                    const unitStaff = staff.filter(s => s.unit === selectedUnit.name);
                    const sortedStaff = sortByJobTitleHierarchy(unitStaff, selectedUnit.name);
                    
                    return (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="px-6 pt-6">
                            <PageHeader
                                icon={<span className="text-4xl flex-shrink-0">{selectedUnit.icon}</span>}
                                title={`منتسبو ${selectedUnit.name}`}
                                meta={
                                    <>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[color:var(--ink-2)]">{sortedStaff.length} موظف</span>
                                        {sortedStaff.filter(s => overtimeIds.includes(s.id)).length > 0 && (
                                            <span className="bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded text-xs shadow-sm inline-flex items-center gap-1">
                                                <span>🛒 مشمولو الإضافي بالوحدة:</span>
                                                <span>{sortedStaff.filter(s => overtimeIds.includes(s.id)).length}</span>
                                            </span>
                                        )}
                                    </>
                                }
                                actions={
                                    <>
                                        <button
                                            onClick={() => setSelectedUnit(null)}
                                            className="bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[color:var(--ink)] border border-[color:var(--border-strong)] rounded-lg px-4 py-2 font-bold transition"
                                        >
                                            → عودة
                                        </button>
                                        <button
                                            onClick={() => {
                                                const exportData = sortedStaff.map((s, i) => ({
                                                    type: 'data',
                                                    'ت': i + 1,
                                                    'الاسم الكامل': s.name,
                                                    'الرقم الوظيفي': s.jobNumber || '',
                                                    'العنوان الوظيفي': s.jobTitle || '',
                                                    'القسم': s.department || '',
                                                    'الشعبة': s.section || '',
                                                    'الموقع': s.location || '',
                                                    'الوحدة': s.unit || '',
                                                    'طبيعة العمل': s.workType || '',
                                                    'هاتف العمل': s.workPhone || '',
                                                    'التولد': s.birthDate || '',
                                                    'رقم العمل': s.workNumber || '',
                                                    'تاريخ التعيين': s.hireDate || '',
                                                    'التحصيل الدراسي': s.education || '',
                                                    'سنة التخرج': s.graduationYear || '',
                                                    'الاختصاص': s.specialization || '',
                                                    'الجنس': s.gender || '',
                                                    'التوطين': s.bank || '',
                                                    'النقال': s.mobile || '',
                                                    'الحالة': s.status || '',
                                                    'أيام الإجازة': s.vacationDays || '',
                                                    'قياس البدلة': s.uniformSize || '',
                                                    'قياس حذاء السلامة': s.shoeSafetySize || '',
                                                    'تاريخ آخر تجهيز': s.lastSafetyDelivery || '',
                                                    'البريد الإلكتروني': s.email || ''
                                                }));
                                                setPreviewData(exportData);
                                                setVisiblePreviewColumns(['الرقم الوظيفي', 'العنوان الوظيفي', 'رقم الهاتف النقال']);
                                                setShowPreview(true);
                                            }}
                                            className="bg-[var(--action)] hover:bg-[var(--action-hover)] text-white rounded-lg px-6 py-3 font-bold transition shadow-sm"
                                        >
                                            👁️ معاينة وتصدير
                                        </button>
                                    </>
                                }
                            />
                            </div>

                            <div className="p-6">
                                {sortedStaff.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-right font-bold text-gray-700">ت</th>
                                                    <th className="px-4 py-3 text-right font-bold text-gray-700">الرقم الوظيفي</th>
                                                    <th className="px-4 py-3 text-right font-bold text-gray-700">الاسم</th>
                                                    <th className="px-4 py-3 text-right font-bold text-gray-700">العنوان الوظيفي</th>
                                                    <th className="px-4 py-3 text-right font-bold text-gray-700">الملاحظات</th>
                                                    <th className="px-4 py-3 text-right font-bold text-gray-700 w-32 no-print">العمل الإضافي</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedStaff.map((s, i) => {
                                                    const missingFields = getMissingFields(s);
                                                    return (
        <tr key={s.id} className={`border-b hover:bg-gray-50 transition ${overtimeIds.includes(s.id) ? 'bg-emerald-100' : ''}`}>
                                                        <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                                                        <td className="px-4 py-3 font-mono text-blue-600 font-semibold">{s.jobNumber}</td>
                                                        <td className="px-4 py-3 font-bold text-gray-800">
                                                            <div className="flex flex-col gap-0.5">
                                                                <button onClick={() => openEditModal(s)} className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-right outline-none">
                                                                    {s.name}
                                                                </button>
                                                                {missingFields.length > 0 && (
                                                                    <span className="text-[10px] text-red-600 font-bold self-start bg-red-50 border border-red-100 px-1 py-0.2 rounded-md">
                                                                        ⚠️ نواقص: {missingFields.join('، ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700">{s.jobTitle}</td>
                                                        <td className="px-4 py-3 text-gray-400"></td>
                                                        <td className="px-4 py-3 no-print">
                                                            {overtimeIds.includes(s.id) ? (
                                                                <button 
                                                                    onClick={() => {
                                                                        const updated = overtimeIds.filter(id => id !== s.id);
                                                                        setOvertimeIds(updated);
                                                                        safeStorage.setItem('overtimeSelectedIds', JSON.stringify(updated));
                                                                    }}
                                                                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <span>✓ مشمول</span>
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => {
                                                                        const updated = [...overtimeIds, s.id];
                                                                        setOvertimeIds(updated);
                                                                        safeStorage.setItem('overtimeSelectedIds', JSON.stringify(updated));
                                                                    }}
                                                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <span>➕ إضافة</span>
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-gray-500">
                                        <div className="text-6xl mb-4">📭</div>
                                        <p className="text-xl font-bold">لا يوجد موظفون في هذه الوحدة</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()
            )}
        </div>
            )}
        </div>
    );
};
