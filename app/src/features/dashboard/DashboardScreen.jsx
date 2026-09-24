import React from 'react';
import { PageHeader } from '../../ui/PageHeader';
import { SearchCircularProgress } from '../../ui/SearchCircularProgress';
import { getJobRank } from '../../domain/sorting';
import { getMissingFields } from '../../domain/employees';
import { normalizeArabic, getThreeName, formatMobileNumber } from '../../core/arabic';

// الشاشة الرئيسية (لوحة التحكم). الحالة والمنطق كلها في StaffSystem؛ هذه الشاشة ترسم فقط
// وتستلم ما تحتاجه عبر ctx صريح — اسمٌ يسقط من ctx يكشفه tsc برمز TS18004/TS2304.
export const DashboardScreen = ({ ctx }) => {
    const { AuthViews, clearAllData, clearUnifiedSearch, exportBackupJSON, fileInputRef, handleOpenUserManagement, loadFile, openEditModal, performUnifiedSearch, setEditingEmployee, setPreviewData, setSelectedEmployeeCard, setShowEditModal, setShowPasteModal, setShowPreview, setShowPrintForm, setShowUnitDropdown, setUnifiedFilters, setUnifiedQuery, setUnifiedResults, setVisiblePreviewColumns, showBackupWarning, showUnitDropdown, staff, stats, unifiedFilters, unifiedQuery, unifiedResults } = ctx;
    return (
        <>
        <PageHeader icon="sliders-color" title="لوحة التحكم" />
        {/* تنبيه النسخ الاحتياطي التلقائي */}
        {showBackupWarning && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white p-4 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse border border-amber-400/20 shadow-md">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">⚠️</span>
                    <div className="text-right">
                        <div className="font-extrabold text-base">تنبيه حماية البيانات احتياطياً!</div>
                        <div className="text-xs text-amber-50 mt-0.5 font-semibold">لم تقم بتصدير نسخة احتياطية من قاعدة البيانات منذ أكثر من 7 أيام. يرجى أخذ نسخة لحماية البيانات من الحذف المفاجئ.</div>
                    </div>
                </div>
                <button onClick={exportBackupJSON}
                    className="px-5 py-2.5 bg-white text-orange-700 hover:bg-amber-50 rounded-xl font-bold text-xs shadow-md transition whitespace-nowrap active:scale-95 flex items-center gap-1.5 flex-shrink-0">
                    <span>💾</span>
                    <span>تصدير نسخة JSON الآن</span>
                </button>
            </div>
        )}

        {/* === قسم لوحة التحكم العلوي: الإحصائيات التفاعلية بجانب البحث والفلاتر === */}
        {staff.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* ملصق إحصائيات الشعبة التفاعلي */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white rounded-2xl p-6 shadow-xl border border-blue-400 border-opacity-20 transform hover:scale-[1.01] transition-all duration-300 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-blue-100 font-bold backdrop-blur-sm">
                                    {unifiedResults !== null ? 'نتائج الاستعلام النشط' : 'إحصائيات الشعبة'}
                                </span>
                                <span className="text-2xl">{unifiedResults !== null ? '🔍' : '👥'}</span>
                            </div>
                            
                            {/* الرقم الرئيسي التفاعلي */}
                            <div className="animate-fadeIn font-black">
                                <div className="text-6xl tracking-tight flex items-center gap-3 flex-wrap">
                                    <span>{unifiedResults !== null ? unifiedResults.length : staff.length}</span>
                                    {unifiedResults !== null && staff.length > 0 && (
                                        <span className="text-sm bg-white/20 text-white px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm font-extrabold animate-pulse">
                                            📈 {Math.round((unifiedResults.length / staff.length) * 100)}% من الملاك
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm mt-1.5 opacity-90 font-semibold">
                                    {unifiedResults !== null ? 'الموظفون المطابقون للبحث' : 'إجمالي موظفي الشعبة'}
                                </div>
                            </div>

                            {/* لوحة الدوائر الإحصائية التفاعلية للبحث - إصدار V5.1 */}
                            {unifiedResults !== null && (() => {
                                const percentTotal = staff.length > 0 ? Math.round((unifiedResults.length / staff.length) * 100) : 0;
                                
                                const activeLocation = unifiedFilters.location;
                                const locationStaffCount = activeLocation ? staff.filter(s => normalizeArabic(s.location||'') === normalizeArabic(activeLocation)).length : 0;
                                const percentLocation = locationStaffCount > 0 ? Math.round((unifiedResults.length / locationStaffCount) * 100) : 0;
                                
                                const activeUnit = unifiedFilters.unit;
                                const unitStaffCount = activeUnit ? staff.filter(s => normalizeArabic(s.unit||'') === normalizeArabic(activeUnit)).length : 0;
                                const percentUnit = unitStaffCount > 0 ? Math.round((unifiedResults.length / unitStaffCount) * 100) : 0;
                                
                                return (
                                    <div className="mt-5 flex items-center justify-around gap-4 bg-white bg-opacity-[0.08] p-4 rounded-2xl border border-white border-opacity-10 shadow-inner">
                                        <SearchCircularProgress
                                            percent={percentTotal}
                                            label="من ملاك الشعبة"
                                            color="text-sky-300"
                                            size={76}
                                            strokeWidth={7}
                                        />
                                        {activeLocation && (
                                            <SearchCircularProgress
                                                percent={percentLocation}
                                                label={`من ملاك ${activeLocation}`}
                                                color="text-amber-300"
                                                size={76}
                                                strokeWidth={7}
                                            />
                                        )}
                                        {activeUnit && (
                                            <SearchCircularProgress
                                                percent={percentUnit}
                                                label={`من ملاك ${activeUnit}`}
                                                color="text-pink-300"
                                                size={76}
                                                strokeWidth={7}
                                            />
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="mt-8 space-y-4">
                            {/* إذا كان هناك بحث نشط، نعرض إحصائيات البحث أولاً */}
                            {unifiedResults !== null && (
                                <div className="p-3 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-10">
                                    {unifiedResults.length === 1 ? (
                                        <div className="flex flex-col items-center text-center py-2">
                                            <div className="text-xs text-indigo-200 font-bold mb-3 self-start">👤 الموظف المطابق للبحث:</div>
                                            <div className="w-24 h-24 rounded-full border-4 border-white border-opacity-30 overflow-hidden shadow-lg mb-3 bg-indigo-700 bg-opacity-40 flex items-center justify-center flex-shrink-0">
                                                {unifiedResults[0].photo ? (
                                                    <img src={unifiedResults[0].photo} className="w-full h-full object-cover" alt={unifiedResults[0].name} />
                                                ) : (
                                                    <span className="text-4xl">👤</span>
                                                )}
                                            </div>
                                            <div className="text-lg font-black text-white leading-tight mb-1">{unifiedResults[0].name}</div>
                                            <div className="text-xs font-bold text-blue-200 mb-2">{unifiedResults[0].jobTitle || 'منتسب'}</div>
                                            <div className="text-[11px] font-bold text-indigo-100 bg-white bg-opacity-10 px-3 py-1 rounded-full inline-flex items-center gap-1 border border-white border-opacity-10 mb-3">
                                                📍 {unifiedResults[0].unit || unifiedResults[0].location || 'غير محدد'}
                                            </div>
                                            <button
                                                onClick={() => setSelectedEmployeeCard(unifiedResults[0])}
                                                className="w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-lg transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 border border-white/20"
                                            >
                                                <span>📇</span>
                                                <span>عرض المعاينة وبطاقة المنتسب</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-xs text-indigo-200 font-bold mb-2">📊 المطابق للبحث الحالي:</div>
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span>♂ {unifiedResults.filter(s => s.gender === 'ذكر').length} ذكور</span>
                                                <span className="opacity-50">|</span>
                                                <span>♀ {unifiedResults.filter(s => s.gender === 'أنثى').length} إناث</span>
                                            </div>
                                            {unifiedResults.filter(s => s.workType === 'مناوب').length > 0 && (() => {
                                                const shWorkers = unifiedResults.filter(s => s.workType === 'مناوب');
                                                const isAllLocations = !unifiedFilters.location || unifiedFilters.location === '';
                                                
                                                if (isAllLocations) {
                                                    const tripleCount = shWorkers.filter(s => s.location && s.location.includes('نهر بن عمر')).length;
                                                    const doubleCount = shWorkers.length - tripleCount;
                                                    return (
                                                        <div className="mt-3 pt-2.5 border-t border-white border-opacity-10 text-xs font-semibold">
                                                            <div className="text-[10px] text-indigo-200 font-bold mb-1.5">⏰ تفصيل نوع المناوبة للمطابقين:</div>
                                                            <div className="flex justify-between">
                                                                <span className="text-purple-200">🔄 مناوبة ثلاثية: {tripleCount}</span>
                                                                <span className="opacity-50">|</span>
                                                                <span className="text-orange-200">🔁 مناوبة ثنائية: {doubleCount}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                } else {
                                                    const shiftType = unifiedFilters.location.includes('نهر بن عمر') ? 'ثلاثية' : 'ثنائية';
                                                    const badgeColor = shiftType === 'ثلاثية' ? 'text-purple-200' : 'text-orange-200';
                                                    return (
                                                        <div className="mt-3 pt-2.5 border-t border-white border-opacity-10 text-xs font-semibold">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] text-indigo-200 font-bold">⏰ نظام المناوبة للموقع:</span>
                                                                <span className={`${badgeColor} font-black`}>
                                                                    {shiftType === 'ثلاثية' ? '🔄 مناوبة ثلاثية' : '🔁 مناوبة ثنائية'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* إحصائيات الملاك الكلي الثابتة */}
                            <div className="pt-4 border-t border-white border-opacity-10">
                                <div className="text-xs text-blue-200 font-bold mb-2">🏢 إجمالي الملاك الكلي للشعبة:</div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded bg-blue-500 bg-opacity-30 flex items-center justify-center text-xs">♂</span>
                                        <span className="text-xs font-bold">{stats.male} ذكور</span>
                                    </div>
                                    <div className="text-xs font-bold opacity-60">العدد الكلي: {staff.length}</div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded bg-pink-500 bg-opacity-30 flex items-center justify-center text-xs">♀</span>
                                        <span className="text-xs font-bold">{stats.female} إناث</span>
                                    </div>
                                </div>
                            </div>

                            {/* نواقص البيانات */}
                            <div className="pt-4 mt-4 border-t border-white border-opacity-10">
                                <div className="flex justify-between items-center bg-red-950/40 border border-red-500/20 rounded-xl p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">⚠️</span>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-red-200">نواقص بيانات الموظفين:</div>
                                            <div className="text-[10px] text-red-300 opacity-80 mt-0.5">موظفون لديهم حقول فارغة</div>
                                        </div>
                                    </div>
                                    {stats.missingData > 0 ? (
                                        <button 
                                            onClick={() => {
                                                const newFilters = { location:'', unit:'', workType:'', education:'', yearsOfService:'', graduationYear:'', hireYear:'', gender:'', hasMissingInfo: 'yes' };
                                                setUnifiedFilters(newFilters);
                                                setUnifiedQuery('');
                                                setUnifiedResults(staff.filter(s => getMissingFields(s).length > 0));
                                            }}
                                            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-md transition cursor-pointer"
                                        >
                                            عرض {stats.missingData} موظف
                                        </button>
                                    ) : (
                                        <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg font-bold text-xs border border-emerald-500/30">
                                            ✓ مكتملة
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* قسم البحث بالفلاتر المتقدمة */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 h-full flex flex-col justify-between">
                        <div>
                            <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white bg-opacity-15 rounded-lg flex items-center justify-center text-lg flex-shrink-0">🔍</div>
                                    <div>
                                        <div className="font-bold text-sm">البحث والاستعلام</div>
                                        <div className="text-xs opacity-70 mt-0.5">ابحث بالاسم أو فلتر بمعايير متعددة</div>
                                    </div>
                                </div>
                                {(unifiedResults !== null || unifiedQuery || Object.values(unifiedFilters).some(v => v)) && (
                                    <button onClick={clearUnifiedSearch}
                                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-xs font-bold transition whitespace-nowrap">
                                        ✕ مسح الفلاتر
                                    </button>
                                )}
                            </div>

                            {/* حقل البحث */}
                            <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                                <div className="flex gap-2">
                                    <input type="text"
                                        placeholder='ابحث: اسم، رقم وظيفي، عنوان وظيفي...'
                                        value={unifiedQuery}
                                        onChange={(e) => setUnifiedQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && performUnifiedSearch()}
                                        className="flex-1 px-4 py-2.5 border-2 rounded-xl focus:border-teal-500 outline-none text-sm" />
                                    <button onClick={performUnifiedSearch}
                                        className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-bold shadow transition whitespace-nowrap text-sm">
                                        🔍 بحث
                                    </button>
                                </div>
                            </div>

                            {/* شبكة الفلاتر */}
                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">📍 الموقع</label>
                                    <select value={unifiedFilters.location}
                                        onChange={(e) => setUnifiedFilters({...unifiedFilters, location: e.target.value})}
                                        className="w-full px-2 py-1.5 text-xs border rounded-lg focus:border-teal-500 outline-none bg-white">
                                        <option value="">الكل</option>
                                        {[...new Set(staff.map(s => s.location).filter(Boolean))].sort().map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">🏢 الوحدة (اختيار متعدد)</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg focus:border-teal-500 outline-none bg-white flex justify-between items-center font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition"
                                    >
                                        <span className="truncate">
                                            {!unifiedFilters.selectedUnits || unifiedFilters.selectedUnits.length === 0 
                                                ? "الكل (جميع الوحدات)" 
                                                : unifiedFilters.selectedUnits.length === 1
                                                ? `📍 ${unifiedFilters.selectedUnits[0]}`
                                                : `📍 تم اختيار (${unifiedFilters.selectedUnits.length}) وحدات`}
                                        </span>
                                        <span className="text-gray-400 text-[10px] mr-1">{showUnitDropdown ? '▲' : '▼'}</span>
                                    </button>

                                    {showUnitDropdown && (
                                        <div className="absolute z-50 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 text-xs animate-fadeInUp max-h-56 overflow-y-auto space-y-1.5 scrollbar-thin">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-1">
                                                <span className="text-[11px] font-bold text-slate-600">اختر الوحدات المطلوبة:</span>
                                                {unifiedFilters.selectedUnits && unifiedFilters.selectedUnits.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setUnifiedFilters({ ...unifiedFilters, selectedUnits: [] })}
                                                        className="text-[10px] font-bold text-red-600 hover:underline"
                                                    >
                                                        إلغاء التحديد
                                                    </button>
                                                )}
                                            </div>
                                            {['مقر الشعبة', 'تبريد باب الزبير', 'ورشة التبريد', 'تبريد المكينة', 'تبريد نهر بن عمر', 'تبريد المركز الثقافي'].map(u => {
                                                const isChecked = (unifiedFilters.selectedUnits || []).includes(u);
                                                return (
                                                    <label 
                                                        key={u} 
                                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition text-xs font-bold ${
                                                            isChecked ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                const prev = unifiedFilters.selectedUnits || [];
                                                                let next;
                                                                if (e.target.checked) {
                                                                    next = [...prev, u];
                                                                } else {
                                                                    next = prev.filter(x => x !== u);
                                                                }
                                                                setUnifiedFilters({ ...unifiedFilters, selectedUnits: next, unit: '' });
                                                            }}
                                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                        <span>📍 {u}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">⏰ طبيعة العمل</label>
                                    <select value={unifiedFilters.workType}
                                        onChange={(e) => setUnifiedFilters({...unifiedFilters, workType: e.target.value})}
                                        className="w-full px-2 py-1.5 text-xs border rounded-lg focus:border-teal-500 outline-none bg-white">
                                        <option value="">الكل</option>
                                        <option value="صباحي">صباحي</option>
                                        <option value="مناوب">مناوب</option>
                                        <option value="عقد">عقد</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">🎓 التحصيل الدراسي</label>
                                    <select value={unifiedFilters.education}
                                        onChange={(e) => setUnifiedFilters({...unifiedFilters, education: e.target.value})}
                                        className="w-full px-2 py-1.5 text-xs border rounded-lg focus:border-teal-500 outline-none bg-white">
                                        <option value="">الكل</option>
                                        {['بكالوريوس','ماجستير','دكتوراه','معهد نفط','معهد فني','إعدادية','متوسطة','ابتدائية'].map(e => (
                                            <option key={e} value={e}>{e}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">👤 الجنس</label>
                                    <select value={unifiedFilters.gender}
                                        onChange={(e) => setUnifiedFilters({...unifiedFilters, gender: e.target.value})}
                                        className="w-full px-2 py-1.5 text-xs border rounded-lg focus:border-teal-500 outline-none bg-white">
                                        <option value="">الكل</option>
                                        <option value="ذكر">ذكور</option>
                                        <option value="أنثى">إناث</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">📅 سنوات الخدمة</label>
                                    <select value={unifiedFilters.yearsOfService}
                                        onChange={(e) => setUnifiedFilters({...unifiedFilters, yearsOfService: e.target.value})}
                                        className="w-full px-2 py-1.5 text-xs border rounded-lg focus:border-teal-500 outline-none bg-white">
                                        <option value="">الكل</option>
                                        <option value="أقل من 5">أقل من 5 سنوات</option>
                                        <option value="5-10">5 – 10 سنوات</option>
                                        <option value="10-15">10 – 15 سنة</option>
                                        <option value="أكثر من 15">أكثر من 15 سنة</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">🏫 سنة التخرج</label>
                                    <input type="text" placeholder="مثال: 2005"
                                        value={unifiedFilters.graduationYear}
                                        onChange={(e) => setUnifiedFilters({...unifiedFilters, graduationYear: e.target.value})}
                                        className="w-full px-2 py-1.5 text-xs border rounded-lg focus:border-teal-500 outline-none bg-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">📋 سنة التعيين</label>
                                    <input type="text" placeholder="مثال: 2010"
                                        value={unifiedFilters.hireYear}
                                        onChange={(e) => setUnifiedFilters({...unifiedFilters, hireYear: e.target.value})}
                                        className="w-full px-2 py-1.5 text-xs border rounded-lg focus:border-teal-500 outline-none bg-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-red-500 mb-1">⚠️ نواقص البيانات</label>
                                    <select value={unifiedFilters.hasMissingInfo}
                                        onChange={(e) => setUnifiedFilters({...unifiedFilters, hasMissingInfo: e.target.value})}
                                        className="w-full px-2 py-1.5 text-xs border rounded-lg focus:border-red-500 outline-none bg-white font-bold text-red-600">
                                        <option value="">الكل</option>
                                        <option value="yes">عرض النواقص فقط</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        )}

        {/* نتائج البحث */}
        {staff.length > 0 && unifiedResults !== null && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-5">
                {(() => {
                    const res = unifiedResults;
                    const pct = (n, d) => d > 0 ? Math.round(n / d * 100) : 0;
                    const total = staff.length;

                    if (res.length === 0) return (
                        <div className="text-center py-10 text-gray-400">
                            <div className="text-4xl mb-2">🔍</div>
                            <div className="font-bold">لا توجد نتائج مطابقة</div>
                        </div>
                    );

                    const resSorted = [...res].sort((a, b) => {
                        const ap = a.globalPriorityRank, bp = b.globalPriorityRank;
                        if (ap != null && bp != null) {
                            if (ap !== bp) return ap - bp;
                            return (parseInt(String(a.jobNumber || '').replace(/\D/g, '')) || 999999) - (parseInt(String(b.jobNumber || '').replace(/\D/g, '')) || 999999);
                        }
                        if (ap != null) return -1;
                        if (bp != null) return 1;
                        return getJobRank(b.jobTitle) - getJobRank(a.jobTitle);
                    });

                    const isEduSearch = !!unifiedFilters.education || !!unifiedFilters.graduationYear;

                    const exportRows = resSorted.map((s,i) => ({
                        type: 'data',
                        'ت': i + 1,
                        'الاسم الكامل': getThreeName(s.name),
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

                    return (
                        <div>
                            <div className="flex justify-between items-center mb-4 p-3 bg-teal-50 rounded-xl border border-teal-200">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-teal-700">{res.length}</span>
                                    <span className="text-sm text-gray-600">موظف</span>
                                    <span className="text-sm font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">{pct(res.length, total)}% من الإجمالي</span>
                                    <span className="text-xs text-gray-400">({total} موظف)</span>
                                </div>
                                <button onClick={() => {
                                    setPreviewData(exportRows);
                                    setVisiblePreviewColumns(isEduSearch 
                                        ? ['الرقم الوظيفي', 'العنوان الوظيفي', 'سنة التخرج', 'الاختصاص'] 
                                        : ['الرقم الوظيفي', 'العنوان الوظيفي']
                                    );
                                    setShowPreview(true);
                                }}
                                    className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-bold text-sm shadow transition hover:from-teal-600 hover:to-teal-700">
                                    📋 معاينة وتصدير
                                </button>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                                            <th className="px-3 py-2.5 text-right border border-teal-500">ت</th>
                                            <th className="px-3 py-2.5 text-right border border-teal-500">الاسم</th>
                                            <th className="px-3 py-2.5 text-right border border-teal-500">الرقم الوظيفي</th>
                                            <th className="px-3 py-2.5 text-right border border-teal-500">العنوان الوظيفي</th>
                                            <th className="px-3 py-2.5 text-right border border-teal-500">رقم الهاتف النقال</th>
                                            {isEduSearch && <>
                                                <th className="px-3 py-2.5 text-right border border-teal-500">سنة التخرج</th>
                                                <th className="px-3 py-2.5 text-right border border-teal-500">الاختصاص</th>
                                            </>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resSorted.map((s, i) => {
                                            const missingFields = getMissingFields(s);
                                            return (
                                            <tr key={s.id || i} className={i%2===0?'bg-white':'bg-teal-50'}>
                                                <td className="px-3 py-2 border border-gray-200 text-center text-gray-500 font-bold">{i+1}</td>
                                                <td className="px-3 py-2 border border-gray-200 font-semibold">
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
                                                <td className="px-3 py-2 border border-gray-200 font-mono text-xs text-blue-900 font-bold">{s.jobNumber}</td>
                                                <td className="px-3 py-2 border border-gray-200 text-xs text-gray-700 font-bold">{s.jobTitle}</td>
                                                <td className="px-3 py-2 border border-gray-200 text-xs font-mono font-bold text-amber-800">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span dir="ltr" className="inline-block dir-ltr">{s.mobile || s.phone ? `📱 ${formatMobileNumber(s.mobile || s.phone)}` : '-'}</span>
                                                        <button 
                                                            onClick={() => setSelectedEmployeeCard(s)}
                                                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-sans font-bold transition shadow-xs"
                                                            title="معاينة بطاقة المنتسب الكاملة"
                                                        >
                                                            📇 بطاقة
                                                        </button>
                                                    </div>
                                                </td>
                                                {isEduSearch && <>
                                                    <td className="px-3 py-2 border border-gray-200 text-center text-teal-700 font-bold">{s.graduationYear||'—'}</td>
                                                    <td className="px-3 py-2 border border-gray-200 text-gray-600">{s.specialization||'—'}</td>
                                                </>}
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}
                </div>
            </div>
        )}

        {/* === قسم الرسوم البيانية التفاعلية SVG === */}
        {staff.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* مخطط توزيع الجنسين */}
                {(() => {
                    const total = staff.length;
                    const males = staff.filter(s => s.gender === 'ذكر').length;
                    const females = staff.filter(s => s.gender === 'أنثى').length;
                    
                    const r = 50;
                    const c = 2 * Math.PI * r; // ~314.16
                    const maleStroke = total > 0 ? (males / total) * c : 0;
                    const femaleStroke = total > 0 ? (females / total) * c : 0;
                    const malePct = total > 0 ? Math.round((males / total) * 100) : 0;
                    const femalePct = total > 0 ? 100 - malePct : 0;

                    return (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-lg flex flex-col items-center justify-between min-h-[300px] hover:shadow-xl transition-shadow duration-300">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4 w-full text-right text-base border-b border-gray-100 pb-2">
                                <span>📊</span>
                                <span>توزيع الملاك حسب الجنس</span>
                            </h3>
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                    {/* Base circle */}
                                    <circle cx="60" cy="60" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                                    {/* Male arc */}
                                    {males > 0 && (
                                        <circle cx="60" cy="60" r={r} fill="transparent" stroke="#2563eb" strokeWidth="12"
                                            strokeDasharray={`${maleStroke} ${c}`}
                                            className="transition-all duration-300 hover:stroke-[14px]"
                                        />
                                    )}
                                    {/* Female arc */}
                                    {females > 0 && (
                                        <circle cx="60" cy="60" r={r} fill="transparent" stroke="#ec4899" strokeWidth="12"
                                            strokeDasharray={`${femaleStroke} ${c}`}
                                            strokeDashoffset={-maleStroke}
                                            className="transition-all duration-300 hover:stroke-[14px]"
                                        />
                                    )}
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center text-center">
                                    <span className="text-3xl font-black text-slate-800">{total}</span>
                                    <span className="text-[10px] text-gray-400 font-bold">إجمالي الملاك</span>
                                </div>
                            </div>
                            <div className="flex gap-6 mt-4 w-full justify-center text-xs font-bold">
                                <div className="flex items-center gap-1.5 text-blue-600">
                                    <span className="w-3.5 h-3.5 rounded-full bg-blue-600"></span>
                                    <span>ذكور: {males} ({malePct}%)</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-pink-500">
                                    <span className="w-3.5 h-3.5 rounded-full bg-pink-500"></span>
                                    <span>إناث: {females} ({femalePct}%)</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* مخطط توزيع الملاك وضغط العمل على المواقع */}
                {(() => {
                    const locations = ['نهر بن عمر', 'باب الزبير', 'المركز الثقافي النفطي', 'المكينة'];
                    const data = locations.map(loc => {
                        const count = staff.filter(s => s.location === loc).length;
                        const active = staff.filter(s => s.location === loc && s.status === 'نشط').length;
                        return { name: loc, count, active };
                    });
                    const maxCount = Math.max(...data.map(d => d.count), 1);

                    return (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-lg flex flex-col justify-between min-h-[300px] hover:shadow-xl transition-shadow duration-300">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4 w-full text-right text-base border-b border-gray-100 pb-2">
                                <span>📈</span>
                                <span>توزيع الملاك وضغط العمل حسب المواقع</span>
                            </h3>
                            <div className="space-y-4 flex-1 flex flex-col justify-center">
                                {data.map(d => {
                                    const pct = Math.round((d.count / maxCount) * 100);
                                    return (
                                        <div key={d.name} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                                <span className="flex items-center gap-1">
                                                    <span>📍</span>
                                                    <span>{d.name}</span>
                                                </span>
                                                <span>{d.count} موظف ({d.active} نشط)</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative group">
                                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold mt-4 text-center">
                                * يمثل التوزيع النسبي لكادر الشعبة الكلي عبر المواقع الأربعة.
                            </div>
                        </div>
                    );
                })()}
            </div>
        )}

        {/* === صف التحميل والإجراءات === */}
        <div className={`grid gap-4 ${staff.length > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto w-full'}`}>

            {/* بطاقة تحميل البيانات */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white bg-opacity-15 rounded-lg flex items-center justify-center text-xl flex-shrink-0">📊</div>
                    <div className="min-w-0">
                        <div className="font-bold text-base">قاعدة بيانات الموظفين</div>
                        <div className="text-xs opacity-70 mt-0.5 truncate">
                            {staff.length > 0 ? `${staff.length} موظف محمل · ✅ جاهزة` : 'لم يتم التحميل بعد'}
                        </div>
                    </div>
                </div>
                <label className="block cursor-pointer group">
                    <div className="px-5 py-5 flex items-center gap-4 hover:bg-blue-50 transition-colors">
                        <div className="w-14 h-14 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors flex items-center justify-center text-3xl flex-shrink-0">
                            📥
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800">
                                {staff.length === 0 ? 'تحميل ملف Excel' : 'تحميل قاعدة بيانات جديدة'}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                                {staff.length === 0 ? 'يدعم ملفات .xlsx و .xls و .json و .txt (للهواتف)' : 'سيتم استبدال البيانات الحالية'}
                            </div>
                        </div>
                        <div className="text-blue-500 group-hover:text-blue-700 font-bold text-sm whitespace-nowrap transition-colors flex-shrink-0">
                            اختر ملف ←
                        </div>
                    </div>
                    <input type="file" accept=".xlsx,.xls,.json,.txt,application/json,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden"
                        ref={fileInputRef} onChange={loadFile} />
                </label>
                
                {/* زر بديل للهواتف لقراءة نص JSON عن طريق النسخ واللصق */}
                <div className="px-5 pb-4 border-t border-gray-100 pt-3 flex justify-center bg-gray-50 bg-opacity-40">
                    <button onClick={() => setShowPasteModal(true)}
                        className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
                        <span>📋 استيراد يدوي بنسخ ولصق النص بصيغة txt (للهواتف)</span>
                    </button>
                </div>
                {staff.length === 0 && (
                    <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-sm text-amber-700 flex items-center gap-2">
                        <span>👋</span>
                        <span>مرحباً! ابدأ بتحميل ملف Excel لعرض بيانات الموظفين</span>
                    </div>
                )}
            </div>

            {/* بطاقة الإجراءات السريعة - تظهر فقط عند وجود بيانات */}
            {staff.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-5 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white bg-opacity-15 rounded-lg flex items-center justify-center text-xl flex-shrink-0">⚡</div>
                        <div>
                            <div className="font-bold text-base">الإجراءات السريعة</div>
                            <div className="text-xs opacity-70 mt-0.5">إدارة قاعدة البيانات</div>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        <button onClick={() => {
                            setEditingEmployee({
                                id: Date.now(), name: '', jobNumber: '', jobTitle: '',
                                department: 'قسم التبريد',
                                section: 'شعبة تبريد المركز ومحطة عزل نهر بن عمر',
                                location: '', unit: '', workType: 'صباحي', status: 'نشط',
                                workPhone: '', birthDate: '', workNumber: '', hireDate: '',
                                education: '', graduationYear: '', specialization: '',
                                gender: 'ذكر', bank: '', mobile: '', vacationDays: '',
                                uniformSize: '', shoeSafetySize: '', email: '',
                                address: '',
                                relativePhone: '',
                                photo: '',
                                documents: []
                            });
                            setShowEditModal(true);
                        }} className="w-full flex items-center gap-3 px-4 py-2.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition text-right">
                            <span className="w-9 h-9 bg-green-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-base">➕</span>
                            <div>
                                <div className="font-bold text-green-800 text-sm">إضافة موظف جديد</div>
                                <div className="text-xs text-green-600">أدخل بيانات موظف يدوياً</div>
                            </div>
                        </button>
                        <button onClick={() => setShowPrintForm(true)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition text-right">
                            <span className="w-9 h-9 bg-blue-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-base">🖨️</span>
                            <div>
                                <div className="font-bold text-blue-800 text-sm">طباعة استمارة موظف</div>
                                <div className="text-xs text-blue-600">استمارة ورقية للتعبئة اليدوية</div>
                            </div>
                        </button>
                        <button onClick={handleOpenUserManagement} className="w-full flex items-center gap-3 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition text-right">
                            <span className="w-9 h-9 bg-amber-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-base">👥</span>
                            <div>
                                <div className="font-bold text-amber-900 text-sm">إدارة الحسابات والمستخدمين</div>
                                <div className="text-xs text-amber-700">{AuthViews.editionTexts.userManagementCard}</div>
                            </div>
                        </button>
                        <button onClick={exportBackupJSON} className="w-full flex items-center gap-3 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition text-right">
                            <span className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-base">💾</span>
                            <div>
                                <div className="font-bold text-indigo-800 text-sm">تصدير نسخة احتياطية (JSON)</div>
                                <div className="text-xs text-indigo-600">نسخة احتياطية كاملة لقاعدة البيانات</div>
                            </div>
                        </button>
                        <button onClick={clearAllData}
                            className="w-full flex items-center gap-3 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition text-right">
                            <span className="w-9 h-9 bg-red-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-base">🗑️</span>
                            <div>
                                <div className="font-bold text-red-800 text-sm">مسح قاعدة البيانات</div>
                                <div className="text-xs text-red-600">حذف جميع بيانات الموظفين</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
        </>
    );
};
