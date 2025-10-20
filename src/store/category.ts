import { defineStore } from 'pinia';

import { type Category, db } from '@/database'; // 导入数据库实例和Category类型

export const useCategoryStore = defineStore('category', {
    state: () => ({
        categories: [] as Category[],
        isLoading: false,
        error: null as string | null,
    }),
    actions: {
        async loadCategories() {
            this.isLoading = true;
            this.error = null;
            try {
                this.categories = await db.getAllCategories();
            } catch (error: any) {
                this.error = '加载分类失败: ' + error.message;
                console.error('Pinia - 加载分类失败:', error);
            } finally {
                this.isLoading = false;
            }
        },

        async getCategoryById(id: string) {
            return await db.getCategoryById(id);
        },

        async addCategory(newCategory: { name: string }) {
            this.isLoading = true;
            this.error = null;
            try {
                await db.addCategory(newCategory);
                await this.loadCategories();
            } catch (error: any) {
                this.error = '添加分类失败: ' + error.message;
                console.error('Pinia - 添加分类失败:', error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async updateCategory(updatedCategory: Category) {
            this.isLoading = true;
            this.error = null;
            try {
                await db.updateCategory(updatedCategory);
                await this.loadCategories();
            } catch (error: any) {
                this.error = '更新分类失败: ' + error.message;
                console.error('Pinia - 更新分类失败:', error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async deleteCategory(id: string, deleteTabGroup: boolean = false) {
            this.isLoading = true;
            this.error = null;
            try {
                deleteTabGroup ? await db.deleteCategoryAndAssociatedGroups(id) : await db.deleteCategory(id);
                await this.loadCategories();
            } catch (error: any) {
                this.error = '删除分类失败: ' + error.message;
                console.error('Pinia - 删除分类失败:', error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },
    },
});
