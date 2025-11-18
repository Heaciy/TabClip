import { Ref, ref } from 'vue';

type Callback = (..._args: any[]) => void;
const isConfirmDialogOpen = ref<boolean>(false);
const onConfirm: Ref<Callback | undefined> = ref(undefined);
const dialogTitle = ref('');
const dialogDescription = ref('');

export const useConfirmDialog = () => {
    function openDialog(title: string, description: string, _onConfirm?: Callback): void {
        isConfirmDialogOpen.value = true;
        dialogTitle.value = title;
        dialogDescription.value = description;
        if (_onConfirm !== undefined) {
            onConfirm.value = _onConfirm;
        }
    }

    function closeDialog() {
        isConfirmDialogOpen.value = false;
        onConfirm.value = undefined;
    }

    return {
        isConfirmDialogOpen,
        dialogTitle,
        dialogDescription,
        onConfirm,
        openDialog,
        closeDialog,
    };
};
