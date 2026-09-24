import React from 'react';
import { ICON_PATHS, Icon } from '../../ui/Icon';
import { Segmented } from '../../ui/Segmented';

// شريط التنقل: أقسام في الأعلى وشرائح تصفية داخل القسم. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. يُرسم دائماً.
export const AppNav = ({ ctx }) => {
    const { observeNavHeight, periodSearchQuery, sectionMemory, setPeriodSearchQuery, setSectionMemory, setUnitsSubView, setView, stats, unitsSubView, view } = ctx;
    return (() => {
        const sections = [
            { id: 'dashboard', icon: 'sliders-color', label: 'لوحة التحكم',
              views: [{ v: 'dashboard', l: 'لوحة التحكم' }] },
            // العدد شارةً على كل قسم مفرد: كان ظاهراً على التبويبات القديمة،
            // وإخفاؤه خلف قسم يحرم المستخدم من لمحة يعرف بها أن البيانات محمَّلة.
            { id: 'staff', icon: '👥', label: 'الملاك', badge: stats.total,
              views: [
                { v: 'all', l: `الكل (${stats.total})` },
                { v: 'morning', l: `صباحي (${stats.morning})` },
                { v: 'shift', l: `مناوب (${stats.shift})` },
                { v: 'contract', l: `عقود (${stats.contract})` }
              ] },
            { id: 'attendance', icon: '🏢', label: 'الوحدات والموقف',
              views: [{ v: 'units', l: 'الوحدات والموقف' }] },
            // التقييم قسم مستقل لا شريحة تحت «الملاك»: evaluation مفتاح صلاحية
            // قائم بذاته في canEdit تماماً كـsafety، فدفنه داخل قسم عام يعيد
            // الخطأ نفسه الذي جمع الماء بالسلامة — وضع مسؤولية مستقلة داخل غيرها.
            { id: 'evaluation', icon: '⭐', label: 'التقييم',
              badge: stats.evaluation,
              views: [{ v: 'evaluation', l: 'التقييم' }] },
            // الماء والسلامة قسمان منفصلان عمداً، ولا يُجمعان مهما بدا أنهما
            // «صرف مستحقات»: الحدّ بينهما حدّ مسؤولية لا حدّ نشاط — الماء من
            // اختصاص الكادر الإداري، والسلامة من اختصاص الكادر الفني، ومن يدخل
            // أحدهما ليس بالضرورة صاحب صلاحية في الآخر (safety مفتاح صلاحية
            // مستقل في canEdit، والماء ليس له مفتاح أصلاً). جمعُهما مرة واحدة
            // وضع منطقة محكومة بصلاحية بجانب منطقة ليست كذلك — لا تُعِده.
            // والدورات، حين تُضاف، قسم فنّي ثالث لا شريحة تحت أيٍّ منهما.
            { id: 'water', icon: '💧', label: 'الماء',
              badge: stats.maaMorning + stats.maaShift,
              views: [{ v: 'maa', l: 'الماء' }] },
            { id: 'safety', icon: '🦺', label: 'تجهيزات السلامة',
              badge: stats.safety,
              views: [{ v: 'safety', l: 'تجهيزات السلامة' }] }
        ];
        const activeSection = sections.find(s => s.views.some(x => x.v === view));
        const openSection = (s) => {
            const remembered = sectionMemory[s.id];
            const target = (remembered && s.views.some(x => x.v === remembered))
                ? remembered : s.views[0].v;
            setView(target);
        };
        return (
    <nav ref={observeNavHeight} className="bg-white/85 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 px-4 py-3 shadow-sm transition-all duration-300">
        {/* شبكة لا overflow-x مع scrollbar-none: الشريط المخفيّ تمريره كان يُخفي
            أواخر التبويبات بلا أي دليل عليها. الشبكة تلتفّ صفوفاً فلا تُخفي شيئاً،
            وتوزّع الأقسام بعرض متساوٍ يملأ الشريط بدل تكدّسها في جهة واحدة.
            ستة أعمدة من 1280px فقط: دونها يفيض «تجهيزات السلامة» مع شارته. */}
        {/* لا role="tablist": نمط التبويبات يقتضي aria-controls وتنقّلاً بالأسهم
            لم يُبنيا هنا، وادّعاء النمط ناقصاً أسوأ لقارئ الشاشة من أزرار صريحة
            تحمل aria-current. */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2" aria-label="أقسام النظام">
            {sections.map(s => {
                const isActive = activeSection && activeSection.id === s.id;
                return (
                    <button
                        key={s.id}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => openSection(s)}
                        className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 xl:px-2.5 py-2.5 rounded-lg text-xs xl:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                            isActive
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                        {ICON_PATHS[s.icon] ? <Icon name={s.icon} className="w-4 h-4 flex-shrink-0" /> : <span className="text-sm flex-shrink-0">{s.icon}</span>}
                        <span className="truncate min-w-0">{s.label}</span>
                        {typeof s.badge === 'number' && (
                            <span className={`flex-shrink-0 min-w-[18px] px-1.5 py-0.5 text-center rounded-full text-[10px] font-black leading-tight ${
                                isActive ? 'bg-white/25 text-white' : 'bg-white text-slate-600'
                            }`}>{s.badge}</span>
                        )}
                    </button>
                );
            })}
        </div>
        {/* الشرائح تظهر فقط حيث تعني شيئاً: قسم يضمّ أكثر من عرض.
            نمط الشرائح الموحّد في النظام (segmented control): مسار رمادي «seg-track»
            تُرفَع فيه الشريحة النشطة حبّةً بيضاء، بأعمدة متساوية بعرض أطول خياراتها أيّاً كان
            عددها (grid-flow-col + auto-cols-fr)، وتتكدّس عمودياً على الهاتف.
            حلّ محلّ شرائح باهتة (bg-indigo-50 وحدّ رفيع) كادت لا تُرى بجوار الأقسام. */}
        {activeSection && activeSection.views.length > 1 && (
            <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-100">
                <Segmented
                    ariaLabel={`شرائح ${activeSection.label}`}
                    stackBelow="sm"
                    options={activeSection.views.map(x => ({ value: x.v, label: x.l }))}
                    value={view}
                    onChange={(v) => { setView(v); setSectionMemory(m => ({ ...m, [activeSection.id]: v })); }}
                />
            </div>
        )}
        {/* ============================================================= */}
        {/* شاشات «الوحدات والموقف» الثلاث — داخل الشريط الملتصق نفسه، في   */}
        {/* مكان شرائح «الملاك» تماماً، فتبقى ظاهرة مع التمرير مثلها.      */}
        {/*                                                               */}
        {/* كانت داخل main فتمرّ مع الصفحة وتختفي: تقرير الفترة بثلاثين     */}
        {/* موظفاً طوله 2479px، فمن في آخر الجدول يصعد أولاً ليبدّل الشاشة. */}
        {/* ولم تُثبَّت تحت الشريط بمسافة ثابتة: ارتفاعه يتغيّر حين يلتفّ    */}
        {/* إلى سطرين (62px ⇒ 107px عند 820px). داخله لا مسافة تُحسب أصلاً. */}
        {/*                                                               */}
        {/* القاعدة باقية: ما يُدخَل إليه ويُخرَج منه وجهةٌ مكانها الشريط؛  */}
        {/* وما يبدّل شكل العرض وحده يبقى مفتاحاً داخل شاشته — ولهذا تبقى   */}
        {/* «مصفوفة الأيام» مفتاحاً داخل تقرير الفترة لا وجهة رابعة.        */}
        {/* ============================================================= */}
        {activeSection && activeSection.id === 'attendance' && (
            <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <div className="w-full sm:w-auto min-w-0">
                <Segmented
                    ariaLabel="شاشات الوحدات والموقف"
                    stackBelow="none"
                    options={[
                        // الاسم كاملاً عمداً: هذه الشاشة مكان سلّة العمل الإضافي، ومن يبحث عن
                        // الكشف الشهري يبحث عنه باسمه. قُصِّر مرة لأنه كان يلتفّ داخل صندوق ضيّق،
                        // ثم أُزيل الصندوق — والتلميح وحده لا يظهر على الهاتف واللوح.
                        { value: 'roster', icon: '👥', label: 'ملاك الوحدات والعمل الإضافي',
                          title: 'ملاك كل وحدة — ومنه تُحدَّد أسماء كشف العمل الإضافي الموحد للشعبة' },
                        { value: 'dailyStatus', icon: '📋', label: 'الموقف اليومي',
                          title: 'موقف وحضور اليوم' },
                        { value: 'periodReport', icon: '📊', label: 'ضبط الوقت',
                          title: 'موقف الحضور والدوام لفترة محددة — ومنه مصفوفة الأيام' }
                    ]}
                    value={unitsSubView}
                    onChange={setUnitsSubView}
                />
                </div>
                {/* بحث واحد للشاشات الثلاث (حالة periodSearchQuery نفسها التي يقرؤها «ضبط الوقت»)،
                    فيبقى النص عند التنقل بينها. في الملاك يعرض المطابقين من كل الوحدات، وفي الموقف
                    اليومي يُبقي صفوفهم وحدها — انظر UnitsScreen. */}
                {/* لون مميّز والبحث فعّال: ما تحته مُصفّى، لا موظفون مفقودون */}
                <div className={`flex-1 min-w-[12rem] sm:max-w-sm flex items-center gap-2 border rounded-xl px-3 py-2 shadow-sm focus-within:border-indigo-500 ${periodSearchQuery.trim() ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-300'}`}>
                    <span className="text-slate-400 text-sm">🔍</span>
                    <input
                        type="text"
                        value={periodSearchQuery}
                        onChange={(e) => setPeriodSearchQuery(e.target.value)}
                        placeholder="بحث بالاسم أو الرقم الوظيفي..."
                        aria-label="بحث بالاسم أو الرقم الوظيفي في الوحدات"
                        className="w-full min-w-0 outline-none font-bold text-slate-800 text-xs md:text-sm bg-transparent"
                    />
                    {periodSearchQuery && (
                        <button onClick={() => setPeriodSearchQuery('')} title="مسح البحث" aria-label="مسح البحث"
                            className="text-slate-400 hover:text-slate-700 font-black text-sm leading-none cursor-pointer">✕</button>
                    )}
                </div>
            </div>
        )}
    </nav>
        );
    })();
};
