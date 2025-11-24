import strip from '@rollup/plugin-strip';
import tailwindcss from '@tailwindcss/vite';
// import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'wxt';

import pkg from './package.json';

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: './src',
    modules: ['@wxt-dev/module-vue'],
    // entrypointsDir: 'src/entrypoints',
    manifest: ({ browser }) => {
        const permissions = ['storage', 'tabs', 'contextMenus', 'downloads', 'tabGroups'];
        const hostPermissions = [];

        if (browser === 'firefox') {
            // Firefox: 添加 Google Favicon 服务的权限
            hostPermissions.push('https://t2.gstatic.com/*');
        } else {
            // 其他浏览器: 添加 favicon 权限
            permissions.push('favicon');
        }

        return {
            name: '__MSG_appName__',
            version: pkg.version,
            description: '__MSG_appDesc__',
            default_locale: 'en',
            permissions,
            host_permissions: hostPermissions,
            background: {
                service_worker: 'background.js',
                type: 'module',
            },
            action: {
                default_title: '__MSG_appName__',
            },
            options_page: 'tabclip.html',
        };
    },
    vite({ command }) {
        return {
            plugins: [
                tailwindcss(),
                // visualizer({
                //     open: true, // 构建后自动打开浏览器
                //     gzipSize: true,
                //     brotliSize: true,
                //     filename: 'dist/stats.html', // 生成的图表路径
                // }),
                ...(command !== 'serve'
                    ? [
                          strip({
                              include: ['**/*.ts', '**/*.js'],
                              functions: ['console.log', 'console.warn', 'console.debug'],
                              // 保留 console.error 和 debugger（默认 strip 会移除 debugger）
                              debugger: false,
                          }),
                      ]
                    : []),
            ],
        };
    },
});
