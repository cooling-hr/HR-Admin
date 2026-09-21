import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// النسخة تُحدَّد بـ --mode: offline | cloud
export default defineConfig(({ mode }) => {
  // لا استنتاج صامت: أي وضع آخر (بما فيه `production` الافتراضي أو خطأ كتابة) يوقف البناء،
  // كي لا يُنشَر نسخة بدل الأخرى وهو ينجح ظاهرياً
  if (!['offline', 'cloud'].includes(mode)) {
    throw new Error(`vite: --mode يجب أن يكون offline أو cloud، وصل: ${mode}`);
  }
  const edition = mode;
  return {
    // الكود القديم يستعمل React.createElement مباشرة ويعرّف React بنفسه، فالنمط الكلاسيكي هو الأمين
    plugins: [react({ jsxRuntime: 'classic' }), viteSingleFile()],
    publicDir: edition === 'cloud' ? 'public' : false,
    build: {
      outDir: `dist/${edition}`,
      emptyOutDir: true,
      chunkSizeWarningLimit: 5000,
      // لا تُمَسّ أنماط CSS في المرحلة 0. مُصغِّر Vite 8 الافتراضي (Lightning CSS) أعاد كتابة
      // طبقة الوضع الليلي وأنماط الطباعة: white→#fff، transparent→0 0، ::before→:before،
      // nth-child(even)→2n، والأخطر (min-width: 640px)→(width>=640px) وهي صياغة لا تفهمها
      // المتصفحات الأقدم فتسقط القاعدة بصمت. الفرق ~16 كيلوبايت فقط مقابل تطابق مضمون.
      cssMinify: false,
      rollupOptions: { input: `hr-${edition}.html` },
    },
  };
});
