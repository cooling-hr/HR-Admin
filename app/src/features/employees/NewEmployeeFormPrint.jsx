import React from 'react';

// معاينة وطباعة استمارة موظف جديد. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const NewEmployeeFormPrint = ({ ctx }) => {
    const { setShowPrintForm } = ctx;
    return (
        <div className="preview-overlay">
            <div className="preview-container" style={{maxWidth: '850px', width: '100%'}}>
                <div className="preview-header no-print">
                    <div>
                        <h2 className="text-2xl font-bold">🖨️ طباعة استمارة موظف جديد</h2>
                        <p className="text-sm mt-1 opacity-90">يمكنك معاينة الاستمارة قبل طباعتها</p>
                    </div>
                    <button onClick={() => setShowPrintForm(false)}
                        className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg transition">
                        ✕ إغلاق
                    </button>
                </div>

                <div className="preview-body paper-sheet p-8 bg-white text-black font-sans" style={{maxHeight: '75vh', overflowY: 'auto'}} dir="rtl">
                    {/* رأس الاستمارة الرسمي */}
                    <div className="text-center border-b-2 border-black pb-4 mb-6">
                        <h1 className="text-xl font-bold mb-1">جمهورية العراق</h1>
                        <h1 className="text-xl font-bold mb-1">وزارة النفط / شركة نفط البصرة</h1>
                        <h2 className="text-lg font-bold mb-1 text-gray-700">هيأة الصيانة الهندسية</h2>
                        <h2 className="text-base font-bold mb-1 text-gray-600">قسم التكييف والتبريد / شعبة تبريد المركز ومحطة عزل نهر بن عمر</h2>
                        <div className="h-1 bg-blue-800 w-24 mx-auto my-2 no-print"></div>
                        <h2 className="text-2xl font-black mt-3 text-blue-900 border-2 border-blue-900 px-4 py-1.5 inline-block rounded-lg bg-blue-50">
                            استمارة معلومات موظف جديد
                        </h2>
                    </div>

                    {/* حقول الاستمارة في شبكة مرتبة */}
                    <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-sm">

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">الاسم الكامل:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">الرقم الوظيفي:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">العنوان الوظيفي:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">القسم:</span>
                            <span className="flex-1 text-gray-800 font-semibold">قسم التبريد</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline col-span-2">
                            <span className="font-bold text-gray-800 min-w-[100px]">الشعبة:</span>
                            <span className="flex-1 text-gray-800 font-semibold">شعبة تبريد المركز ومحطة عزل نهر بن عمر</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">الموقع:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">الوحدة:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-center">
                            <span className="font-bold text-gray-800 min-w-[100px]">الجنس:</span>
                            <div className="flex gap-8 mr-4">
                                <span className="flex items-center gap-2">
                                    <span className="inline-block w-4 h-4 border border-black rounded"></span>
                                    <span>ذكر</span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="inline-block w-4 h-4 border border-black rounded"></span>
                                    <span>أنثى</span>
                                </span>
                            </div>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[120px]">هاتف أحد الذوي:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">هاتف العمل:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">التولد:</span>
                            <span className="flex-1 text-gray-300">____ / ____ / ________ م</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">رقم العمل:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">تاريخ التعيين:</span>
                            <span className="flex-1 text-gray-300">____ / ____ / ________ م</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">التحصيل الدراسي:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">سنة التخرج:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">الاختصاص الدقيق:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">التوطين (المصرف):</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-baseline">
                            <span className="font-bold text-gray-800 min-w-[100px]">رقم النقال:</span>
                            <span className="flex-1 text-gray-300">...........................................................................</span>
                        </div>


                        <div className="border-b border-gray-400 pb-1 flex items-center col-span-2">
                            <span className="font-bold text-gray-800 min-w-[100px]">قياس البدلة:</span>
                            <div className="flex gap-4 mr-4 flex-wrap">
                                {['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'].map(sz => (
                                    <span key={sz} className="flex items-center gap-1.5">
                                        <span className="inline-block w-4 h-4 border border-black rounded"></span>
                                        <span>{sz}</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="border-b border-gray-400 pb-1 flex items-center col-span-2">
                            <span className="font-bold text-gray-800 min-w-[100px]">قياس حذاء السلامة:</span>
                            <div className="flex gap-4 mr-4 flex-wrap">
                                {['38', '39', '40', '41', '42', '43', '44', '45', '46'].map(sz => (
                                    <span key={sz} className="flex items-center gap-1.5">
                                        <span className="inline-block w-4 h-4 border border-black rounded"></span>
                                        <span>{sz}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* قسم التوقيعات */}
                    <div className="mt-16 pt-8 border-t border-dashed border-gray-400 grid grid-cols-2 text-center text-sm gap-8">
                        {/* عمود فارغ على اليمين ليصبح توقيع الموظف في الجهة اليسرى */}
                        <div></div>
                        <div>
                            <p className="font-bold mb-10 text-gray-800">توقيع المنتسب</p>
                            <p className="text-gray-400">التوقيع: ............................</p>
                            <p className="text-gray-400 mt-2">التاريخ: ____ / ____ / ________ م</p>
                        </div>
                    </div>
                </div>

                <div className="preview-footer no-print">
                    <button onClick={() => setShowPrintForm(false)}
                        className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-lg transition shadow-lg">
                        ✕ إغلاق
                    </button>
                    <button onClick={() => window.print()}
                        className="px-12 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-750 text-white rounded-lg font-bold text-lg shadow-xl transition">
                        🖨️ طباعة الاستمارة
                    </button>
                </div>
            </div>
        </div>
    );
};
