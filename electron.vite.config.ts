import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
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
				name: 'preload'
			}
		}
	},
	renderer: {
		plugins: [svelte()],
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