import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// النسخة تُحدَّد بـ --mode: offline | cloud
export default defineConfig(({ mode }) => {
  const edition = mode === 'cloud' ? 'cloud' : 'offline';
  return {
    // الكود القديم يستعمل React.createElement مباشرة ويعرّف React بنفسه، فالنمط الكلاسيكي هو الأمين
    plugins: [react({ jsxRuntime: 'classic' }), viteSingleFile()],
    publicDir: edition === 'cloud' ? 'public' : false,
    build: {
      outDir: `dist/${edition}`,
      emptyOutDir: true,
      chunkSizeWarningLimit: 5000,
      rollupOptions: { input: `hr-${edition}.html` },
    },
  };
});
