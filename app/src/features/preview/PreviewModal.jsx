import React from 'react';

// نافذة معاينة الجداول وتصديرها. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const PreviewModal = ({ ctx }) => {
    const { ALL_CUSTOM_COLUMNS, dataEntryOperator, exportExcel, exportUnits, getColSpan, isCustomizable, previewData, previewTitle, printOrientation, printPreview, selectedUnit, setPreviewTitle, setPrintOrientation, setShowPreview, setVisiblePreviewColumns, shareViaWhatsApp, updateCell, view, visiblePreviewColumns, waterMonth } = ctx;
    return (
        <div className="preview-overlay">
            <div className="preview-container">
                <div className="preview-header">
                    <div>
                        <h2 className="text-2xl font-bold">
                             {previewTitle || (
                              view === 'shift' ? 'جدول المناوبين' : 
                              view === 'morning' ? 'جدول الصباحي' : 
                              view === 'contract' ? 'جدول العقود (موظفو العقود)' : 
                              view === 'maa' ? `جدول الماء - ${waterMonth}` :
                              view === 'maaMorning' ? `ماء صباحي - ${waterMonth}` :
                              view === 'maaShift' ? `ماء مناوبين - ${waterMonth}` :
                              view === 'evaluation' ? 'جدول التقييم' : 
                              view === 'units' && selectedUnit ? `منتسبو ${selectedUnit.name}` :
                              view === 'dashboard' ? 'نتائج البحث والاستعلام' :
                              'الملاك الكامل')}
                        </h2>
                        <p className="text-sm mt-1 opacity-90">
                            يمكنك التعديل قبل التصدير • العقود في النهاية • الاسم الثلاثي
                        </p>
                    </div>
                    <button onClick={() => { setShowPreview(false); setPreviewTitle(''); }} className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg transition">
                        ✕ إغلاق
                    </button>
                </div>

                <div className="preview-body">
                    {/* لوحة تخصيص الأعمدة التفاعلية */}
                    {(view === 'dashboard') && (
                        <div className="no-print mb-6 p-4 bg-teal-50 bg-opacity-50 rounded-xl border border-teal-200 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-bold text-teal-800 flex items-center gap-1.5">
                                    <span>⚙️</span>
                                    <span>تخصيص أعمدة الجدول والتصدير:</span>
                                </h4>
                                <div className="flex gap-2">
                                    <button onClick={() => setVisiblePreviewColumns(ALL_CUSTOM_COLUMNS)}
                                        className="px-2.5 py-1 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition shadow-sm">
                                        ✓ تحديد الكل
                                    </button>
                                    <button onClick={() => setVisiblePreviewColumns([])}
                                        className="px-2.5 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition">
                                        ✕ إلغاء الكل
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {ALL_CUSTOM_COLUMNS.map((col) => {
                                    const isChecked = visiblePreviewColumns.includes(col);
                                    return (
                                        <label key={col} 
                                            className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg border-2 cursor-pointer transition select-none text-xs font-bold ${
                                                isChecked 
                                                    ? 'bg-teal-100 border-teal-500 text-teal-900 shadow-sm' 
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-teal-50/30'
                                            }`}>
                                            <input type="checkbox" checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setVisiblePreviewColumns([...visiblePreviewColumns, col]);
                                                    } else {
                                                        setVisiblePreviewColumns(visiblePreviewColumns.filter(c => c !== col));
                                                    }
                                                }}
                                                className="hidden" />
                                            <span>{isChecked ? '🟢' : '⚪'}</span>
                                            <span className="truncate">{col}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <table className="preview-table">
                        <thead>
                            <tr>
                                {previewData.length > 0 && previewData.find(d => d.type === 'data') && 
                                 Object.keys(previewData.find(d => d.type === 'data'))
                                    .filter(k => !['type', 'isFirst', 'location', 'locationSize', 'startRow', 'endRow', 'rowIndex'].includes(k) &&
                                                 (!isCustomizable || ['ت', 'الاسم الكامل', 'الأسم الكامل', 'الأسم الثلاثي', 'الاسم'].includes(k) || visiblePreviewColumns.includes(k)))
                                    .map((key, i) => <th key={i}>{key}</th>)
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {previewData.map((row, idx) => {
                                if (row.type === 'page_break') return null; // ليس صفاً فعلياً — مجرد علامة يقرأها الصف التالي أدناه
                                // الصف التالي مباشرة لعلامة فاصل صفحة يحمل صنف الطباعة
                                // (لا صف فارغ منفصل — ملاحظة Codex: صف فارغ فعلي قد يطبع
                                // بحدوده وحشوه الخاصين فيُنتج فجوة أو صفاً فارغاً ظاهراً)
                                const needsPageBreak = idx > 0 && previewData[idx - 1].type === 'page_break';
                                if (row.type === 'signature_footer') {
                                    // تذييل توقيع مستقل بنهاية كل مجموعة (صباحي/ثلاثية/
                                    // ثنائية) في قائمة الماء الموحّدة — نفس محتوى تذييل
                                    // الصفحة الواحد أدناه، مكرَّر هنا داخل الجدول ليظهر
                                    // في نهاية صفحة كل مجموعة تحديداً لا نهاية المستند فقط
                                    return (
                                        <tr key={idx} className={`signature-footer-row ${needsPageBreak ? 'print-page-break' : ''}`}>
                                            <td colSpan={getColSpan()} className="signature-footer-cell">
                                                <div className="flex justify-between items-center text-slate-950 font-black text-sm md:text-base px-8 pt-10 pb-3">
                                                    <p className="font-black text-base md:text-lg text-slate-950">مسؤول الإدارة</p>
                                                    <p className="font-black text-base md:text-lg text-slate-950">مسؤول الشعبة</p>
                                                </div>
                                                <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-700 font-bold px-2">
                                                    <span>منظم الموقف: <strong className="text-slate-950 font-black">{dataEntryOperator || '....................'}</strong></span>
                                                    <span>تاريخ الطباعة والتنظيم: <strong className="text-slate-950 font-black font-mono">{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })}</strong> ({new Date().toISOString().split('T')[0]})</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }
                                if (row.type === 'separator') {
                                    return (
                                        <tr key={idx} className={needsPageBreak ? 'print-page-break' : ''}>
                                            <td colSpan={getColSpan()} className="location-separator">{row.content}</td>
                                        </tr>
                                    );
                                }
                                const isFirstInLocation = row.isFirst && view === 'shift';

                                return (
                                    <tr key={idx} className={needsPageBreak ? 'print-page-break' : ''}>
                                        {Object.entries(row)
                                            .filter(([k]) => !['type', 'isFirst', 'location', 'locationSize', 'startRow', 'endRow', 'rowIndex'].includes(k) &&
                                                             (!isCustomizable || ['ت', 'الاسم الكامل', 'الأسم الكامل', 'الأسم الثلاثي', 'الاسم'].includes(k) || visiblePreviewColumns.includes(k)))
                                            .map(([key, value], i) => {
                                                if (key === 'مبررات التشغيل' && !isFirstInLocation) {
                                                    return null;
                                                }

                                                return (
                                                    <td key={i} 
                                                        rowSpan={isFirstInLocation && key === 'مبررات التشغيل' ? row.locationSize : 1}
                                                        className={isFirstInLocation && key === 'مبررات التشغيل' ? 'merged-cell vertical-text' : ''}>
                                                        {key === 'ت' ? (
                                                            <span className="font-bold text-gray-700">{value}</span>
                                                        ) : (
                                                            <input type="text" value={value || ''}
                                                                onChange={(e) => updateCell(idx, key, e.target.value)}
                                                                className="editable-cell" />
                                                        )}
                                                    </td>
                                                );
                                            })
                                        }
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* قسم عناوين التوقيعات النظيفة — يُخفى إن كان كل مجموعة تحمل تذييلها
                        الخاص بنهايتها داخل الجدول بالفعل (previewData بها signature_footer)،
                        وإلا لظهر تذييل مكرَّر عديم الفائدة بعد تذييل آخر مجموعة مباشرة */}
                    {!previewData.some(d => d.type === 'signature_footer') && (
                    <>
                    <div className="preview-signatures-row mt-52 mb-14 px-12 flex justify-between items-center text-slate-950 font-black text-sm md:text-base">
                        <div className="text-right">
                            <p className="font-black text-base md:text-lg text-slate-950">مسؤول الإدارة</p>
                        </div>
                        <div className="text-left">
                            <p className="font-black text-base md:text-lg text-slate-950">مسؤول الشعبة</p>
                        </div>
                    </div>

                    {/* تذييل الورقة نزلت بنفس المقدار التناسبي أسفل التوقيعات بخط أصغر في نهاية الورقة */}
                    <div className="preview-page-footer pt-3 mt-48 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-700 font-bold px-2">
                        <span>منظم الموقف: <strong className="text-slate-950 font-black">{dataEntryOperator || '....................'}</strong></span>
                        <span>تاريخ الطباعة والتنظيم: <strong className="text-slate-950 font-black font-mono">{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })}</strong> ({new Date().toISOString().split('T')[0]})</span>
                    </div>
                    </>
                    )}
                </div>

                <div className="preview-footer">
                    <button onClick={() => { setShowPreview(false); setPreviewTitle(''); }} className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold transition">
                        → رجوع
                    </button>
                    <button onClick={shareViaWhatsApp}
                        className="px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition shadow-lg flex items-center gap-1.5">
                        <span>📲</span>
                        <span>إرسال عبر واتساب</span>
                    </button>

                    <div className="flex items-stretch rounded-lg overflow-hidden border border-slate-300 shadow-sm" title="اتجاه الورقة عند الطباعة">
                        {[['portrait', '📄 عمودي'], ['landscape', '📃 أفقي']].map(([val, label]) => (
                            <button key={val} onClick={() => setPrintOrientation(val)}
                                className={`px-3 py-3 text-sm font-bold transition ${printOrientation === val ? 'bg-purple-500 text-white' : 'bg-white text-purple-700 hover:bg-slate-50'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <button onClick={printPreview}
                        className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-bold transition shadow-lg">
                        🖨️ طباعة
                    </button>

                    <button onClick={() => (view === 'units' && !previewTitle) ? exportUnits() : exportExcel()}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold transition shadow-lg">
                        📥 تصدير Excel
                    </button>
                </div>
            </div>
        </div>
    );
};
