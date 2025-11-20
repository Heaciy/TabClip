import { type Ref, ref } from 'vue';
import { type DateValue } from '@internationalized/date';
import { defineStore } from 'pinia';

export interface SearchConditions {
    text?: string;
    startTime?: DateValue;
    endTime?: DateValue;
    starredOnly?: boolean;
    pageSize?: number;
    pageIndex?: number;
    offset?: number;
    categoryId?: string;
}

export const useSearchStore = defineStore('search', () => {
    const searchConditions: Ref<SearchConditions> = ref({
        text: undefined,
        startTime: undefined,
        endTime: undefined,
        categoryId: undefined,
    });
    const passivelyRefreshed: Ref<number> = ref(0);

    function isEmpty(): boolean {
        const conditions = searchConditions.value;
        return !conditions.text && !conditions.startTime && !conditions.endTime && !conditions.categoryId;
    }

    function updateSearchConditions(newConditions: SearchConditions, passivelyRefresh: boolean = false) {
        searchConditions.value = { ...searchConditions.value, ...newConditions };
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
                categoryId: undefined,
            },
        };
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
    };
});
