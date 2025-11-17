<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useConfirmDialog } from '@/composables/useConfirmDialog.ts';

const { isWarningDialogOpen, onConfirm, dialogTitle, dialogDescription } = useConfirmDialog();
const handleOpenChange = (open: boolean, confirm?: boolean) => {
    isWarningDialogOpen.value = open;
    if (!open && confirm && onConfirm.value) {
        onConfirm.value();
    }
};
</script>
<template>
    <Dialog :open="isWarningDialogOpen" @update:open="handleOpenChange">
        <DialogTrigger as-child>
            <slot></slot>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{{ dialogTitle }}</DialogTitle>
                <DialogDescription>{{ dialogDescription }}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button type="button" @click="handleOpenChange(false, true)">{{ $t('confirmDialog.confirm') }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped></style>
