import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()],
		build: {
			lib: {
				entry: resolve('src/main/index.ts'),
				name: 'main'
			}
		}
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
		build: {
			lib: {
				entry: resolve('src/preload/index.ts'),
				name: 'preload',
				formats: ['cjs']
			}
		}
	},
	renderer: {
		plugins: [react()],
		resolve: {
			alias: {
				$: resolve('src/renderer/src'),
				$lib: resolve('src/renderer/lib')
			}
		},
		build: {
			rollupOptions: {
				input: resolve('src/renderer/index.html')
			}
		}
	}
});
