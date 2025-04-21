import {type Ref, ref} from "vue";
import {defineStore} from "pinia";
import {type DateValue} from "@internationalized/date";

export interface SearchConditions {
    text?: string,
    startTime?: DateValue,
    endTime?: DateValue,
    starredOnly?: boolean,
    pageSize?: number,
    pageIndex?: number,
}

export const useSearchStore = defineStore('search', () => {
    const searchConditions: Ref<SearchConditions> = ref({
        text: undefined,
        startTime: undefined,
        endTime: undefined,
    })
    const passivelyRefreshed: Ref<number> = ref(0);

    function isEmpty(): boolean {
        const conditions = searchConditions.value;
        return !conditions.text && !conditions.startTime && !conditions.endTime;
    }

    function updateSearchConditions(newConditions: SearchConditions, passivelyRefresh: boolean = false) {
        searchConditions.value = {...searchConditions.value, ...newConditions};
        if (passivelyRefresh) {
            passivelyRefreshed.value++;
        }
    }

    function resetSearchConditions(passivelyRefresh: boolean = false) {
        searchConditions.value = {
            ...searchConditions.value,
            ...{
                text: undefined,
                startTime: undefined,
                endTime: undefined,
            }
        }
        if (passivelyRefresh) {
            passivelyRefreshed.value++;
        }
    }

    return {
        searchConditions,
        passivelyRefreshed,
        updateSearchConditions,
        resetSearchConditions,
        isEmpty,
    }
})