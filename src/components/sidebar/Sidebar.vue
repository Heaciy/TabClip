<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { Edit, Folder, MoreHorizontal, Plus, Trash2 } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import DeleteDialog from '@/components/sidebar/DeleteCategoryDialog.vue';
import EditDialog from '@/components/sidebar/EditCategoryDialog.vue';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Category } from '@/database.ts';
import { useCategoryStore } from '@/store/category';
import { useSearchStore } from '@/store/search.ts';

const categoryStore = useCategoryStore();
const searchStore = useSearchStore();

onBeforeMount(() => {
    categoryStore.loadCategories();
});

const { categories, isLoading: isLoadingCategories } = storeToRefs(categoryStore);

const categoryToEdit = ref<Category | null>(null);
const isEditDialogOpened = ref(false);
const categoryToDelete = ref<Category | null>(null);
const deleteTabGroup = ref<boolean>(false);
const isDeleteDialogOpened = ref(false);

function handleAddCategory() {
    categoryToEdit.value = null;
    isEditDialogOpened.value = true;
}

function handleEditCategory(category: Category) {
    categoryToEdit.value = category;
    isEditDialogOpened.value = true;
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
</script>
<template>
    <Sidebar>
        <SidebarContent>
            <!-- Category -->
            <SidebarGroup>
                <EditDialog v-model="isEditDialogOpened" :category-to-edit="categoryToEdit"></EditDialog>
                <DeleteDialog
                    v-model="isDeleteDialogOpened"
                    :category-to-delete="categoryToDelete"
                    :delete-tab-group="deleteTabGroup"
                ></DeleteDialog>
                <SidebarGroupLabel>
                    <span>Categories</span>
                    <Button variant="ghost" size="icon-sm" class="-mr-2.5 ml-auto" @click="handleAddCategory">
                        <Plus></Plus>
                    </Button>
                </SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem v-if="isLoadingCategories">加载中...</SidebarMenuItem>
                    <SidebarMenuItem v-for="category in categories" :key="category.id">
                        <SidebarMenuButton
                            as-child
                            @click="
                                () => {
                                    searchStore.updateSearchConditions({ categoryId: category.id }, true);
                                }
                            "
                        >
                            <div class="flex">
                                <Folder />
                                <span>{{ category.name }}</span>
                            </div>
                        </SidebarMenuButton>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <SidebarMenuAction show-on-hover>
                                    <MoreHorizontal />
                                    <span class="sr-only">More</span>
                                </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent class="rounded-lg" side="right" align="start">
                                <DropdownMenuItem @click="handleEditCategory(category)">
                                    <Edit class="text-muted-foreground" />
                                    <span>Rename Category</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem @click="handleDeleteCategory(category)">
                                    <Trash2 class="text-muted-foreground" />
                                    <span>Delete Category</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" @click="handleDeleteCategory(category, true)">
                                    <Trash2 class="text-muted-foreground" />
                                    <span>Delete Category & Groups</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton class="text-sidebar-foreground/70">
                            <MoreHorizontal />
                            <span>More</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
    </Sidebar>
</template>
