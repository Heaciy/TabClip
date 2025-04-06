import {type Ref, ref} from "vue";
import {defineStore} from "pinia";
import {type DateValue} from "@internationalized/date";

export interface SearchConditions {
    text?: string,
    startTime?: DateValue,
    endTime?: DateValue,
    starredOnly?: boolean,
}

export const useSearchStore = defineStore('search', () => {
    const searchConditions: Ref<SearchConditions> = ref({
        text: undefined,
        startTime: undefined,
        endTime: undefined,
    })

    function isEmpty(): boolean {
        const conditions = searchConditions.value;
        return !conditions.text && !conditions.startTime && !conditions.endTime;
    }

    function updateSearchConditions(newConditions: SearchConditions) {
        searchConditions.value = {...searchConditions.value, ...newConditions};
    }

    function resetSearchConditions() {
        searchConditions.value = {
            ...searchConditions.value,
            ...{
                text: undefined,
                startTime: undefined,
                endTime: undefined,
            }
        }
    }

    return {
        searchConditions,
        updateSearchConditions,
        resetSearchConditions,
        isEmpty,
    }
})