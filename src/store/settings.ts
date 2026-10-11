import { type Ref, ref, toRaw, watch } from 'vue';
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
    trashEnabled: boolean;
    trashRetentionDays: number;
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
    trashEnabled: false,
    trashRetentionDays: 30,
};

const DEFAULT_TRASH_RETENTION_DAYS = 30;

function resolveTrashRetentionDays(settings: Settings): number {
    return settings.trashRetentionDays ?? DEFAULT_TRASH_RETENTION_DAYS;
}

function normalizeTabWhitelist(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }
    return [...blankTabs];
}

function plainSettings(settings: Settings): Settings {
    const plain = JSON.parse(JSON.stringify(toRaw(settings))) as Settings;
    plain.tabWhitelist = normalizeTabWhitelist(plain.tabWhitelist);
    return plain;
}

async function loadSettings(): Promise<Settings> {
    const { settings: rawSettings } = await browser.storage.local.get('settings');
    try {
        const storedSettings: Partial<Settings> =
            typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings;
        return plainSettings({ ...defaultSettings, ...storedSettings });
    } catch {
        return plainSettings(defaultSettings);
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
            await browser.storage.local.set({ settings: plainSettings(settings.value) });
        }
    });

    function refreshSettings(newSettings: Partial<Settings> = {}) {
        settings.value = plainSettings({ ...toRaw(settings.value), ...newSettings });
    }

    return {
        settings,
        refreshSettings,
    };
});

export { defaultSettings, loadSettings, resolveTrashRetentionDays, type Settings };
