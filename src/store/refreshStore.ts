import { type Ref, ref } from 'vue';
import { defineStore } from 'pinia';

export const useRefreshStore = defineStore('refresh', () => {
    const refreshed: Ref<number> = ref(0);
    const groupTotal: Ref<number> = ref(0);
    const tabTotal: Ref<number> = ref(0);

    function refresh() {
        refreshed.value++;
    }

    function refreshTotal(_groupTotal?: number, _tabTotal?: number) {
        groupTotal.value = _groupTotal !== undefined ? _groupTotal : groupTotal.value;
        tabTotal.value = _tabTotal !== undefined ? _tabTotal : tabTotal.value;
    }

    return {
        refreshed,
        refresh,
        groupTotal,
        tabTotal,
        refreshTotal,
    };
});
