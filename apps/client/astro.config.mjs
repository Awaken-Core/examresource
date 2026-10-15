// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import clerk from '@clerk/astro';

// https://astro.build/config
export default defineConfig({
	devToolbar: {
		enabled: false,
	},
	output: 'server',
	compressHTML: true,
	server: { port: 3000, host: true },
	adapter: node({ mode: 'standalone' }),
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
