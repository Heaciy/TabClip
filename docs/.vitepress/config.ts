import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'TabClip',
    description: 'Clip your tabs together like a paperclip!',
    head: [
        ['link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
        ['link', { rel: 'icon', type: 'image/png', href: '/favicon-32x32.png', sizes: '32x32' }],
        ['link', { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }],
        // Google Analytics
        ['script', { async: '', src: `https://www.googletagmanager.com/gtag/js?id=${process.env.GA_ID}` }],
        [
            'script',
            {},
            `window.dataLayer = window.dataLayer || []; 
            function gtag(){dataLayer.push(arguments);} 
            gtag('js', new Date()); 
            gtag('config', '${process.env.GA_ID}');`,
        ],
    ],
    cleanUrls: true,
    sitemap: {
        hostname: 'https://tabclip.heaciy.com',
    },

    locales: {
        root: {
            label: '简体中文',
            lang: 'zh-CN',
            themeConfig: {
                nav: [
                    { text: '安装插件', link: '/install' },
                    { text: '使用文档', link: '/settings' },
                    { text: '隐私策略', link: '/privacy' },
                    { text: '开源许可', link: '/license' },
                ],
                sidebar: [
                    {
                        text: '插件截图',
                        items: [{ text: '插件截图', link: '/screenshots' }],
                    },
                    {
                        text: '使用手册',
                        items: [
                            { text: '安装插件', link: '/install' },
                            { text: '插件设置', link: '/settings' },
                            { text: '导入导出', link: '/import-export' },
                        ],
                    },
                    {
                        text: '隐私策略',
                        items: [{ text: '隐私策略', link: '/privacy' }],
                    },
                    {
                        text: '开源许可',
                        items: [{ text: '开源许可', link: '/license' }],
                    },
                ],
                editLink: {
                    pattern: 'https://github.com/Heaciy/TabClip/edit/main/docs/:path',
                    text: '在 GitHub 上编辑此页面',
                },
                docFooter: {
                    prev: '上一页',
                    next: '下一页',
                },
                outline: {
                    label: '本页目录',
                },
                lastUpdated: {
                    text: '最后更新于',
                },
            },
        },
        en: {
            label: 'English',
            lang: 'en-US',
            link: '/en/',
            themeConfig: {
                nav: [
                    { text: 'Installation', link: '/en/install' },
                    { text: 'User Guide', link: '/en/settings' },
                    { text: 'Privacy Policy', link: '/en/privacy' },
                    { text: 'License', link: '/en/license' },
                ],
                sidebar: [
                    {
                        text: 'Screenshots',
                        items: [{ text: 'Screenshots', link: '/en/screenshots' }],
                    },
                    {
                        text: 'User Manual',
                        items: [
                            { text: 'Install Extension', link: '/en/install' },
                            { text: 'Extension Settings', link: '/en/settings' },
                            { text: 'Import/Export', link: '/en/import-export' },
                        ],
                    },
                    {
                        text: 'Privacy Policy',
                        items: [{ text: 'Privacy Policy', link: '/en/privacy' }],
                    },
                    {
                        text: 'License',
                        items: [{ text: 'License', link: '/en/license' }],
                    },
                ],
                editLink: {
                    pattern: 'https://github.com/Heaciy/TabClip/edit/main/docs/:path',
                    text: 'Edit this page on GitHub',
                },
                docFooter: {
                    prev: 'Previous page',
                    next: 'Next page',
                },
                outline: {
                    label: 'On this page',
                },
                lastUpdated: {
                    text: 'Last Updated',
                },
            },
        },
    },

    themeConfig: {
        logo: '/icon.svg',
        socialLinks: [{ icon: 'github', link: 'https://github.com/Heaciy/TabClip' }],
    },
});
