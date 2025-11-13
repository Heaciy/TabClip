import { Ref, ref } from 'vue';

import { Category } from '@/database';

export type Callback = (_category: Category) => any;

const isAddCategoryDialogOpen = ref(false);
const callback: Ref<Callback | undefined> = ref(undefined);

export function useAddCategoryDialog() {
    function openDialog(_callback?: Callback) {
        isAddCategoryDialogOpen.value = true;
        if (_callback !== undefined) {
            callback.value = _callback;
        }
    }

    function closeDialog() {
        isAddCategoryDialogOpen.value = false;
    }

    return {
        isAddCategoryDialogOpen,
        openDialog,
        closeDialog,
        callback,
    };
}
