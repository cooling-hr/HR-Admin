import React from 'react';
import { getThreeName } from '../../core/arabic';
import { localDateStr } from '../../core/dates';
import { getMissingFields } from '../../domain/employees';
import { QUICK_STATUS_OPTIONS, getActivePeriod, periodsOf } from '../../domain/periods';
import { getSafetyStatus } from '../../domain/safety';
import { Icon, SAFETY_BOOT_IMG, SAFETY_VEST_IMG } from '../../ui/Icon';
import { PageHeader } from '../../ui/PageHeader';
import { Segmented } from '../../ui/Segmented';

// الجدول المشترك لتبويبات الملاك (الكل، الصباحي، المناوبين، العقود، التقييم، الماء، السلامة):
// جدول واحد تتبدّل أعمدته وفلاتره بشرط view. الحالة والمنطق في StaffSystem؛ هذا المكوّن
// يرسم فقط ويستلم ما يحتاجه عبر ctx صريح.
export const StaffListScreen = ({ ctx }) => {
    const { applySafetyDate, authorizeEmployeeDelete, buildDatePicker, bulkSafetyDate, canEdit, changeStatus, current, currentUserName, exportStandardExcel, getWaterGroupSummary, logAuditEvent, openEditModal, periodSpanJsx, preparePreview, resetWaterGroupDaysToAuto, safetyFilter, safetyGroupCounts, safetyUndo, search, selectedSafetyIds, setBulkSafetyDate, setPeriodHistoryEmpId, setSafetyFilter, setSafetyUndo, setSearch, setSelectedSafetyIds, setShowSizeDetails, setStaff, setWaterGroupDays, setWaterMemoGroup, setWaterMonth, showSizeDetails, staff, stats, tableWrapperRef, undoSafetyDate, updateTombstones, view, waterMonth } = ctx;
    return (
        <div className="space-y-4">
            <div className="sticky-search bg-white rounded-xl shadow-lg p-4">
                <input type="text" placeholder="🔍 بحث..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-sm px-4 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 pt-6">
                <PageHeader
                    icon={{ all: 'users', morning: 'users', shift: 'users', contract: 'users', evaluation: 'star', maa: 'droplet', maaMorning: 'droplet', maaShift: 'droplet', safety: 'shield-check' }[view]}
                    title={{ all: 'الملاك', morning: 'الملاك', shift: 'الملاك', contract: 'الملاك', evaluation: 'التقييم', maa: 'الماء', maaMorning: 'الماء', maaShift: 'الماء', safety: 'تجهيزات السلامة' }[view]}
                    description={
                        (view === 'maa' && 'استبعاد من في دورة، ومن غاب نصف الشهر فأكثر بإجازة طويلة أو أمومة، ومن استُثني دائماً') ||
                        (view === 'evaluation' && 'استبعاد الإجازات الطويلة طويلة وأمومة') ||
                        (view === 'morning' && 'الاسم الثلاثي فقط') ||
                        (view === 'contract' && `عقود 315: ${stats.contract315} · عقود المحافظة: ${stats.contractGov}${stats.contractUnclassified ? ` · غير مصنّف: ${stats.contractUnclassified}` : ''}`) ||
                        (view === 'shift' && 'مرتب حسب المواقع') ||
                        undefined
                    }
                    meta={<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[color:var(--ink-2)]">{current.length} موظف</span>}
                    actions={
                        <>
                            {view === 'safety' && (
                                <Segmented
                                    ariaLabel="فلتر حالة التجهيز"
                                    stackBelow="all"
                                    value={safetyFilter}
                                    onChange={(next) => {
                                        setSafetyFilter(next);
                                        // الفلتر هنا والنتيجة أسفل الصفحة — تمرير الجدول للعرض تلقائياً بدل النزول يدوياً
                                        tableWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    options={[
                                        { value: 'all', label: `الكل (${safetyGroupCounts.all})` },
                                        { value: 'renewal', label: `مستحقو التجديد (${safetyGroupCounts.renewal})`, title: 'جُهِّزوا سابقاً وحان تجديد البدلة أو الحذاء أو اقترب' },
                                        { value: 'never', label: `غير مجهزين سابقاً (${safetyGroupCounts.never})`, title: 'لا تاريخ تجهيز مسجَّل لهم' }
                                    ]}
                                />
                            )}
                            <button type="button" onClick={preparePreview} className="bg-[var(--action)] hover:bg-[var(--action-hover)] text-white px-6 py-3 rounded-lg font-bold shadow-sm transition flex items-center gap-2">
                                <Icon name="eye" className="w-4 h-4" /> <span>معاينة وتصدير</span>
                            </button>
                            {view === 'all' && (
                                <button type="button" onClick={exportStandardExcel}
                                    className="bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[color:var(--ink)] border border-[color:var(--border-strong)] px-6 py-3 rounded-lg font-bold shadow-sm transition flex items-center gap-2">
                                    <Icon name="file-spreadsheet" className="w-4 h-4" /> <span>تصدير جدول قياسي Excel</span>
                                </button>
                            )}
                        </>
                    }
                />
                </div>

                {(view === 'maa' || view === 'maaMorning' || view === 'maaShift') && (
                    <div className="mb-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex flex-wrap items-center gap-3 no-print">
                        <span className="text-xs font-black text-cyan-900">💧 شهر قائمة الماء:</span>
                        <input
                            type="month"
                            value={waterMonth}
                            onChange={(e) => setWaterMonth(e.target.value)}
                            className="border border-cyan-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold outline-none focus:border-cyan-600"
                        />
                        <span className="text-[11px] text-cyan-800 font-bold">
                            يُستبعد من كان في دورة أو إيفاد يمسّ هذا الشهر مهما قصر، ومن بلغت أيام إجازته أو غيابه نصف أيام العمل الفعلية في الشهر فأكثر.
                        </span>
                    </div>
                )}

                {(view === 'maa' || view === 'maaMorning' || view === 'maaShift') && (
                    <div className="mb-3 p-3 bg-white border-2 border-cyan-300 rounded-xl no-print">
                        <div className="text-xs font-black text-cyan-900 mb-2">📋 استمارة تجهيز مياه معدنية — {waterMonth}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                            {[
                                { key: 'morning', label: 'صباحي', show: view === 'maa' || view === 'maaMorning' },
                                { key: 'triple', label: 'مناوبة ثلاثية', show: view === 'maa' || view === 'maaShift' },
                                { key: 'double', label: 'مناوبة ثنائية', show: view === 'maa' || view === 'maaShift' }
                            ].filter(g => g.show).map(g => {
                                const sum = getWaterGroupSummary(g.key, waterMonth);
                                return (
                                    <div key={g.key} className="border border-cyan-200 rounded-lg p-2 space-y-1">
                                        <div className="font-black text-cyan-900">{g.label}</div>
                                        <div className="flex justify-between"><span>عدد المنتسبين:</span><span className="font-mono font-bold">{sum.headcount}</span></div>
                                        <div className="flex justify-between items-center gap-2">
                                            <span>أيام الدوام الفعلي: {sum.isAuto && <span className="text-emerald-600 font-black" title="محسوبة تلقائياً من تبويب الموقف ودورة المناوبة">(تلقائي 🔄)</span>}</span>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={sum.days}
                                                    placeholder="0"
                                                    title={sum.isAuto ? 'قيمة محسوبة تلقائياً — عدّلها لتثبيت رقم يدوي بدلاً منها' : 'قيمة مُعدَّلة يدوياً'}
                                                    onChange={(e) => setWaterGroupDays(g.key, waterMonth, parseInt(e.target.value, 10) || 0)}
                                                    className={`w-16 border rounded px-1 py-0.5 text-center font-mono font-bold outline-none focus:border-cyan-600 ${sum.isAuto ? 'border-emerald-300 bg-emerald-50' : 'border-cyan-300'}`}
                                                />
                                                {!sum.isAuto && (
                                                    <button type="button" onClick={() => resetWaterGroupDaysToAuto(g.key, waterMonth)} title="إعادة للحساب التلقائي" className="text-cyan-700 hover:text-cyan-900 cursor-pointer">↺</button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between"><span>المعدل الموسمي:</span><span className="font-mono font-bold" title="٤ قناني/يوم صيفاً (أيار–أيلول)، وقنينتان شتاءً (تشرين الأول–نيسان)">{sum.rate}/يوم</span></div>
                                        <div className="flex justify-between"><span>💧 عدد القناني:</span><span className="font-mono font-bold text-cyan-800">{sum.bottles}</span></div>
                                        <div className="flex justify-between"><span>عدد السيتات:</span><span className="font-mono font-bold">{sum.sets}</span></div>
                                        <div className="flex justify-between"><span>المبلغ:</span><span className="font-mono font-bold">{sum.cost.toLocaleString()} د.ع</span></div>
                                        <button type="button" onClick={() => setWaterMemoGroup(g.key)} className="w-full mt-1 py-1 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-[11px] font-black transition cursor-pointer">
                                            🖨️ طباعة المذكرة
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-[10px] text-cyan-700 mt-2">أيام الدوام الفعلي (🔄) تُحسب تلقائياً — للصباحي من أيام العمل التقويمية، وللمناوَبين من دورة الوجبة المسجَّلة (تبويب "الموقف والمناوبة"). عدِّل الرقم يدوياً لتثبيته بدل الحساب التلقائي، أو اضغط ↺ للعودة إليه. المعدل الموسمي 4 قناني/يوم صيفاً (أيار–أيلول) وقنينتان شتاءً (تشرين الأول–نيسان). أي تعديل يدوي محفوظ على هذا الجهاز فقط حالياً.</div>
                    </div>
                )}

                {/* ===== إحصاء القياسات — يظهر فقط في تجهيزات السلامة ===== */}
                {view === 'safety' && (() => {
                    const total = current.length;
                    const withUniform = current.filter(s => s.uniformSize && s.uniformSize !== '—' && s.uniformSize !== '').length;
                    const withShoe = current.filter(s => s.shoeSafetySize && s.shoeSafetySize !== '—' && s.shoeSafetySize !== '').length;

                    // حساب وتجميع مقاسات البدلات ديناميكياً
                    const uniformCounts = {};
                    let totalValidUniforms = 0;
                    current.forEach(s => {
                        const size = s.uniformSize ? String(s.uniformSize).trim() : '';
                        if (size && size !== '—' && size !== '') {
                            uniformCounts[size] = (uniformCounts[size] || 0) + 1;
                            totalValidUniforms++;
                        }
                    });

                    // ترتيب مقاسات البدلات منطقياً
                    const uniformWeight = {
                        'xs': 1, 's': 2, 'm': 3, 'l': 4, 'xl': 5, 'xxl': 6, '2xl': 6, 'xxxl': 7, '3xl': 7, 'xxxxl': 8, '4xl': 8, 'xxxxxl': 9, '5xl': 9, '6xl': 10
                    };
                    const getUniformWeight = (size) => {
                        const s = String(size).trim().toLowerCase();
                        if (uniformWeight[s] !== undefined) return uniformWeight[s];
                        const num = parseFloat(s);
                        if (!isNaN(num)) return 100 + num;
                        return 1000;
                    };
                    const sortedUniformSizes = Object.keys(uniformCounts).sort((a, b) => {
                        const weightA = getUniformWeight(a);
                        const weightB = getUniformWeight(b);
                        if (weightA !== weightB) return weightA - weightB;
                        return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
                    });

                    // حساب وتجميع مقاسات الأحذية ديناميكياً
                    const shoeCounts = {};
                    let totalValidShoes = 0;
                    current.forEach(s => {
                        const size = s.shoeSafetySize ? String(s.shoeSafetySize).trim() : '';
                        if (size && size !== '—' && size !== '') {
                            shoeCounts[size] = (shoeCounts[size] || 0) + 1;
                            totalValidShoes++;
                        }
                    });

                    // ترتيب مقاسات الأحذية عددياً
                    const sortedShoeSizes = Object.keys(shoeCounts).sort((a, b) => {
                        const numA = parseFloat(a);
                        const numB = parseFloat(b);
                        const isNumA = !isNaN(numA);
                        const isNumB = !isNaN(numB);
                        if (isNumA && isNumB) return numA - numB;
                        if (isNumA) return -1;
                        if (isNumB) return 1;
                        return String(a).localeCompare(String(b));
                    });

                    return (
                        <div className="p-5 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white no-print">
                            {/* عنوان الإحصاء ورأس لوحة التحكم */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <Icon name="chart-column" className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <h3 className="text-lg font-extrabold text-indigo-950">إحصاء وتوزيع تجهيزات السلامة</h3>
                                        <p className="text-xs text-slate-400 font-sans">إحصاء ديناميكي مباشر حسب بيانات الموظفين المدخلة ({total} موظف)</p>
                                    </div>
                                </div>

                                {/* زر التوسيع والإغلاق المطور بتصميم زجاجي ممتاز */}
                                <button
                                    onClick={() => setShowSizeDetails(!showSizeDetails)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 shadow-sm border ${
                                        showSizeDetails
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 hover:shadow-indigo-100 scale-95'
                                            : 'bg-white hover:bg-slate-50 text-indigo-600 border-slate-200 hover:border-indigo-300'
                                    }`}
                                >
                                    <span>{showSizeDetails ? '🔼 إخفاء الإحصاء التفصيلي' : '🔽 عرض الإحصاء التفصيلي للمقاسات'}</span>
                                </button>
                            </div>

                            {/* البطاقات التعريفية الرئيسية */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {/* بطاقة ملخص البدلات */}
                                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><img src={SAFETY_VEST_IMG} className="w-7 h-7" alt="" /></div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 text-base mb-0.5">تجهيزات البدلات</h4>
                                            <p className="text-xs text-slate-500 font-medium font-sans">تغطية قياسات البدلة للمنتسبين</p>
                                            <div className="mt-2.5 flex items-center gap-2">
                                                <span className="text-[11px] font-black px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                                                    تغطية {total > 0 ? Math.round((withUniform / total) * 100) : 0}%
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-400">
                                                    ({withUniform} من {total})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 self-end sm:self-center">
                                        <div className="text-center px-3.5 py-2 bg-slate-50 hover:bg-blue-50/35 text-slate-700 hover:text-blue-700 rounded-xl border border-slate-100 min-w-[85px] transition">
                                            <div className="text-xl font-black">{withUniform}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">مسجل</div>
                                        </div>
                                        <div className={`text-center px-3.5 py-2 rounded-xl min-w-[85px] border transition ${
                                            total - withUniform > 0
                                                ? 'bg-rose-50/50 hover:bg-rose-50 text-rose-600 border-rose-100'
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                            <div className="text-xl font-black">{total - withUniform}</div>
                                            <div className="text-[10px] font-bold mt-0.5">{total - withUniform > 0 ? 'غير مسجل' : 'مكتمل'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* بطاقة ملخص الأحذية */}
                                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><img src={SAFETY_BOOT_IMG} className="w-7 h-7" alt="" /></div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 text-base mb-0.5">أحذية السلامة</h4>
                                            <p className="text-xs text-slate-500 font-medium font-sans">تغطية قياسات الأحذية للمنتسبين</p>
                                            <div className="mt-2.5 flex items-center gap-2">
                                                <span className="text-[11px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                                                    تغطية {total > 0 ? Math.round((withShoe / total) * 100) : 0}%
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-400">
                                                    ({withShoe} من {total})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 self-end sm:self-center">
                                        <div className="text-center px-3.5 py-2 bg-slate-50 hover:bg-emerald-50/35 text-slate-700 hover:text-emerald-700 rounded-xl border border-slate-100 min-w-[85px] transition">
                                            <div className="text-xl font-black">{withShoe}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">مسجل</div>
                                        </div>
                                        <div className={`text-center px-3.5 py-2 rounded-xl min-w-[85px] border transition ${
                                            total - withShoe > 0
                                                ? 'bg-rose-50/50 hover:bg-rose-50 text-rose-600 border-rose-100'
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                            <div className="text-xl font-black">{total - withShoe}</div>
                                            <div className="text-[10px] font-bold mt-0.5">{total - withShoe > 0 ? 'غير مسجل' : 'مكتمل'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* القسم الإحصائي التفصيلي القابل للتوسيع */}
                            {showSizeDetails && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 p-5 bg-slate-50/50 border border-slate-100 rounded-2xl animate-fadeIn">
                                    {/* إحصاء مقاسات البدلات */}
                                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                                        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                                            <h4 className="font-extrabold text-blue-700 flex items-center gap-2">
                                                <img src={SAFETY_VEST_IMG} className="w-5 h-5 flex-shrink-0" alt="" />
                                                <span>تفاصيل مقاسات البدلات المجهزة</span>
                                            </h4>
                                            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold">
                                                {totalValidUniforms} مقاس مسجل
                                            </span>
                                        </div>

                                        {sortedUniformSizes.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400 font-medium">
                                                لا توجد بيانات مقاسات بدلات مدخلة حالياً
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                                {sortedUniformSizes.map(size => {
                                                    const count = uniformCounts[size];
                                                    const pct = totalValidUniforms > 0 ? Math.round((count / totalValidUniforms) * 100) : 0;
                                                    return (
                                                        <div key={size} className="group">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-12 text-center font-black text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 text-xs border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition duration-200">
                                                                        {size}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 font-bold">
                                                                        ({count} {count > 10 ? 'منتسبين' : 'منتسب'})
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs font-black text-slate-700">{pct}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className="bg-blue-500 rounded-full h-2 group-hover:bg-blue-600 transition-all duration-500" 
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* إحصاء مقاسات الأحذية */}
                                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                                        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                                            <h4 className="font-extrabold text-emerald-700 flex items-center gap-2">
                                                <img src={SAFETY_BOOT_IMG} className="w-5 h-5 flex-shrink-0" alt="" />
                                                <span>تفاصيل مقاسات أحذية السلامة</span>
                                            </h4>
                                            <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-bold">
                                                {totalValidShoes} مقاس مسجل
                                            </span>
                                        </div>

                                        {sortedShoeSizes.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400 font-medium">
                                                لا توجد بيانات مقاسات أحذية مدخلة حالياً
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                                {sortedShoeSizes.map(size => {
                                                    const count = shoeCounts[size];
                                                    const pct = totalValidShoes > 0 ? Math.round((count / totalValidShoes) * 100) : 0;
                                                    return (
                                                        <div key={size} className="group">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-12 text-center font-black text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 text-xs border border-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition duration-200">
                                                                        {size}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 font-bold">
                                                                        ({count} {count > 10 ? 'منتسبين' : 'منتسب'})
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs font-black text-slate-700">{pct}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className="bg-emerald-500 rounded-full h-2 group-hover:bg-emerald-600 transition-all duration-500" 
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
                {/* ===== نهاية إحصاء القياسات ===== */}

                {view === 'safety' && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 mb-6 flex flex-wrap gap-4 items-center justify-between no-print animate-fadeIn">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">📅</div>
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm">التحديث الجماعي لتاريخ التجهيز</h4>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    حدد الموظفين من الجدول بالأسفل، ثم اختر التاريخ واضغط تطبيق.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-lg px-2 py-1.5 shadow-sm">
                                <span className="text-sm text-gray-500">التاريخ:</span>
                                <input 
                                    id="bulk-safety-date"
                                    type="text" 
                                    placeholder="YYYY-MM-DD"
                                    value={bulkSafetyDate}
                                    onChange={(e) => setBulkSafetyDate(e.target.value)}
                                    ref={el => { if (el) buildDatePicker('bulk-safety-date'); }}
                                    className="w-32 outline-none font-bold text-slate-800 text-sm bg-transparent"
                                />
                                <button 
                                    onClick={() => setBulkSafetyDate(localDateStr())}
                                    className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded text-xs transition"
                                >
                                    اليوم
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    if (!canEdit('safety')) {
                                        alert('⛔ عذراً، ليس لديك صلاحية تعديل بيانات وتجهيزات السلامة المهنية!\nتم منحك صلاحية العرض والاطلاع والطباعة فقط.');
                                        return;
                                    }
                                    if (selectedSafetyIds.length === 0) {
                                        alert('⚠️ يرجى تحديد موظف واحد على الأقل من الجدول أولاً!');
                                        return;
                                    }
                                    const dateVal = bulkSafetyDate.trim();
                                    if (!dateVal) {
                                        alert('⚠️ يرجى إدخال أو اختيار تاريخ التجهيز أولاً!');
                                        return;
                                    }
                                    // الصيغة وحدها تقبل تاريخاً مستحيلاً مثل 2025-02-31 — يُتحقَّق أنه يوم حقيقي في التقويم
                                    const [dy, dm, dd] = dateVal.split('-').map(Number);
                                    const asDate = new Date(dy, dm - 1, dd);
                                    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal) || asDate.getFullYear() !== dy || asDate.getMonth() !== dm - 1 || asDate.getDate() !== dd) {
                                        alert('⚠️ يرجى إدخال التاريخ بالصيغة الصحيحة (السنة-الشهر-اليوم) مثل: 2024-08-26');
                                        return;
                                    }

                                    if (confirm(`❓ هل أنت متأكد من تحديث تاريخ التجهيز لـ (${selectedSafetyIds.length}) موظف محدد إلى: ${dateVal}؟`)) {
                                        applySafetyDate(selectedSafetyIds, dateVal);
                                        setSelectedSafetyIds([]);
                                        alert('✅ تم تحديث تاريخ التجهيز للموظفين المحددين بنجاح!\nيمكنك التراجع عنه من زر «تراجع» في هذا الشريط.');
                                    }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg text-sm transition shadow-md flex items-center gap-1.5"
                            >
                                <span>⚙️ تطبيق على ({selectedSafetyIds.length}) موظف</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!canEdit('safety')) {
                                        alert('⛔ عذراً، ليس لديك صلاحية تعديل بيانات وتجهيزات السلامة المهنية!');
                                        return;
                                    }
                                    if (selectedSafetyIds.length === 0) {
                                        alert('⚠️ يرجى تحديد موظف واحد على الأقل من الجدول أولاً!');
                                        return;
                                    }
                                    if (confirm(`❓ مسح تاريخ التجهيز لـ (${selectedSafetyIds.length}) موظف محدد؟\nسيعودون إلى «غير مجهز سابقاً».`)) {
                                        applySafetyDate(selectedSafetyIds, '');
                                        setSelectedSafetyIds([]);
                                    }
                                }}
                                title="إلغاء تاريخ التجهيز المسجَّل للموظفين المحددين"
                                className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold rounded-lg text-sm transition flex items-center gap-1.5"
                            >
                                <span>🗑️ مسح التاريخ</span>
                            </button>
                        </div>
                        {safetyUndo && (
                            <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm">
                                <span className="font-bold text-amber-800">
                                    آخر تعديل: {safetyUndo.applied ? `تاريخ التجهيز ${safetyUndo.applied}` : 'مسح تاريخ التجهيز'} لـ ({safetyUndo.count}) موظف
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={undoSafetyDate}
                                        className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded text-xs transition"
                                    >
                                        ↩️ تراجع
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSafetyUndo(null)}
                                        aria-label="إخفاء"
                                        className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="overflow-x-auto" ref={tableWrapperRef}>
                    {view === 'safety' ? (
                        // جدول خاص لتجهيزات السلامة - 8 أعمدة مطور بالكامل للـ V5 - 8 أعمدة مطور بالكامل للـ V5
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-right w-12 no-print">
                                        <input type="checkbox" 
                                            checked={current.length > 0 && current.every(s => selectedSafetyIds.includes(s.id))}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedSafetyIds(current.map(s => s.id));
                                                } else {
                                                    setSelectedSafetyIds([]);
                                                }
                                            }}
                                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer" />
                                    </th>
                                    <th className="px-4 py-3 text-right">ت</th>
                                    <th className="px-4 py-3 text-right">الرقم الوظيفي</th>
                                    <th className="px-4 py-3 text-right">الأسم الثلاثي</th>
                                    <th className="px-4 py-3 text-right">العنوان الوظيفي</th>
                                    <th className="px-4 py-3 text-right">قياس البدله</th>
                                    <th className="px-4 py-3 text-right">قياس حذاء السلامة</th>
                                    <th className="px-4 py-3 text-right">تاريخ آخر تجهيز</th>
                                    <th className="px-4 py-3 text-right">حالة التجديد والفعالية</th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((s, i) => {
                                    const safetyStatus = getSafetyStatus(s.lastSafetyDelivery);
                                    const isRowSelected = selectedSafetyIds.includes(s.id);
                                    return (
                                        <tr key={s.id} className={`border-b hover:bg-gray-50 transition ${isRowSelected ? 'bg-amber-50/50' : ''}`}>
                                            <td className="px-4 py-3 no-print">
                                                <input type="checkbox"
                                                    checked={isRowSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedSafetyIds([...selectedSafetyIds, s.id]);
                                                        } else {
                                                            setSelectedSafetyIds(selectedSafetyIds.filter(id => id !== s.id));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer" />
                                            </td>
                                            <td className="px-4 py-3">{i + 1}</td>
                                            <td className="px-4 py-3 font-mono text-blue-600 font-semibold">{s.jobNumber}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-slate-800">{getThreeName(s.name)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{s.jobTitle}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-bold">
                                                    {s.uniformSize || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-bold">
                                                    {s.shoeSafetySize || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-600">
                                                {s.lastSafetyDelivery || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-1 border rounded-lg text-xs font-black shadow-sm ${safetyStatus.color}`}>
                                                    {safetyStatus.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        // الجدول العام لبقية التبويبات
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-right">ت</th>
                                <th className="px-4 py-3 text-right">الاسم</th>
                                <th className="px-4 py-3 text-right">الرقم</th>
                                <th className="px-4 py-3 text-right">الوظيفة</th>
                                {view === 'safety' && (
                                    <>
                                        <th className="px-4 py-3 text-right">قياس البدله</th>
                                        <th className="px-4 py-3 text-right">قياس حذاء السلامة</th>
                                    </>
                                )}
                                {view === 'maa' && (
                                    <th className="px-4 py-3 text-right">نوع المناوبة</th>
                                )}

                                {view === 'shift' && (
                                    <th className="px-4 py-3 text-right">نوع المناوبة</th>
                                )}
                                {view !== 'safety' && (
                                    <th className="px-4 py-3 text-right">الحالة</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {view === 'maa' ? (
                                <>
                                {/* الصباحي */}
                                {current.filter(s => s.workType === 'صباحي').length > 0 && (
                                    <>
                                    <tr className="bg-blue-100">
                                        <td colSpan="6" className="px-4 py-2 font-bold text-center text-blue-800">
                                            ━━━ صباحي ━━━
                                        </td>
                                    </tr>
                                    {current.filter(s => s.workType === 'صباحي').map((s, idx) => {
                                        const globalIndex = current.indexOf(s);


        return (
                                        <tr key={s.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">{globalIndex + 1}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-blue-600">{getThreeName(s.name)}</span>
                                            </td>
                                            <td className="px-4 py-3">{s.jobNumber}</td>
                                            <td className="px-4 py-3">{s.jobTitle}</td>
                                            <td className="px-4 py-3"></td>
                                            <td className="px-4 py-3">
                                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                                                    {s.status}
                                                </span>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                    </>
                                )}

                                {/* المناوبين */}
                                {current.filter(s => s.workType === 'مناوب').length > 0 && (
                                    <>
                                    <tr className="bg-orange-100">
                                        <td colSpan="6" className="px-4 py-2 font-bold text-center text-orange-800">
                                            ━━━ مناوبين ━━━
                                        </td>
                                    </tr>
                                    {current.filter(s => s.workType === 'مناوب').map((s, idx) => {
                                        const globalIndex = current.indexOf(s);
                                        const shiftType = s.location && s.location.includes('نهر بن عمر') ? 'ثلاثية' : 'ثنائية';


        return (
                                        <tr key={s.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">{globalIndex + 1}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-blue-600">{getThreeName(s.name)}</span>
                                            </td>
                                            <td className="px-4 py-3">{s.jobNumber}</td>
                                            <td className="px-4 py-3">{s.jobTitle}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                    shiftType === 'ثلاثية' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {shiftType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                                                    {s.status}
                                                </span>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                    </>
                                )}
                                </>
                            ) : (
                                current.map((s, i) => {
                                // حساب نوع المناوبة
                                const shiftType = s.workType === 'مناوب' ? 
                                    (s.location && s.location.includes('نهر بن عمر') ? 'ثلاثية' : 'ثنائية') 
                                    : '';


        return (
                                <tr key={s.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">{i + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => openEditModal(s)}
                                                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex-1 text-right outline-none"
                                                >
                                                    {s.name}
                                                </button>
                                                {view === 'all' && (
                                                    <button
                                                        onClick={() => {
                                                            if (!authorizeEmployeeDelete()) return;
                                                            const firstName = s.name.split(' ')[0];
                                                            if (confirm(`⚠️ هل أنت متأكد من حذف الموظف؟\n\nالموظف: ${s.name}\nالرقم الوظيفي: ${s.jobNumber}\n\n⚠️ هذه العملية لا يمكن التراجع عنها!`)) {
                                                                const userInput = prompt(`⚠️⚠️ تأكيد نهائي ⚠️⚠️\n\nأنت على وشك حذف: ${s.name}\n\nاكتب اسم الموظف الأول (${firstName}) للتأكيد:`);
                                                                if (userInput === firstName) {
                                                                    // القيد بعد التأكيد النهائي لا قبله: السجل غير قابل للتصحيح
                                                                    logAuditEvent('delete_employee:' + (s.jobNumber || s.id), currentUserName);
                                                                    updateTombstones({ addEmployees: [{ job: s.jobNumber, name: s.name }] });
                                                                    setStaff(staff.filter(emp => emp.id !== s.id));
                                                                    alert('✅ تم حذف الموظف من النظام');
                                                                } else {
                                                                    alert('❌ تم إلغاء عملية الحذف\n\nالاسم المدخل غير مطابق.');
                                                                }
                                                            }
                                                        }}
                                                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition"
                                                        title="حذف الموظف"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                            {(() => {
                                                const missing = getMissingFields(s);
                                                if (missing.length > 0) {
                                                    return (
                                                        <span className="text-[10px] text-red-600 font-bold self-start bg-red-50 border border-red-100 px-1 py-0.2 rounded-md">
                                                            ⚠️ نواقص: {missing.join('، ')}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{s.jobNumber}</td>
                                    <td className="px-4 py-3">{s.jobTitle}</td>
                                    {view === 'safety' && (
                                        <>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-semibold">
                                                    {s.uniformSize || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-semibold">
                                                    {s.shoeSafetySize || '-'}
                                                </span>
                                            </td>
                                        </>
                                    )}

                                    {view === 'shift' && (
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                s.shiftType === 'ثلاثية' ? 'bg-purple-100 text-purple-700' : 
                                                s.shiftType === 'ثنائية' ? 'bg-orange-100 text-orange-700' : 
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {shiftType || 'غير محدد'}
                                            </span>
                                        </td>
                                    )}
                                    {view !== 'safety' && (
                                    <td className="px-4 py-3">
                                        {(() => {
                                            // الحالة المعروضة يجب أن تعكس الفترة الفعلية السارية اليوم، لا حقل
                                            // emp.status الخام وحده — دمج قاعدة بيانات خارجية (Excel) قد يُحدِّث
                                            // هذا الحقل مباشرة بمعزل عن الفترات المؤرَّخة، فيُظهر حالة قديمة/خاطئة
                                            // بينما الفترة الحقيقية (وكل ما يعتمد عليها: الموقف اليومي، الماء)
                                            // ما تزال صحيحة تماماً.
                                            const resolvedStatus = (getActivePeriod(s, localDateStr()) || {}).type || s.status || 'نشط';
                                            return view === 'all' ? (
                                                <select value={resolvedStatus} onChange={(e) => changeStatus(s.id, e.target.value)}
                                                    className={`px-3 py-1 rounded-full text-sm font-bold border-2 cursor-pointer ${
                                                        resolvedStatus === 'نشط' ? 'bg-green-100 text-green-800 border-green-300' :
                                                        resolvedStatus === 'في دورة' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                                                        'bg-orange-100 text-orange-800 border-orange-300'
                                                    }`}>
                                                    {!QUICK_STATUS_OPTIONS.includes(resolvedStatus) && (
                                                        <option value={resolvedStatus}>{resolvedStatus}</option>
                                                    )}
                                                    <option value="نشط">نشط</option>
                                                    <option value="في دورة">في دورة</option>
                                                    <option value="إجازة طويلة">إجازة طويلة</option>
                                                    <option value="إجازة أمومة">إجازة أمومة</option>
                                                    <option value="غياب">غياب</option>
                                                    <option value="سحب يد">سحب يد</option>
                                                </select>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                    resolvedStatus === 'نشط' ? 'bg-green-100 text-green-800' :
                                                    resolvedStatus === 'في دورة' ? 'bg-indigo-100 text-indigo-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {resolvedStatus}
                                                </span>
                                            );
                                        })()}
                                        {(() => {
                                            // مدى الفترة السارية تحت الشارة: يُقرأ بلا نقرة، والنقر يفتح السجل كاملاً
                                            const periodList = periodsOf(s);
                                            if (periodList.length === 0) return null;
                                            const activeNow = getActivePeriod(s, localDateStr());
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => setPeriodHistoryEmpId(s.id)}
                                                    title="عرض سجل الفترات المؤرخة لهذا المنتسب"
                                                    className="mt-1 mx-auto block text-[11px] font-bold text-slate-500 hover:text-indigo-700 hover:underline cursor-pointer"
                                                >
                                                    📅 {(activeNow && !activeNow.legacy) ? periodSpanJsx(activeNow) : `سجل الفترات (${periodList.length})`}
                                                </button>
                                            );
                                        })()}
                                    </td>
                                    )}
                                </tr>
                            );
                            })
                            )}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>
        </div>
    );
};
