import { ref } from 'vue';
import { defineStore } from 'pinia';

import { type SearchConditions } from '@/store/search';

/* eslint-disable no-unused-vars */
export enum Tab {
    All = 'all',
    Starred = 'starred',
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

    function applyView(conditions: SearchConditions): SearchConditions {
        const next: SearchConditions = { ...conditions };
        if (currentTab.value === Tab.Starred) {
            next.isStarred = true;
        }
        return next;
    }

    return {
        currentTab,
        selectAll,
        selectStarred,
        applyView,
    };
});
