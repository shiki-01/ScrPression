import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from 'tailwindcss';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	css: {
		postcss: {
			plugins: [tailwindcss],
		},
	},
	onwarn: (warning, handler) => {
		if (warning.code === 'a11y-click-events-have-key-events') return;
		handler(warning);
	}
};

export default config;
