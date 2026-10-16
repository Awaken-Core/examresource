// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';

// https://astro.build/config
export default defineConfig({
	site: 'https://govtpariksha.com',
	devToolbar: {
		enabled: false,
	},
	output: 'server',
	compressHTML: true,
	server: { port: 3000, host: true },
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
