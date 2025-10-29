<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { Category } from '@/database';
import { cn } from '@/lib/utils';
import { useCategoryStore } from '@/store/category';
import { useRefreshStore } from '@/store/refreshStore.ts';
import { useSearchStore } from '@/store/search.ts';

interface Props {
    categoryToDelete?: Category | null;
    deleteTabGroup?: boolean;
}

const { t } = useI18n();
const props = defineProps<Props>();
const isDialogOpened = defineModel<boolean>({ default: false });
const categoryStore = useCategoryStore();
const refreshStore = useRefreshStore();
const searchStore = useSearchStore();

const dialogTitle = computed(() => {
    return props.deleteTabGroup
        ? t('category.delete.deleteCategoryAndGroups.dialogTitle', { categoryName: props.categoryToDelete?.name })
        : t('category.delete.deleteCategory.dialogTitle', { categoryName: props.categoryToDelete?.name });
});
const dialogDesc = computed(() => {
    return props.deleteTabGroup
        ? t('category.delete.deleteCategoryAndGroups.dialogDesc')
        : t('category.delete.deleteCategory.dialogDesc', {});
});

const handleDeleteCategory = async () => {
    if (props.categoryToDelete) {
        await categoryStore.deleteCategory(props.categoryToDelete.id!, props.deleteTabGroup);
    }
    isDialogOpened.value = false;
    if (!searchStore.searchConditions.categoryId) {
        refreshStore.refresh();
    }
};
</script>

<template>
    <AlertDialog :open="isDialogOpened">
        <AlertDialogContent>
            <AlertDialogHeader :class="props.deleteTabGroup ? 'text-red-500' : ''">
                <AlertDialogTitle>{{ dialogTitle }}</AlertDialogTitle>
                <AlertDialogDescription :class="props.deleteTabGroup ? 'text-red-500' : ''">
                    {{ dialogDesc }}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="isDialogOpened = !isDialogOpened"
                    >{{ $t('category.delete.buttonCancel') }}
                </AlertDialogCancel>
                <AlertDialogAction :class="cn(buttonVariants({ variant: 'destructive' }))" @click="handleDeleteCategory"
                    >{{ $t('category.delete.buttonDelete') }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
