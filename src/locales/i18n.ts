import { createI18n } from 'vue-i18n';

import aboutEn from './about/en.json';
import aboutZh from './about/zh.json';
import en from './en.json';
import zh from './zh.json';

export const i18n = createI18n({
    locale: 'zh',
    fallbackLocale: 'zh',
    messages: {
        en: {
            ...en,
            ...aboutEn,
        },
        zh: {
            ...zh,
            ...aboutZh,
        },
    },
});

export const availableLocales = {
    zh: '简体中文',
    en: 'English',
};
