import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	optimizeDeps: {
		include: ['puppeteer', 'puppeteer-core'],
		esbuildOptions: {
			target: 'esnext',
		},
	},
	build: {
		commonjsOptions: {
			include: [/node_modules/],
		},
		target: 'esnext',
	},
	server: {
		allowedHosts: ['regtest-front-dev'],
	},
});
