import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	root: path.resolve(__dirname, 'src/renderer'),
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/renderer/lib', import.meta.url))
		}
	},
	server: {
		port: 5173
	}
});
