// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

const isBuild = process.argv.includes('build');
if (!isBuild && !process.env.NODE_ENV) {
	process.env.NODE_ENV = 'development';
}

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
	prefetch: {
		prefetchAll: false,
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
		inlineStylesheets: 'always',
	},
	adapter: vercel(),
	integrations: [react()],
  vite: {
    resolve: {
      preserveSymlinks: true,
    },
    cacheDir: isBuild ? 'node_modules/.vite/build' : 'node_modules/.vite/dev',
    server: {
      watch: {
        ignored: ['**/.vercel/**', '**/dist/**'],
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
