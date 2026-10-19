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
		enabled: process.env.NODE_ENV !== 'production',
	},
	output: 'server',
	compressHTML: true,
	prefetch: {
		defaultStrategy: 'hover',
	},
	server: { port: Number(process.env.PORT || 3000), host: true },
	adapter: vercel(),
	integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 750,
    },
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
