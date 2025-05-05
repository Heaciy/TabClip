import {type Ref, ref, watch} from "vue";
import {defineStore} from "pinia";


interface Settings {
    storePinnedTabs: boolean,
    defaultLockGroup: boolean,
    openGroupInNewWindow: boolean,
    pageSize: number,
    isStartupPage: boolean,
}

const defaultSettings: Settings = {
    storePinnedTabs: false,
    defaultLockGroup: false,
    openGroupInNewWindow: true,
    pageSize: 10,
    isStartupPage: true,
}

async function loadSettings(): Promise<Settings> {
    return new Promise((resolve) => {
        // use chrome.storage.local to replace localStorage
        chrome.storage.local.get("settings", (result) => {
            const storedSettings = result.settings;
            resolve(storedSettings && storedSettings !== 'null' ? JSON.parse(storedSettings) : defaultSettings);
        });
    });
}

export const useSettingStore = defineStore("setting", () => {
    const settings: Ref<Settings> = ref(defaultSettings);
    const isLoaded: Ref<boolean> = ref(false);

    loadSettings().then(savedSettings => {
        settings.value = savedSettings;
        isLoaded.value = true;
    });

    watch(settings, async (_newSettings) => {
        // 只有在加载完成后才保存设置，避免覆盖原始设置
        if (isLoaded.value) {
            await chrome.storage.local.set({"settings": JSON.stringify(settings.value)});
        }
    });


    function refreshSettings(newSettings = {}) {
        settings.value = {...settings.value, ...newSettings};
    }

    return {
        settings,
        refreshSettings,
    }
})

export {
    loadSettings,
    type Settings
}