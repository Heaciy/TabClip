import {type Ref, ref} from "vue";
import {defineStore} from "pinia";

export const useRefreshStore = defineStore('refresh', () => {
    const refreshed: Ref<number> = ref(0);

    function refresh() {
        refreshed.value++;
    }

    return {
        refreshed,
        refresh,
    }

})