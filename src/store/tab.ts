import { ref } from 'vue';
import { defineStore } from 'pinia';

import { type SearchConditions } from '@/store/search';
import { useSettingStore } from '@/store/settings';

/* eslint-disable no-unused-vars */
export enum Tab {
    All = 'all',
    Starred = 'starred',
    Trash = 'trash',
}
/* eslint-enable no-unused-vars */

export const useTabStore = defineStore('tab', () => {
    const currentTab = ref<Tab>(Tab.All);

    function selectAll() {
        currentTab.value = Tab.All;
    }

    function selectStarred() {
        currentTab.value = Tab.Starred;
    }

    function selectTrash() {
        currentTab.value = Tab.Trash;
    }

    function applyView(conditions: SearchConditions): SearchConditions {
        const next: SearchConditions = { ...conditions };
        const trashEnabled = useSettingStore().settings.trashEnabled;
        if (currentTab.value === Tab.Trash && trashEnabled) {
            next.isDeleted = true;
            next.matchAnyDeleted = false;
        } else if (!trashEnabled) {
            next.isDeleted = false;
            next.matchAnyDeleted = false;
        } else if (next.matchAnyDeleted) {
            next.isDeleted = undefined;
        } else if (next.isDeleted === undefined) {
            next.isDeleted = false;
        }
        if (currentTab.value === Tab.Starred) {
            next.isStarred = true;
        }
        return next;
    }

    return {
        currentTab,
        selectAll,
        selectStarred,
        selectTrash,
        applyView,
    };
});
