import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import {viteStaticCopy} from 'vite-plugin-static-copy'

export default defineConfig({
    plugins: [
        vue(),
        viteStaticCopy({
            targets: [
                {src: 'manifest.json', dest: './'}
            ]
        }),
        {
            name: 'rename',
            enforce: 'post',
            generateBundle(_options, bundle) {
                bundle['index.html'].fileName = bundle['index.html'].fileName.replace('index.html', 'tabclip.html')
            }
        }
    ],
    css: {
        postcss: {
            plugins: [tailwind(), autoprefixer()],
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                background: resolve(__dirname, 'src/background.ts')
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            }
        },
        outDir: 'dist',
        emptyOutDir: true,
        copyPublicDir: true,
        minify: false,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    }
})
