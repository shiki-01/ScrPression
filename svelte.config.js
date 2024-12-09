import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: false
	},
	kit: {
		adapter: adapter({
			fallback: 'index.html',
			precompress: false,
			strict: false,
			pages: 'build',
			assets: 'build'
		}),
		paths: {
			base: ''
		},
		files: {
			lib: 'src/lib',
			routes: 'src/routes',
			assets: 'static',
		}
	},
	onwarn: (warning, handler) => {
		if (warning.code === 'a11y-click-events-have-key-events') return;
		handler(warning);
	}
};

export default config;
