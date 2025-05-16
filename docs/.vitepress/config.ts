import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'TabClip',
    description: 'Clip your tabs together like a paperclip!',
    head: [['link', { rel: 'icon', type: 'image/svg+xml', href: 'icon.svg' }]],
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: 'icon.svg',
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

        socialLinks: [{ icon: 'github', link: 'https://github.com/Heaciy/TabClip' }],
    },
});
