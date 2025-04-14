import {createI18n} from 'vue-i18n';

import zh from "./zh.json";
import en from "./en.json";

export const i18n = createI18n({
    locale: 'zh',
    fallbackLocale: 'zh',
    messages: {
        en,
        zh
    }
})

export const availableLocales = {
    zh: '简体中文',
    en: 'English',
}