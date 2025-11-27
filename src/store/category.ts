import { ref } from 'vue';
import { defineStore } from 'pinia';

import { type Category, db } from '@/database';

export const ORDERED_CATEGORIES = 'ordered_categories';

export const useCategoryStore = defineStore('category', () => {
    const categories = ref<Category[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const orderedCategories = ref<Category[]>([]);

    async function loadCategories() {
        isLoading.value = true;
        error.value = null;

        try {
            const dbCategories = await db.getAllCategories();
            categories.value = dbCategories;

            const storageResult = await browser.storage.local.get(ORDERED_CATEGORIES);
            const storedOrder = (storageResult[ORDERED_CATEGORIES] as Category[]) || [];

            const dbMap = new Map(dbCategories.map((c) => [c.id, c]));

            // 保留已存在的顺序，但更新为数据库中的最新对象
            const syncedOrder: Category[] = storedOrder.filter((c) => dbMap.has(c.id)).map((c) => dbMap.get(c.id)!);

            // 找出数据库中新增的分类（本地未记录）
            const syncedIds = new Set(syncedOrder.map((c) => c.id));
            const newCategories = dbCategories.filter((c) => !syncedIds.has(c.id));

            // 追加到排序列表的开头（或尾部）
            const finalOrder = [...newCategories, ...syncedOrder];

            // 保存和更新
            orderedCategories.value = finalOrder;

            const cleanData = JSON.parse(JSON.stringify(finalOrder));
            await browser.storage.local.set({ [ORDERED_CATEGORIES]: cleanData });
        } catch (e: any) {
            error.value = 'Load categories failed: ' + e.message;
            console.error('Load categories failed: ', e);
        } finally {
            isLoading.value = false;
        }
    }

    async function saveOrderedCategories(newOrder: Category[]) {
        try {
            orderedCategories.value = newOrder;
            const cleanData = JSON.parse(JSON.stringify(newOrder));
            await browser.storage.local.set({ [ORDERED_CATEGORIES]: cleanData });
        } catch (e: any) {
            error.value = 'Save ordered categories failed: ' + e.message;
            console.error('Save ordered categories failed: ', e);
        }
    }

    async function getCategoryById(id: string) {
        return await db.getCategoryById(id);
    }

    async function addCategory(newCategory: { name: string }) {
        isLoading.value = true;
        error.value = null;
        try {
            const category = await db.addCategory(newCategory);
            await loadCategories();
            return category;
        } catch (e: any) {
            error.value = 'Add category failed: ' + e.message;
            console.error('Add category failed: ', e);
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function updateCategory(updatedCategory: Category) {
        isLoading.value = true;
        error.value = null;
        try {
            const category = await db.updateCategory(updatedCategory);
            await loadCategories();
            return category;
        } catch (e: any) {
            error.value = 'Update category failed: ' + e.message;
            console.error('Update category failed: ', e);
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteCategory(id: string, deleteTabGroup = false) {
        isLoading.value = true;
        error.value = null;
        try {
            deleteTabGroup ? await db.deleteCategoryAndAssociatedGroups(id) : await db.deleteCategory(id);
            await loadCategories();
        } catch (e: any) {
            error.value = 'Delete category failed: ' + e.message;
            console.error('Delete category failed: ', e);
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function mergeCategory(category: Category, categoryTo: Category) {
        isLoading.value = true;
        error.value = null;
        try {
            await db.mergeCategory(category, categoryTo);
            await loadCategories();
        } catch (e: any) {
            error.value = 'Merge category failed: ' + e.message;
            console.error('Merge category failed: ', e);
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function truncateCategories() {
        error.value = null;
        try {
            await db.truncateCategories();
            await loadCategories();
        } catch (e: any) {
            error.value = 'Truncate category failed: ' + e.message;
            console.error('Truncate category failed: ', e);
            throw e;
        }
    }

    return {
        categories,
        isLoading,
        error,
        loadCategories,
        getCategoryById,
        addCategory,
        updateCategory,
        deleteCategory,
        mergeCategory,
        truncateCategories,
        saveOrderedCategories,
        orderedCategories,
    };
});
