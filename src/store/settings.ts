import {type Ref, ref, watchEffect} from "vue";
import {defineStore} from "pinia";

const defaultSettings = {
    storePinnedTabs: false,
    defaultLockGroup: false,
    openGroupInNewWindow: true,
    pageSize: 10,
}

export const useSettingStore = defineStore("setting", () => {
    function loadSetings() {
        const storedSettings = localStorage.getItem("settings");
        return storedSettings && storedSettings !== 'null' ? JSON.parse(storedSettings) : defaultSettings;
    }

    const settings:Ref = ref(loadSetings());

    watchEffect(() => {
        localStorage.setItem("settings", JSON.stringify(settings.value));
    })


    function refreshSettings(newSettings = {}) {
        settings.value = {...settings.value, ...newSettings};
    }

    return {
        settings,
        refreshSettings,
    }
})