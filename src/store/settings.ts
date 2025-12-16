import { type Ref, ref, watch } from 'vue';
import { defineStore } from 'pinia';

const blankTabs = ['about:blank', 'about:newtab', 'about:home', 'chrome://newtab', 'edge://newtab'];

interface Settings {
    storePinnedTabs: boolean;
    defaultLockGroup: boolean;
    openGroupInNewWindow: boolean;
    pageSize: number;
    useGoogleIcon: boolean;
    isStartupPage: boolean;
    storeBrowserGroup: boolean;
    spaceBetweenTabs: number;
    tabWhitelist: string[];
}

const defaultSettings: Settings = {
    storePinnedTabs: false,
    defaultLockGroup: false,
    openGroupInNewWindow: false,
    pageSize: 10,
    useGoogleIcon: false,
    isStartupPage: true,
    storeBrowserGroup: false,
    spaceBetweenTabs: 2,
    tabWhitelist: blankTabs,
};

async function loadSettings(): Promise<Settings> {
    const { settings: rawSettings } = await browser.storage.local.get('settings');
    try {
        const storedSettings: Partial<Settings> =
            typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings;
        return { ...defaultSettings, ...storedSettings };
    } catch {
        return defaultSettings;
    }
}

export const useSettingStore = defineStore('setting', () => {
    const settings: Ref<Settings> = ref(defaultSettings);
    const isLoaded: Ref<boolean> = ref(false);

    loadSettings().then((savedSettings) => {
        settings.value = savedSettings;
        isLoaded.value = true;
    });

    watch(settings, async (_newSettings) => {
        // 只有在加载完成后才保存设置，避免覆盖原始设置
        if (isLoaded.value) {
            await browser.storage.local.set({ settings: toRaw(settings.value) });
        }
    });

    function refreshSettings(newSettings = {}) {
        settings.value = { ...settings.value, ...newSettings };
    }

    return {
        settings,
        refreshSettings,
    };
});

export { defaultSettings, loadSettings, type Settings };
