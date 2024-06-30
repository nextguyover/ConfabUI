import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from "@rollup/plugin-commonjs"
import terser from "@rollup/plugin-terser"
import del from 'rollup-plugin-delete'
import copy from 'rollup-plugin-copy'
import alias from '@rollup/plugin-alias';
import gzip from 'rollup-plugin-gzip'
import postcss from 'rollup-plugin-postcss'
import autoprefixer from 'autoprefixer'

export default [
	{
		input: './src/confab-embed.js',
		output: {
			format: 'es',
			dir: 'dist',
			compact: true,
			sourcemap: false,
		},
		plugins: [
			svelte({ 
				emitCss: true
			}),
			resolve({
				browser: true,
				exportConditions: ['svelte'],
				extensions: ['.svelte']
			}),
			postcss({
				extract: true,
				extract: 'bundle.css',
				plugins: [
					autoprefixer()
				]
			}),
			commonjs(),
			terser(),
			del({ targets: 'dist/*' }),
			// copy({
			// 	targets:[
			// 		{ src: 'src/index.html', dest: 'dist' },
			// 	]
			// }),
			alias({
				entries: [
				{ find: '$lib', replacement: './lib' },
				]
			}),
			gzip(),
		],
	},
	{
		input: './src/confab-loader.js',
		output: {
			format: 'iife',
			dir: 'dist',
			compact: true,
			sourcemap: false,
		},
		plugins: [
			terser()
		]
	}
]
