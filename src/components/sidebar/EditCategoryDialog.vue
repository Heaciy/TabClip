<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';

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
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Category } from '@/database.ts';
import { useCategoryStore } from '@/store/category';
import { useRefreshStore } from '@/store/refreshStore.ts';

const props = defineProps<{ categoryToEdit?: Category | null }>();
const isDialogOpen = defineModel<boolean>({ default: false });
const categoryStore = useCategoryStore();
const refreshStore = useRefreshStore();

async function handleOpenChange(open: boolean) {
    isDialogOpen.value = open;
}

const formSchema = toTypedSchema(
    z.object({
        id: z.string().optional(),
        name: z.string().min(2).max(50),
    }),
);

const { isFieldDirty, handleSubmit, setErrors, setValues } = useForm({
    validationSchema: formSchema,
});

watch(isDialogOpen, (opened) => {
    if (opened) {
        setValues({ ...props.categoryToEdit });
    }
});

const onSubmit = handleSubmit(async (values) => {
    await categoryStore.loadCategories();
    const allCategories = categoryStore.categories;
    const isDuplicate = allCategories.some((category) => category.name === values.name && category.id !== values.id);

    if (isDuplicate) {
        setErrors({ name: '分类名不允许重复' });
        return;
    }

    try {
        if (values.id) {
            // 编辑现有分类
            await categoryStore.updateCategory({ id: values.id, name: values.name.trim() });
            refreshStore.refresh();
            console.debug('更新分类成功:', values.name);
        } else {
            // 添加新分类
            await categoryStore.addCategory({ name: values.name.trim() });
            console.debug('新增分类成功:', values.name);
        }
        isDialogOpen.value = false;
    } catch (error) {
        console.error('新增分类失败:', error);
        setErrors({ name: '新增分类失败' });
    }
});
</script>

<template>
    <Dialog :open="isDialogOpen" @update:open="handleOpenChange">
        <DialogTrigger as-child>
            <slot></slot>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>Edit your category info. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <form id="category" class="space-y-6" @submit="onSubmit">
                <FormField v-slot="{ componentField }" name="name" :validate-on-blur="!isFieldDirty">
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input type="text" placeholder="name" v-bind="componentField" />
                        </FormControl>
                        <FormDescription>This is category name.</FormDescription>
                        <FormMessage />
                    </FormItem>
                </FormField>
            </form>
            <DialogFooter>
                <Button type="submit" form="category">Save changes</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped></style>
