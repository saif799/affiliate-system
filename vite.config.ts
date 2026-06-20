import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    nitro(),
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  server: {
    // يحترم متغيّر PORT (تعيين تلقائي من أدوات المعاينة) ويبقى 3000 افتراضياً
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    watch: {
      // مخرجات graphify مولَّدة — لا تُعِد تحميل الخادم عند كل `graphify update`
      ignored: ['**/graphify-out/**'],
    },
  },
})

export default config
