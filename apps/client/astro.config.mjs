// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import clerk from '@clerk/astro';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	devToolbar: {
		enabled: true,
	},
	output: 'server',
	server: { port: 3000, host: true },
	adapter: node({ mode: 'standalone' }),
	integrations: [clerk({ signInUrl: '/login', signUpUrl: '/signup' }), react()],
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
