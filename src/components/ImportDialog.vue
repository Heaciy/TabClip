<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from 'vue-i18n';
import { toast } from "vue-sonner";
import { configure, defineRule, useForm } from 'vee-validate';
import { db, type TabGroup } from "@/database.ts";
import { useRefreshStore } from "@/store/refreshStore.ts";

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
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

const { t } = useI18n();
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const isDialogOpen = defineModel({ default: false });
const isSubmitting = ref<boolean>(false);
const refreshStore = useRefreshStore();

function bytesToMB(bytes: number): number {
    const mb = bytes / (1024 * 1024);
    return mb % 1 === 0 ? mb : parseFloat(mb.toFixed(2));
}

defineRule('fileRequired', (value: any) => {
    return (value instanceof File);
});

defineRule('fileSize', (value: any, [maxSize]: [number]) => {
    return (value instanceof File) && value.size <= maxSize;
});

defineRule('fileType', (value: any, [type]: [string]) => {
    return (value instanceof File) && value.type === type;
});

configure({
    generateMessage: (ctx) => {
        const rule = ctx.rule;
        if (!rule) {
            return `Invalid field ${ctx.field}`;
        }

        const params = (rule.params as unknown[]) || [];
        if (rule.name === 'fileSize') {
            const maxSize = `${bytesToMB((params[0] as number))}MB`;
            return t('veeValidate.fileSize', { maxSize });
        }
        if (rule.name === 'fileType') {
            const fileType = params[0] as string;
            return t('veeValidate.fileType', { fileType });
        }
        return t(`veeValidate.${ctx.rule?.name}`);
    },
});

const formSchema = {
    file: {
        fileRequired: true,
        fileSize: [MAX_FILE_SIZE],
        fileType: ['application/json']
    }
}

const form = useForm({
    validationSchema: formSchema,
})

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const onSubmit = form.handleSubmit(async (values) => {
    isSubmitting.value = true;
    const file = values.file as File;
    const jsonStr = await file.text();
    try {
        const data = JSON.parse(jsonStr);
        const tabGroups: Array<TabGroup> = data.tabGroups;
        const pageSize = 100;
        const pageCount = Math.ceil(tabGroups.length / pageSize);
        for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
            await db.bulkPutGroups(tabGroups.slice((pageIndex - 1) * pageSize, pageIndex * pageSize));
            await sleep(1000);
        }
        isDialogOpen.value = false;

        refreshStore.refresh();
        toast.success(t("importGroups.success.toastTitle"), {
            description: t("importGroups.success.toastDesc", { total: tabGroups.length }),
        })
    } catch (err) {
        console.error(t("importGroups.error.parseError"), err);
        form.setErrors({ file: t("importGroups.error.fileFormatError") });
    }
    isSubmitting.value = false;
});

const onReset = () => {
    form.resetForm();
    form.handleReset();
}

async function handleOpenChange(open: boolean) {
    isDialogOpen.value = open;
}
</script>

<template>
    <Dialog :open="isDialogOpen" @update:open="handleOpenChange">
        <DialogTrigger as-child>
            <slot></slot>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ $t("importGroups.dialogTitle") }}</DialogTitle>
                <DialogDescription>
                    {{ $t("importGroups.dialogDesc") }}
                </DialogDescription>
            </DialogHeader>

            <form id="dialogForm" class="space-y-2" @submit="onSubmit" @reset="onReset">
                <FormField v-slot="{ handleChange }" name="file">
                    <FormItem>
                        <FormLabel>{{ $t("importGroups.form.file.label") }}<span class="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                            <input type="file" accept=".json" @change="(e: any) => handleChange(e.target.files[0])"
                                :disabled="isSubmitting"
                                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 leading-7">
                        </FormControl>
                        <FormDescription>
                            {{ $t("importGroups.form.file.desc", { maxSize: `${bytesToMB(MAX_FILE_SIZE)}MB` }) }}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                </FormField>
            </form>

            <DialogFooter>
                <Button type="reset" form="dialogForm" variant="destructive" :disabled="isSubmitting">
                    {{ $t("importGroups.buttonReset") }}
                </Button>
                <Button type="submit" form="dialogForm" :disabled="isSubmitting">{{
                    isSubmitting ? $t("importGroups.buttonImporting") : $t("importGroups.buttonImport")
                }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>