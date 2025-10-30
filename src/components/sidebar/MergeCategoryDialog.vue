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

type Pair<T1, T2> = [T1, T2];
const { t } = useI18n();
const props = defineProps<{ categoryToMerge?: Pair<Category, Category> | null }>();
const isDialogOpened = defineModel<boolean>({ default: false });
const categoryStore = useCategoryStore();
const refreshStore = useRefreshStore();
const searchStore = useSearchStore();

const dialogTitle = computed(() =>
    props.categoryToMerge
        ? t('category.merge.dialogTitle', {
              categoryName: props.categoryToMerge[0].name,
              categoryToName: props.categoryToMerge[1].name,
          })
        : '',
);
const dialogDesc = computed(() =>
    props.categoryToMerge
        ? t('category.merge.dialogDesc', {
              categoryName: props.categoryToMerge[0].name,
              categoryToName: props.categoryToMerge[1].name,
          })
        : '',
);

const handleMergeCategory = async () => {
    if (props.categoryToMerge) {
        await categoryStore.mergeCategory(props.categoryToMerge[0], props.categoryToMerge[1]);
        isDialogOpened.value = false;
        if (
            !searchStore.searchConditions.categoryId ||
            searchStore.searchConditions.categoryId !== props.categoryToMerge[0].id
        ) {
            refreshStore.refresh();
        }
    }
};
</script>

<template>
    <AlertDialog :open="isDialogOpened">
        <AlertDialogContent>
            <AlertDialogHeader class="text-red-500">
                <AlertDialogTitle>{{ dialogTitle }}</AlertDialogTitle>
                <AlertDialogDescription class="text-red-500">{{ dialogDesc }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="isDialogOpened = !isDialogOpened">{{
                    $t('category.merge.buttonCancel')
                }}</AlertDialogCancel>
                <AlertDialogAction :class="cn(buttonVariants({ variant: 'destructive' }))" @click="handleMergeCategory">
                    {{ $t('category.merge.buttonMerge') }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
