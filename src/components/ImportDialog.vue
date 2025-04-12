<script setup lang="ts">
import {ref} from "vue";
import * as z from 'zod';
import {toast} from "vue-sonner";
import {useForm} from 'vee-validate'
import {toTypedSchema} from '@vee-validate/zod';
import {db, type TabGroup} from "@/database.ts";
import {useRefreshStore} from "@/store/refreshStore.ts";

import {Button} from '@/components/ui/button';
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

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const isDialogOpen = defineModel({default: false});
const isSubmitting = ref<boolean>(false);
const refreshStore = useRefreshStore();

const formSchema = toTypedSchema(z.object({
    file: z.instanceof(File, {message: "Please select a file"})
        .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 20MB')
        .refine(
            (file) => file.type === 'application/json',
            'File must be JSON format'
        ),
    check_duplicate: z.boolean().default(true),
}))
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
        toast.success("Import successful", {
            description: `Successfully imported ${tabGroups.length} tab groups.`,
        })
    } catch (err) {
        console.error('JSON 文件解析失败', err);
        form.setErrors({file: "文件格式错误"});
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
                <DialogTitle>Import Data</DialogTitle>
                <DialogDescription>
                    Import the data exported from TabClip/Onetab.
                </DialogDescription>
            </DialogHeader>

            <form id="dialogForm" class="space-y-2" @submit="onSubmit" @reset="onReset">
                <FormField v-slot="{ handleChange }" name="file">
                    <FormItem>
                        <FormLabel>Exported File<span class="text-red-500 ml-1">*</span></FormLabel>
                        <FormControl>
                            <input type="file" accept=".json" @change="(e: any) => handleChange(e.target.files[0])"
                                   :disabled="isSubmitting"
                                   class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 leading-7">
                        </FormControl>
                        <FormDescription>The file exported from TabClip/Onetab extension (JSON, max 20MB).
                        </FormDescription>
                        <FormMessage/>
                    </FormItem>
                </FormField>
            </form>

            <DialogFooter>
                <Button type="reset" form="dialogForm" variant="destructive" :disabled="isSubmitting">Reset</Button>
                <Button type="submit" form="dialogForm" :disabled="isSubmitting">{{
                        isSubmitting ? 'Importing...' : 'Import'
                    }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>