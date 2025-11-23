<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { db } from '@/database.ts';
import { useCategoryStore } from '@/store/category.ts';
import { useRefreshStore } from '@/store/refreshStore.ts';

const { t } = useI18n();
const isDialogOpened = defineModel<boolean>({ default: false });
const CONFIRM_TEXT = 'Delete All Data';
const confirmInput = ref('');
const deleteEnabled = computed(() => confirmInput.value === CONFIRM_TEXT);
const refreshStore = useRefreshStore();
const categoryStore = useCategoryStore();
const truncateCategories = ref(false);
const truncateGroups = ref(false);

const doTruncate = async () => {
    if (confirmInput.value !== CONFIRM_TEXT) return;
    if (truncateCategories.value) {
        await categoryStore.truncateCategories();
    }
    if (truncateGroups.value) {
        await db.tabGroups.clear();
    }
    handleOpenChange(false);

    refreshStore.refresh();
    toast.success(t('truncateData.success.toastTitle'), { description: t('truncateData.success.toastDesc') });
};

const handleOpenChange = (open: boolean) => {
    isDialogOpened.value = open;
    confirmInput.value = '';
    truncateCategories.value = false;
    truncateGroups.value = false;
};
</script>

<template>
    <Dialog :open="isDialogOpened" @update:open="handleOpenChange">
        <DialogContent>
            <DialogHeader>
                <DialogTitle class="text-red-500">{{ $t('truncateData.title') }}</DialogTitle>
                <DialogDescription class="text-red-500">
                    {{ $t('truncateData.descLeft') }}
                    <span class="mx-1 font-bold">{{ CONFIRM_TEXT }}</span>
                    {{ $t('truncateData.descRight') }}
                </DialogDescription>
            </DialogHeader>

            <div class="flex gap-8">
                <div class="flex items-center gap-2">
                    <Checkbox
                        id="truncateGroups"
                        v-model="truncateGroups"
                        class="data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:text-white dark:data-[state=checked]:border-red-500 dark:data-[state=checked]:bg-red-500"
                    ></Checkbox>
                    <Label for="truncateGroups" :class="truncateGroups ? 'text-red-500' : ''">
                        {{ $t('truncateData.checkbox.truncateGroups') }}
                    </Label>
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox
                        id="truncateCategories"
                        v-model="truncateCategories"
                        class="data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:text-white dark:data-[state=checked]:border-red-500 dark:data-[state=checked]:bg-red-500"
                    ></Checkbox>
                    <Label for="truncateCategories" :class="truncateCategories ? 'text-red-500' : ''">
                        {{ $t('truncateData.checkbox.truncateCategories') }}
                    </Label>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <div class="grid flex-1 gap-2">
                    <Input v-model="confirmInput" :disabled="!(truncateGroups || truncateCategories)" />
                </div>
                <Button type="button" variant="destructive" :disabled="!deleteEnabled" @click="doTruncate">
                    {{ $t('truncateData.buttonDelete') }}
                </Button>
            </div>

            <DialogFooter class="sm:justify-start">
                <DialogClose as-child>
                    <Button type="button">
                        {{ $t('truncateData.buttonCancel') }}
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped></style>
