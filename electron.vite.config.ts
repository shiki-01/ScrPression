import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()],
		build: {
			lib: {
				entry: resolve('src/main/index.ts'),
				name: 'main'
			},
			rollupOptions: {
				output: {
					format: 'es'
				}
			}
		}
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
		build: {
			lib: {
				entry: resolve('src/preload/index.ts'),
				name: 'preload'
			},
			rollupOptions: {
				output: {
					format: 'es'
				}
			}
		}
	},
	renderer: {
		plugins: [svelte(), tailwindcss()],
		resolve: {
			alias: {
				$: resolve('src/renderer/src'),
				$lib: resolve('src/renderer/src/lib')
			}
		},
		build: {
			rollupOptions: {
				input: resolve('src/renderer/index.html')
			}
		}
	}
});