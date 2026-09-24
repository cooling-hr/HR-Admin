import React from 'react';
import { CONTRACT_TITLES, isContractEmployee } from '../../domain/employees';

// نافذة إضافة/تعديل بيانات الموظف. الحالة والمنطق في StaffSystem؛ هذا المكوّن يرسم فقط ويستلم ما يحتاجه
// عبر ctx صريح. شرط الظهور يبقى عند موضع الاستدعاء.
export const EditEmployeeModal = ({ ctx }) => {
    const { buildDatePicker, canEdit, cancelEdit, capturePhoto, editingEmployee, saveEmployeeEdit, showCamera, staff, startCamera, stopCamera, updateEditField, videoRef } = ctx;
    return (
                <div className="preview-overlay">
                    <div className="preview-container" style={{maxWidth: '800px'}}>
                        <div className="preview-header">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {!staff.some(s => s.id === editingEmployee.id) ? '➕ إضافة موظف جديد' : '✏️ تعديل بيانات الموظف'}
                                </h2>
                                <p className="text-sm mt-1 opacity-90">
                                    {!staff.some(s => s.id === editingEmployee.id) ? 'أدخل البيانات ثم اضغط حفظ' : 'قم بتعديل البيانات ثم اضغط حفظ'}
                                </p>
                            </div>
                        </div>

                        <div className="preview-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
                                    <input type="text" value={editingEmployee.name || ''}
                                        onChange={(e) => updateEditField('name', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none"
                                        placeholder="أدخل الاسم الكامل للموظف" />
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                                    <div className="text-sm text-gray-600 mb-1">الرقم الوظيفي</div>
                                    <input type="text" value={editingEmployee.jobNumber || ''}
                                        onChange={(e) => updateEditField('jobNumber', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none bg-white"
                                        placeholder="أدخل الرقم الوظيفي" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">العنوان الوظيفي</label>
                                    <input type="text" value={editingEmployee.jobTitle}
                                        onChange={(e) => updateEditField('jobTitle', e.target.value)}
                                        list="contractTitleSuggestions"
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
                                    {/* اقتراحات صنفَي العقود دون تقييد الحقل — بقية العناوين تُكتب بحرية */}
                                    <datalist id="contractTitleSuggestions">
                                        {CONTRACT_TITLES.map(t => <option key={t} value={t} />)}
                                    </datalist>
                                    {isContractEmployee(editingEmployee) && (
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-500">نوع العقد:</span>
                                            {CONTRACT_TITLES.map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => updateEditField('jobTitle', t)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                                        editingEmployee.jobTitle === t
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                                    <div className="text-sm text-gray-600 mb-1">القسم (غير قابل للتعديل)</div>
                                    <div className="text-lg font-bold text-gray-800">{editingEmployee.department}</div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                                    <div className="text-sm text-gray-600 mb-1">الشعبة (غير قابل للتعديل)</div>
                                    <div className="text-lg font-bold text-gray-800">{editingEmployee.section}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">الموقع</label>
                                    <select value={editingEmployee.location}
                                        onChange={(e) => updateEditField('location', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none">
                                        <option value="نهر بن عمر">نهر بن عمر</option>
                                        <option value="باب الزبير">باب الزبير</option>
                                        <option value="المركز الثقافي النفطي">المركز الثقافي النفطي</option>
                                        <option value="المكينة">المكينة</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">الوحدة</label>
                                    <select value={editingEmployee.unit || ''}
                                        onChange={(e) => updateEditField('unit', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none">
                                        <option value="">-- اختر الوحدة --</option>
                                        <option value="مقر الشعبة">مقر الشعبة</option>
                                        <option value="تبريد باب الزبير">تبريد باب الزبير</option>
                                        <option value="ورشة التبريد">ورشة التبريد</option>
                                        <option value="تبريد المكينة">تبريد المكينة</option>
                                        <option value="تبريد نهر بن عمر">تبريد نهر بن عمر</option>
                                        <option value="تبريد المركز الثقافي">تبريد المركز الثقافي</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">طبيعة العمل</label>
                                    <select value={editingEmployee.workType}
                                        onChange={(e) => updateEditField('workType', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none">
                                        <option value="صباحي">صباحي</option>
                                        <option value="مناوب">مناوب</option>
                                    </select>
                                </div>

                                {editingEmployee.workType === 'مناوب' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">الوجبة (الجروب)</label>
                                        <select value={editingEmployee.squad || ''}
                                            onChange={(e) => updateEditField('squad', e.target.value)}
                                            className="w-full px-3 py-2 border-2 rounded-lg border-orange-200 focus:border-orange-500 outline-none bg-orange-50/10">
                                            <option value="">-- اختر الوجبة --</option>
                                            <option value="A">الوجبة A</option>
                                            <option value="B">الوجبة B</option>
                                            <option value="C">الوجبة C</option>
                                            <option value="D">الوجبة D</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">الجنس</label>
                                    <select value={editingEmployee.gender || 'ذكر'}
                                        onChange={(e) => updateEditField('gender', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none">
                                        <option value="ذكر">ذكر</option>
                                        <option value="أنثى">أنثى</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">هاتف العمل</label>
                                    <input type="text" value={editingEmployee.workPhone}
                                        onChange={(e) => updateEditField('workPhone', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">التولد</label>
                                    <input id="edit-birthDate"
                                        ref={el => { if (el) buildDatePicker('edit-birthDate'); }}
                                        type="text"
                                        placeholder="السنة-الشهر-اليوم (مثال: 1985-05-12)"
                                        value={editingEmployee.birthDate || ''}
                                        onChange={(e) => updateEditField('birthDate', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ التعيين</label>
                                    <input id="edit-hireDate"
                                        ref={el => { if (el) buildDatePicker('edit-hireDate'); }}
                                        type="text"
                                        placeholder="السنة-الشهر-اليوم (مثال: 2010-09-15)"
                                        value={editingEmployee.hireDate || ''}
                                        onChange={(e) => updateEditField('hireDate', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">التحصيل الدراسي</label>
                                    <input type="text" value={editingEmployee.education}
                                        onChange={(e) => updateEditField('education', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">الاختصاص</label>
                                    <input type="text" value={editingEmployee.specialization}
                                        onChange={(e) => updateEditField('specialization', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">التوطين</label>
                                    <input type="text" value={editingEmployee.bank}
                                        onChange={(e) => updateEditField('bank', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">النقال</label>
                                    <input 
                                        type="tel" 
                                        value={editingEmployee.mobile}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // السماح فقط بالأرقام
                                            if (value === '' || /^[0-9]*$/.test(value)) {
                                                updateEditField('mobile', value);
                                            }
                                        }}
                                        pattern="^07[0-9]{9}$"
                                        maxLength="11"
                                        placeholder="07XXXXXXXXX"
                                        title="يجب أن يبدأ الرقم بـ 07 ويتكون من 11 رقم"
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none"
                                        dir="ltr"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                        مثال: 07801234567 (11 رقم يبدأ بـ 07)
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">هاتف أحد ذوي الموظف</label>
                                    <input 
                                        type="tel" 
                                        value={editingEmployee.relativePhone || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^[0-9]*$/.test(value)) {
                                                updateEditField('relativePhone', value);
                                            }
                                        }}
                                        maxLength="11"
                                        placeholder="07XXXXXXXXX"
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none"
                                        dir="ltr"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                        مثال: 07801234567 (11 رقم يبدأ بـ 07)
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                                    <input 
                                        type="email" 
                                        value={editingEmployee.email || ''}
                                        onChange={(e) => updateEditField('email', e.target.value)}
                                        placeholder="example@mail.com"
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none"
                                        dir="ltr"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">عنوان السكن</label>
                                    <input 
                                        type="text" 
                                        value={editingEmployee.address || ''}
                                        onChange={(e) => updateEditField('address', e.target.value)}
                                        placeholder="البصرة/الجبيلة"
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none"
                                    />
                                </div>

                            {/* الاستمارة للبيانات الثابتة عن الشخص وحدها. حُذف منها بقرار صريح:
                                حقل «الحالة» القديم ومحرّر «الفترات المؤرَّخة» — الموقف يُدخَل حصراً من شاشة
                                الموقف اليومي والنافذة السريعة؛ ومربّع «مستثنى دائماً من قوائم الماء» —
                                الاستثناء يُحدَّد بالكود لا بإدخال المستخدم. لم يُحذف أي حقل من البيانات:
                                emp.status تقرؤه عشرات المواضع، و statusPeriods مصدر الموقف المعتمد،
                                و excludeFromWaterLists ما زال يُقرأ في isExcludedFromWater ويُضبَط برمجياً. */}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">قياس البدلة</label>
                                    <select value={editingEmployee.uniformSize || ''}
                                        onChange={(e) => updateEditField('uniformSize', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none">
                                        <option value="">-- اختر القياس --</option>
                                        <option value="S">S</option>
                                        <option value="M">M</option>
                                        <option value="L">L</option>
                                        <option value="XL">XL</option>
                                        <option value="XXL">XXL</option>
                                        <option value="XXXL">XXXL</option>
                                        <option value="XXXXL">XXXXL</option>
                                        <option value="XXXXXL">XXXXXL (5XL)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">قياس حذاء السلامة</label>
                                    <select value={editingEmployee.shoeSafetySize || ''}
                                        onChange={(e) => updateEditField('shoeSafetySize', e.target.value)}
                                        className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none">
                                        <option value="">-- اختر القياس --</option>
                                        <option value="38">38</option>
                                        <option value="39">39</option>
                                        <option value="40">40</option>
                                        <option value="41">41</option>
                                        <option value="42">42</option>
                                        <option value="43">43</option>
                                        <option value="44">44</option>
                                        <option value="45">45</option>
                                        <option value="46">46</option>
                                        <option value="47">47</option>
                                    </select>
                                </div>

                                {/* حُذف «تاريخ آخر تجهيز معدات» من الاستمارة: ليس حالة دائمة للموظف،
                                    ومكانه الطبيعي تبويب السلامة حيث يُسجَّل مع كل تجهيز.
                                    الحقل lastSafetyDelivery نفسه باقٍ في البيانات والاستيراد والتصدير والفلاتر. */}

                            {/* قسم الأولويات الإدارية — فارغة لمعظم الموظفين، تُضبَط فقط لمن يحتاج
                                أولوية ترتيب خاصة أو إعفاء سلامة (كانت أسماء/أرقام مُضمَّنة في الكود العام،
                                نُقلت إلى بيانات الموظف نفسه لأن المستودع عام على GitHub) */}
                            <div className="col-span-1 md:col-span-2 border-t border-gray-200 pt-6 mt-2">
                                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <span>⭐</span>
                                    <span>أولويات الترتيب والاستثناءات الإدارية (اختياري)</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">أولوية عامة تسبق كل الوحدات</label>
                                        <input type="number" value={editingEmployee.globalPriorityRank ?? ''}
                                            onChange={(e) => updateEditField('globalPriorityRank', e.target.value === '' ? undefined : Number(e.target.value))}
                                            placeholder="فارغ = بلا أولوية"
                                            className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
                                        <div className="text-xs text-gray-500 mt-1">الرقم الأصغر يظهر أولاً</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">أولوية ضمن وحدته فقط</label>
                                        <input type="number" value={editingEmployee.unitPriorityRank ?? ''}
                                            onChange={(e) => updateEditField('unitPriorityRank', e.target.value === '' ? undefined : Number(e.target.value))}
                                            placeholder="فارغ = بلا أولوية"
                                            className="w-full px-3 py-2 border-2 rounded-lg focus:border-blue-500 outline-none" />
                                        <div className="text-xs text-gray-500 mt-1">الرقم الأصغر يظهر أولاً</div>
                                    </div>
                                    <div className="flex items-end pb-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={!!editingEmployee.safetyRosterExempt}
                                                onChange={(e) => updateEditField('safetyRosterExempt', e.target.checked)}
                                                className="w-4 h-4" />
                                            استثناء من قائمة معدات السلامة
                                        </label>
                                    </div>
                                </div>
                            </div>

                                {/* قسم الصورة الشخصية والوثائق الرسمية */}
                                <div className="col-span-1 md:col-span-2 border-t border-gray-200 pt-6 mt-2">
                                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                                        <span>✨</span>
                                        <span>الصورة الشخصية والوثائق الرسمية للمنتسب</span>
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* الجزء الأيمن: الصورة الشخصية */}
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                                            <label className="block text-xs font-bold text-slate-700 mb-3 self-start">👤 الصورة الشخصية للموظف</label>

                                            {/* معاينة الصورة */}
                                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center mb-4 relative group">
                                                {editingEmployee.photo ? (
                                                    <>
                                                        <img src={editingEmployee.photo} className="w-full h-full object-cover" alt="معاينة" />
                                                        <button onClick={() => updateEditField('photo', '')} 
                                                            className="absolute inset-0 bg-red-600 bg-opacity-70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm">
                                                            🗑️ إزالة الصورة
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-5xl text-slate-400">👤</span>
                                                )}
                                            </div>

                                            {/* أدوات التحكم بالصورة */}
                                            {!showCamera ? (
                                                <div className="flex gap-2 w-full">
                                                    <label className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow cursor-pointer text-center flex items-center justify-center gap-1.5">
                                                        <span>📁 رفع من الجهاز</span>
                                                        <input type="file" accept="image/*" className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (event) => {
                                                                        // ضغط الصورة باستخدام canvas
                                                                        const img = new Image();
                                                                        img.src = event.target.result;
                                                                        img.onload = () => {
                                                                            const canvas = document.createElement('canvas');
                                                                            canvas.width = 250;
                                                                            canvas.height = 250;
                                                                            const ctx = canvas.getContext('2d');
                                                                            ctx.drawImage(img, 0, 0, 250, 250);
                                                                            const compressedUrl = canvas.toDataURL('image/jpeg', 0.8);
                                                                            updateEditField('photo', compressedUrl);
                                                                        };
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }} />
                                                    </label>
                                                    <button onClick={startCamera}
                                                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow flex items-center justify-center gap-1.5">
                                                        <span>📷 التقاط بالكاميرا</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-full bg-black rounded-lg p-2 flex flex-col items-center">
                                                    <video ref={videoRef} className="w-48 h-48 object-cover rounded bg-slate-900 mb-2 border border-slate-700" playinline="true" muted></video>
                                                    <div className="flex gap-2 w-full">
                                                        <button onClick={capturePhoto}
                                                            className="flex-1 py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded text-xs transition">
                                                            📸 التقاط الآن
                                                        </button>
                                                        <button onClick={stopCamera}
                                                            className="flex-1 py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded text-xs transition">
                                                            ✕ إلغاء
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* الجزء الأيسر: الوثائق الرسمية المتعددة */}
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                                            <label className="block text-xs font-bold text-slate-700 mb-2">📁 الوثائق الرسمية للموظف ({editingEmployee.documents ? editingEmployee.documents.length : 0})</label>
                                            <p className="text-[10px] text-slate-500 mb-3">يمكنك رفع عدة وثائق مثل البطاقة الموحدة، بطاقة السكن، العقود وغير ذلك (PDF وصور).</p>

                                            {/* زر رفع وثائق */}
                                            <label className="w-full py-3 px-4 bg-white border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl transition text-center cursor-pointer font-bold text-slate-600 hover:text-indigo-700 text-sm flex items-center justify-center gap-2 mb-4">
                                                <span>📎 إضافة وثائق رسمية جديدة</span>
                                                <input type="file" multiple accept="image/*,.pdf" className="hidden"
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files);
                                                        files.forEach(file => {
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                const base64Data = event.target.result;
                                                                const newDoc = {
                                                                    id: Date.now() + Math.random(),
                                                                    name: file.name,
                                                                    type: file.type,
                                                                    data: base64Data
                                                                };
                                                                const docs = editingEmployee.documents || [];
                                                                updateEditField('documents', [...docs, newDoc]);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        });
                                                        e.target.value = ''; // تفريغ المدخل
                                                    }} />
                                            </label>

                                            {/* قائمة الوثائق المرفوعة */}
                                            <div className="flex-1 overflow-y-auto max-h-[140px] space-y-2 pr-1">
                                                {editingEmployee.documents && editingEmployee.documents.length > 0 ? (
                                                    editingEmployee.documents.map((doc) => (
                                                        <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-xs">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="text-lg">{doc.type.includes('pdf') ? '📄' : '🖼️'}</span>
                                                                <span className="font-semibold text-slate-700 truncate max-w-[150px] md:max-w-[200px]" title={doc.name}>{doc.name}</span>
                                                            </div>
                                                            <div className="flex gap-1.5 flex-shrink-0">
                                                                <a href={doc.data} download={doc.name}
                                                                    className="w-7 h-7 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold transition shadow-sm" title="تحميل">
                                                                    📥
                                                                </a>
                                                                <button onClick={() => {
                                                                    const updatedDocs = editingEmployee.documents.filter(d => d.id !== doc.id);
                                                                    updateEditField('documents', updatedDocs);
                                                                }} className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold transition shadow-sm" title="حذف">
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center py-6 text-slate-400">
                                                        <span className="text-3xl mb-1">📭</span>
                                                        <span className="text-xs">لا توجد وثائق مرفوعة حالياً</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="preview-footer flex items-center justify-between gap-3">
                            <button onClick={cancelEdit}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold text-sm transition shadow-md cursor-pointer">
                                ✕ إغلاق
                            </button>
                            {canEdit('staffMaster') ? (
                                <button onClick={saveEmployeeEdit}
                                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-sm shadow-xl transition cursor-pointer flex items-center gap-2">
                                    <span>✅</span>
                                    <span>حفظ التعديلات</span>
                                </button>
                            ) : (
                                <div className="text-xs text-amber-800 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-300 font-bold flex items-center gap-1.5 shadow-sm">
                                    <span>👁️</span>
                                    <span>وضع الاطلاع والطباعة فقط (تعديل بيانات الملاك مخصص لمدير النظام أو المخولين)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
};
