<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { EditIcon, FolderIcon, LoaderIcon, MergeIcon, MoreHorizontalIcon, PlusIcon, TrashIcon } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import DeleteDialog from '@/components/sidebar/DeleteCategoryDialog.vue';
import MergeDialog from '@/components/sidebar/MergeCategoryDialog.vue';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useEditCategoryDialog } from '@/composables/useEditCategoryDialog.ts';
import { Category } from '@/database.ts';
import { useCategoryStore } from '@/store/category';
import { useSearchStore } from '@/store/search.ts';

const categoryStore = useCategoryStore();
const searchStore = useSearchStore();

onBeforeMount(async () => {
    await categoryStore.loadCategories();
});

const { orderedCategories, isLoading: isLoadingCategories } = storeToRefs(categoryStore);

const categoryToDelete = ref<Category | null>(null);
const deleteTabGroup = ref<boolean>(false);
const isDeleteDialogOpened = ref(false);
const { openDialog: openEditCategoryDialog } = useEditCategoryDialog();

type Pair<T1, T2> = [T1, T2];
const categoryToMerge = ref<Pair<Category, Category> | null>(null);
const isMergeDialogOpened = ref(false);

function handleAddCategory() {
    openEditCategoryDialog();
}

function handleEditCategory(category: Category) {
    openEditCategoryDialog(category);
}

async function handleDeleteCategory(category: Category, deleteGroup = false) {
    try {
        categoryToDelete.value = category;
        isDeleteDialogOpened.value = true;
        deleteTabGroup.value = deleteGroup;
    } catch (error) {
        console.error(error);
    }
}

async function handleMergeCategory(category: Category, categoryTo: Category) {
    if (category.id == categoryTo.id) return;
    categoryToMerge.value = [category, categoryTo];
    isMergeDialogOpened.value = true;
}

async function handleDragEnd() {
    await categoryStore.saveOrderedCategories(orderedCategories.value);
}
</script>
<template>
    <Sidebar>
        <SidebarContent>
            <!-- Category -->
            <SidebarGroup>
                <DeleteDialog
                    v-model="isDeleteDialogOpened"
                    :category-to-delete="categoryToDelete"
                    :delete-tab-group="deleteTabGroup"
                ></DeleteDialog>
                <MergeDialog v-model="isMergeDialogOpened" :category-to-merge="categoryToMerge"></MergeDialog>
                <SidebarGroupLabel>
                    <span>{{ $t('category.label') }}</span>
                    <Button variant="ghost" size="icon-sm" class="-mr-2.5 ml-auto" @click="handleAddCategory">
                        <PlusIcon />
                    </Button>
                </SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem v-if="isLoadingCategories">
                        <SidebarMenuButton class="text-sidebar-foreground/70">
                            <LoaderIcon />
                            <span>{{ $t('category.loading') }}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <VueDraggable v-model="orderedCategories" :animation="150" class="space-y-1" @end="handleDragEnd">
                        <SidebarMenuItem v-for="category in orderedCategories" :key="category.id">
                            <SidebarMenuButton
                                as-child
                                @click="
                                    () => {
                                        searchStore.updateSearchConditions({ categoryId: category.id }, true);
                                    }
                                "
                            >
                                <div class="flex">
                                    <FolderIcon />
                                    <span>{{ category.name }}</span>
                                </div>
                            </SidebarMenuButton>
                            <DropdownMenu>
                                <DropdownMenuTrigger as-child>
                                    <SidebarMenuAction show-on-hover>
                                        <MoreHorizontalIcon />
                                        <span class="sr-only">More</span>
                                    </SidebarMenuAction>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    class="rounded-lg [&_svg]:transition-colors [&_svg]:duration-200"
                                    side="right"
                                    align="start"
                                >
                                    <DropdownMenuItem
                                        class="hover:[&_svg:not([class*='text-'])]:text-inherit"
                                        @click="handleEditCategory(category)"
                                    >
                                        <EditIcon />
                                        <span>{{ $t('category.dropdownMenu.edit') }}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger
                                            :disabled="
                                                !categoryStore.orderedCategories.some((c) => c.id !== category.id)
                                            "
                                            class="[&_svg]:text-muted-foreground gap-2 hover:[&_svg]:text-inherit"
                                        >
                                            <MergeIcon class="size-4" />
                                            <span>{{ $t('category.dropdownMenu.mergeTo') }}</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent class="flex max-w-48">
                                                <ScrollArea class="max-h-48 w-full">
                                                    <DropdownMenuItem
                                                        v-for="categoryTo in categoryStore.orderedCategories.filter(
                                                            (c) => c.id !== category.id,
                                                        )"
                                                        :key="categoryTo.id"
                                                        @click="handleMergeCategory(category, categoryTo)"
                                                    >
                                                        <span class="inline-block truncate">{{ categoryTo.name }}</span>
                                                    </DropdownMenuItem>
                                                </ScrollArea>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        class="hover:[&_svg:not([class*='text-'])]:text-inherit"
                                        @click="handleDeleteCategory(category)"
                                    >
                                        <TrashIcon />
                                        <span>{{ $t('category.dropdownMenu.deleteCategory') }}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        class="hover:[&_svg:not([class*='text-'])]:text-inherit"
                                        variant="destructive"
                                        @click="handleDeleteCategory(category, true)"
                                    >
                                        <TrashIcon />
                                        <span>{{ $t('category.dropdownMenu.deleteCategoryAndGroups') }}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </VueDraggable>
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
    </Sidebar>
</template>
