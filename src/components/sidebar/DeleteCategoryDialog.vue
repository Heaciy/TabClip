<script setup lang="ts">
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

const props = defineProps<Props>();
const isDialogOpened = defineModel<boolean>({ default: false });
const categoryStore = useCategoryStore();
const refreshStore = useRefreshStore();
const searchStore = useSearchStore();

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
            <AlertDialogHeader>
                <AlertDialogTitle>{{ `Delete Category ${props.categoryToDelete?.name}?` }}</AlertDialogTitle>
                <AlertDialogDescription>
                    Only the category will be deleted — the tag group data associated with it will not be removed.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="isDialogOpened = !isDialogOpened">Cancel</AlertDialogCancel>
                <AlertDialogAction :class="cn(buttonVariants({ variant: 'destructive' }))" @click="handleDeleteCategory"
                    >Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
