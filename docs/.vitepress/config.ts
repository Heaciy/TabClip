import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'TabClip',
    description: 'Clip your tabs together like a paperclip!',
    head: [['link', { rel: 'icon', type: 'image/svg+xml', href: 'icon.svg' }]],
    cleanUrls: true,

    locales: {
        root: {
            label: '简体中文',
            lang: 'zh-CN',
            themeConfig: {
                nav: [
                    { text: '主页', link: '/' },
                    { text: '使用文档', link: '/settings' },
                    { text: '隐私策略', link: '/privacy' },
                    { text: '开源许可', link: '/license' },
                ],
                sidebar: [
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
                outlineTitle: '本页目录',
                lastUpdatedText: '最后更新于',
            },
        },
        en: {
            label: 'English',
            lang: 'en-US',
            link: '/en/',
            themeConfig: {
                nav: [
                    { text: 'Home', link: '/en/' },
                    { text: 'User Guide', link: '/en/settings' },
                    { text: 'Privacy Policy', link: '/en/privacy' },
                    { text: 'License', link: '/en/license' },
                ],
                sidebar: [
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
                outlineTitle: 'On this page',
                lastUpdatedText: 'Last Updated',
            },
        },
    },

    themeConfig: {
        logo: 'icon.svg',
        socialLinks: [{ icon: 'github', link: 'https://github.com/Heaciy/TabClip' }],
    },
});
