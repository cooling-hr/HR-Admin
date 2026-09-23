import React from 'react';
import ReactDOM from 'react-dom';
import { createStaffSystem } from '../../app/StaffSystem.jsx';
import { useOfflineDataLayer } from '../../data/offline/useOfflineDataLayer.js';
import * as AuthViews from './AuthViews.jsx';

// مدخل النسخة الأوفلاين: يربط الجسم المشترك بطبقة بيانات هذه النسخة وكتلها الخاصة، ثم يركّبه.
// الاستيراد الوحيد لطبقة البيانات في كل النظام هنا — لا في الجسم المشترك.
const StaffSystem = createStaffSystem({ useDataLayer: useOfflineDataLayer, AuthViews });

ReactDOM.render(<StaffSystem />, document.getElementById('root'));
