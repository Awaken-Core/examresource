// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

const isBuild = process.argv.includes('build');
if (!isBuild && !process.env.NODE_ENV) {
	process.env.NODE_ENV = 'development';
}

// https://astro.build/config
export default defineConfig({
	site: process.env.PUBLIC_SITE_URL,
	session: false,
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
	prefetch: {
		prefetchAll: true,
		defaultStrategy: 'hover',
	},
	server: { port: Number(process.env.PORT || 3000), host: true },
	redirects: {
		'/feed': '/rss.xml',
		'/feed/(.*)': '/rss.xml',
		'/live-tests': '/test-series',
		'/live-tests/(.*)': '/test-series',
		'/live-test': '/test-series',
		'/live-test/(.*)': '/test-series',
	},
	build: {
		inlineStylesheets: 'auto',
	},
	adapter: cloudflare(),
	integrations: [react()],
  vite: {
    cacheDir: isBuild ? 'node_modules/.vite/build' : 'node_modules/.vite/dev',
    server: {
      watch: {
        ignored: ['**/.wrangler/**', '**/dist/**'],
      },
    },
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
        '@tiptap/core',
        '@tiptap/starter-kit',
        '@tiptap/extension-youtube',
        '@tiptap/extension-table',
        '@tiptap/extension-character-count',
        'marked',
        'turndown',
        'dompurify',
        'astro/runtime/client/dev-toolbar/entrypoint.js',
      ],
    },
  },
});
