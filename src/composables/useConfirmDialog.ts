import { Ref, ref } from 'vue';

type Callback = (..._args: any[]) => void;
const isWarningDialogOpen = ref<boolean>(false);
const onConfirm: Ref<Callback | undefined> = ref(undefined);
const dialogTitle = ref('');
const dialogDescription = ref('');

export const useConfirmDialog = () => {
    function openDialog(title: string, description: string, _onConfirm?: Callback): void {
        isWarningDialogOpen.value = true;
        dialogTitle.value = title;
        dialogDescription.value = description;
        if (_onConfirm !== undefined) {
            onConfirm.value = _onConfirm;
        }
    }

    function closeDialog() {
        isWarningDialogOpen.value = false;
        onConfirm.value = undefined;
    }

    return {
        isWarningDialogOpen,
        dialogTitle,
        dialogDescription,
        onConfirm,
        openDialog,
        closeDialog,
    };
};
