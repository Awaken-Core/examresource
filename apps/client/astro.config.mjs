// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	site: process.env.PUBLIC_SITE_URL,
	image: {
		remotePatterns: [
			{
				protocol: 'https',
			},
			{
				protocol: 'http',
			},
		],
	},
	devToolbar: {
		enabled: true,
	},
	output: 'server',
	compressHTML: true,
	prefetch: false,
	server: { port: Number(process.env.PORT || 3000), host: true },
	redirects: {
		'/feed': '/rss.xml',
		'/feed/(.*)': '/rss.xml',
	},
	build: {
		inlineStylesheets: 'always',
	},
	adapter: vercel(),
	integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 750,
      modulePreload: false,
      rollupOptions: {},
    },
    optimizeDeps: {
      include: [
        'astro/virtual-modules/transitions-events.js',
        'astro/virtual-modules/transitions-router.js',
      ],
      exclude: [
        'astro/runtime/client/dev-toolbar/entrypoint.js',
      ],
    },
  },
});
