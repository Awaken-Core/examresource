// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	site: process.env.PUBLIC_SITE_URL,
	devToolbar: {
		enabled: false,
	},
	output: 'server',
	compressHTML: true,
	server: { port: Number(process.env.PORT || 3000), host: true },
	adapter: vercel(),
	integrations: [],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'astro/virtual-modules/transitions-events.js',
        'astro/virtual-modules/transitions-router.js',
        'astro/virtual-modules/transitions-swap-functions.js',
        'astro/virtual-modules/transitions-types.js',
      ],
    },
  },
});
