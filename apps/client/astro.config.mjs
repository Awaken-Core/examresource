// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';

// https://astro.build/config
export default defineConfig({
	site: process.env.PUBLIC_SITE_URL,
	devToolbar: {
		enabled: false,
	},
	output: 'server',
	compressHTML: true,
	server: { port: Number(process.env.PORT), host: true },
	adapter: vercel(),
	integrations: [clerk()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@clerk/astro/internal',
        'astro/virtual-modules/transitions-events.js',
        'astro/virtual-modules/transitions-router.js',
        'astro/virtual-modules/transitions-swap-functions.js',
        'astro/virtual-modules/transitions-types.js',
      ],
    },
  },
});
