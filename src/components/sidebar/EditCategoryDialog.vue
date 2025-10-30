<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();
const props = defineProps<{ categoryToEdit?: Category | null }>();
const isDialogOpen = defineModel<boolean>({ default: false });
const categoryStore = useCategoryStore();
const refreshStore = useRefreshStore();

const dialogTitle = computed(() => {
    return props.categoryToEdit ? t('category.edit.update.dialogTitle') : t('category.edit.add.dialogTitle');
});
const dialogDesc = computed(() => {
    return props.categoryToEdit ? t('category.edit.update.dialogDesc') : t('category.edit.add.dialogDesc');
});

async function handleOpenChange(open: boolean) {
    isDialogOpen.value = open;
}

const formSchema = computed(() => {
    return toTypedSchema(
        z.object({
            id: z.string().optional(),
            name: z
                .string()
                .min(2, { message: t('veeValidate.strMin', { field: t('category.edit.formLabel'), min: 2 }) })
                .max(50, { message: t('veeValidate.strMax', { field: t('category.edit.formLabel'), max: 50 }) }),
        }),
    );
});

const { isFieldDirty, handleSubmit, setErrors, setValues } = useForm({
    validationSchema: formSchema,
});

watch(isDialogOpen, (opened) => {
    if (opened) {
        setValues({ id: undefined, ...props.categoryToEdit });
    }
});

const onSubmit = handleSubmit(async (values) => {
    const isDuplicate = categoryStore.categories.some(
        (category) => category.name === values.name && category.id !== values.id,
    );

    if (isDuplicate) {
        setErrors({ name: t('category.edit.duplicateError') });
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
                <DialogTitle>{{ dialogTitle }}</DialogTitle>
                <DialogDescription>{{ dialogDesc }}</DialogDescription>
            </DialogHeader>
            <form id="category" class="space-y-6" @submit="onSubmit">
                <FormField v-slot="{ componentField }" name="name" :validate-on-blur="!isFieldDirty">
                    <FormItem>
                        <FormLabel>{{ $t('category.edit.formLabel') }}</FormLabel>
                        <FormControl>
                            <Input type="text" placeholder="name" v-bind="componentField" />
                        </FormControl>
                        <FormDescription>{{ $t('category.edit.formDesc') }}</FormDescription>
                        <FormMessage />
                    </FormItem>
                </FormField>
            </form>
            <DialogFooter>
                <Button type="submit" form="category">{{ $t('category.edit.buttonSave') }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped></style>
