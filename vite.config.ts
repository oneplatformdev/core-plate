import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve, join, extname, relative } from 'node:path'


import dts from 'vite-plugin-dts';
import { globSync } from 'glob';
import { external } from "./external.ts";

// https://vite.dev/config/
export default defineConfig(() => ({
	root: __dirname,
	plugins: [
		react(), tsconfigPaths(), svgr(),
		dts({
			entryRoot: 'src',
			tsconfigPath: join(__dirname, 'tsconfig.app.json'),
			bundledPackages: [ '@oneplatformdev/plate' ],
		}) ],
	build: {
		outDir: './dist',
		emptyOutDir: true,
		reportCompressedSize: true,
		commonjsOptions: {
			transformMixedEsModules: true,
		},
		sourcemap: false,
		lib: {
			name: '@oneplatformdev/plate',
			formats: [ 'es' as const ],
			cssFileName: 'styles',
			entry: {
				index: resolve(__dirname, 'src/index.ts'),
				'plate-editor': resolve(__dirname, 'src/editor/plate-editor.tsx'),
				'static-editor': resolve(__dirname, 'src/static-editor/static-editor.tsx'),
				...Object.fromEntries(
					globSync('src/**/*.{ts,tsx}').map((filename) => {
						return [
							relative(
								'src',
								filename.slice(0, filename.length - extname(filename).length)
							),
							resolve(__dirname, filename),
						]
					})
				)
			}
		},
		rollupOptions: {
			external,
			output: {
				preserveModules: true,
				preserveModulesRoot: 'src',
				globals: {
					path: 'path',
					react: 'React',
					'react-dom': 'ReactDOM',
					tailwindcss: 'tailwindcss'
				}
			}
		},
	},
}));