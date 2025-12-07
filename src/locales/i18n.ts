import { createI18n } from 'vue-i18n';

import aboutEn from './about/en.json';
import aboutZh from './about/zh.json';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import ja from './ja.json';
import ko from './ko.json';
import pt from './pt.json';
import ru from './ru.json';
import zh from './zh.json';
import zh_TW from './zh-TW.json';

export const availableLocales = {
    zh: '简体中文',
    en: 'English',
    'zh-TW': '繁體中文', // Traditional Chinese
    ja: '日本語', // Japanese
    ko: '한국어', // Korean
    es: 'Español', // Spanish
    fr: 'Français', // French
    de: 'Deutsch', // German
    pt: 'Português', // Portuguese
    ru: 'Русский', // Russian
};

const browserLocale = browser.i18n.getUILanguage().split('-')[0]; // 'en-US' -> 'en'
const locale = browserLocale in availableLocales ? browserLocale : 'en';

export const i18n = createI18n({
    locale,
    fallbackLocale: 'en',
    messages: {
        en: {
            ...en,
            ...aboutEn,
        },
        zh: {
            ...zh,
            ...aboutZh,
        },
        'zh-TW': zh_TW,
        ja,
        ko,
        es,
        fr,
        de,
        pt,
        ru,
    },
});
