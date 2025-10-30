<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { db } from '@/database.ts';
import { useRefreshStore } from '@/store/refreshStore.ts';

const { t } = useI18n();
const isDialogOpened = defineModel<boolean>({ default: false });
const CONFIRM_TEXT = 'Delete All Groups';
const confirmInput = ref('');
const deleteEnabled = computed(() => confirmInput.value === CONFIRM_TEXT);
const refreshStore = useRefreshStore();

const doTruncate = async () => {
    await db.tabGroups.clear();
    confirmInput.value = '';
    isDialogOpened.value = false;

    refreshStore.refresh();
    toast.success(t('truncateGroups.success.toastTitle'), { description: t('truncateGroups.success.toastDesc') });
};

const handleOpenChange = (open: boolean) => {
    isDialogOpened.value = open;
    confirmInput.value = '';
};
</script>

<template>
    <Dialog :open="isDialogOpened" @update:open="handleOpenChange">
        <DialogContent>
            <DialogHeader>
                <DialogTitle class="text-red-500">{{ $t('truncateGroups.title') }}</DialogTitle>
                <DialogDescription class="text-red-500">
                    {{ $t('truncateGroups.descLeft') }}
                    <span class="mx-1 font-bold">{{ CONFIRM_TEXT }}</span>
                    {{ $t('truncateGroups.descRight') }}
                </DialogDescription>
            </DialogHeader>

            <div class="flex items-center space-x-2">
                <div class="grid flex-1 gap-2">
                    <Input v-model="confirmInput" />
                </div>
                <Button type="button" variant="destructive" :disabled="!deleteEnabled" @click="doTruncate">
                    {{ $t('truncateGroups.buttonDelete') }}
                </Button>
            </div>

            <DialogFooter class="sm:justify-start">
                <DialogClose as-child>
                    <Button type="button">
                        {{ $t('truncateGroups.buttonCancel') }}
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped></style>
