import React from 'react';

// نافذة استيراد نص JSON منسوخ (للهواتف). الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const PasteJsonModal = ({ ctx }) => {
    const { pastedJsonText, setIncomingBundle, setIncomingStaff, setPastedJsonText, setShowMergeModal, setShowPasteModal } = ctx;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fadeIn no-print">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
                <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white p-6 text-center relative flex-shrink-0">
                    <button
                        onClick={() => { setShowPasteModal(false); setPastedJsonText(''); }}
                        aria-label="إغلاق" title="إغلاق (Esc)"
                        className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition"
                    >
                        ✕
                    </button>
                    <div className="text-4xl mb-3">📋</div>
                    <h3 className="text-lg font-bold">استيراد قاعدة البيانات بنسخ ولصق النص</h3>
                    <p className="text-teal-100 text-xs mt-1.5 opacity-90">
                        انسخ محتوى ملف الاحتياط (JSON) من هاتفك، ثم الصقه في المربع أدناه:
                    </p>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
                    <textarea
                        rows="8"
                        placeholder="الصق نص الـ JSON هنا..."
                        value={pastedJsonText}
                        onChange={(e) => setPastedJsonText(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl outline-none focus:border-teal-500 font-mono text-xs text-left"
                        style={{ direction: 'ltr' }}
                    ></textarea>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-between border-t border-slate-100 flex-shrink-0">
                    <button 
                        onClick={() => {
                            setShowPasteModal(false);
                            setPastedJsonText('');
                        }}
                        className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition"
                    >
                        إلغاء العملية
                    </button>
                    <button 
                        onClick={() => {
                            try {
                                let text = pastedJsonText.trim();
                                if (!text) throw new Error('يرجى لصق النص أولاً');

                                // تنظيف ذكي لعلامات الاقتباس الملتوية/الذكية التي تستبدلها كيبورد الهواتف تلقائياً
                                text = text
                                    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\u2033\u2036]/g, '"')  // علامات الاقتباس المزدوجة الذكية
                                    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035`]/g, "'");         // علامات الاقتباس المفردة الذكية

                                const data = JSON.parse(text);

                                let incomingList = [];
                                if (Array.isArray(data)) {
                                    incomingList = data;
                                } else if (data && (Array.isArray(data.staff) || Array.isArray(data.staffData))) {
                                    incomingList = data.staff || data.staffData;
                                } else {
                                    throw new Error('تنسيق البيانات غير صحيح');
                                }

                                // اللصق كالملف: تُحفظ الحزمة ولا يُطبَّق منها شيء قبل الاختيار. كان اللصق يُسقطها كلياً،
                                // فيخرج «الاستبدال الكامل» منه ناقصاً: موظفون بلا مواقفهم اليومية ولا إجازاتهم الزمنية.
                                setIncomingBundle(Array.isArray(data) ? null : data);
                                setIncomingStaff(incomingList);
                                setShowMergeModal(true);
                                setShowPasteModal(false);
                                setPastedJsonText('');
                            } catch (err) {
                                alert('❌ خطأ في معالجة النص: ' + err.message + '\n\n💡 نصيحة: تأكد من نسخ ملف الاحتياط بالكامل دون نقصان، وتفادي تعديل النص يدوياً على كيبورد الهاتف لضمان سلامة الرموز.');
                            }
                        }}
                        className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition shadow-md"
                    >
                        ✓ معالجة واستيراد البيانات
                    </button>
                </div>
            </div>
        </div>
    );
};
