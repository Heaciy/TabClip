import { Ref, ref } from 'vue';

import { Category } from '@/database.ts';

export type Callback = (_category: Category) => any;
const isDialogOpen: Ref<boolean> = ref(false);
const categoryToEdit: Ref<Category | undefined> = ref(undefined);
const onSave: Ref<Callback | undefined> = ref(undefined);

export const useEditCategoryDialog = () => {
    function openDialog(category?: Category, _onSave?: Callback) {
        isDialogOpen.value = true;
        categoryToEdit.value = category;
        if (_onSave !== undefined) {
            onSave.value = _onSave;
        }
    }

    function closeDialog() {
        isDialogOpen.value = false;
        categoryToEdit.value = undefined;
    }

    return {
        openDialog,
        closeDialog,
        isDialogOpen,
        onSave,
        categoryToEdit,
    };
};
