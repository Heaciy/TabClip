<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { configure, defineRule, useForm } from 'vee-validate';

import Progress from './ui/progress/Progress.vue';
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

const { t } = useI18n();
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const isDialogOpen = defineModel<boolean>({ default: false });
const props = withDefaults(
    defineProps<{
        isImporting?: boolean;
        progress?: number;
        importData: (_file: File) => Promise<void>;
    }>(),
    { isImporting: false, progress: 0 },
);

function bytesToMB(bytes: number): number {
    const mb = bytes / (1024 * 1024);
    return mb % 1 === 0 ? mb : parseFloat(mb.toFixed(2));
}

defineRule('fileRequired', (value: any) => {
    return value instanceof File;
});

defineRule('fileSize', (value: any, [maxSize]: [number]) => {
    return value instanceof File && value.size <= maxSize;
});

defineRule('fileType', (value: any, [type]: [string]) => {
    return value instanceof File && value.type === type;
});

configure({
    generateMessage: (ctx) => {
        const rule = ctx.rule;
        if (!rule) {
            return `Invalid field ${ctx.field}`;
        }

        const params = (rule.params as unknown[]) || [];
        if (rule.name === 'fileSize') {
            const maxSize = `${bytesToMB(params[0] as number)}MB`;
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
        fileType: ['application/json'],
    },
};

const form = useForm({
    validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values) => {
    const file = values.file as File;
    try {
        await props.importData(file);
    } catch (err) {
        console.error(t('importGroups.error.parseError'), err);
        form.setErrors({ file: t('importGroups.error.fileFormatError') });
    }
});

const onReset = () => {
    form.resetForm();
    form.handleReset();
};

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
                <DialogTitle>{{ $t('importGroups.dialogTitle') }}</DialogTitle>
                <DialogDescription>
                    {{ $t('importGroups.dialogDesc') }}
                </DialogDescription>
            </DialogHeader>

            <form v-if="!props.isImporting" id="dialogForm" class="space-y-2" @submit="onSubmit" @reset="onReset">
                <FormField v-slot="{ handleChange }" name="file">
                    <FormItem>
                        <FormLabel
                            >{{ $t('importGroups.form.file.label') }}<span class="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                            <input
                                type="file"
                                accept=".json"
                                :disabled="props.isImporting"
                                class="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm leading-7 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                @change="(e: any) => handleChange(e.target.files[0])"
                            />
                        </FormControl>
                        <FormDescription>
                            {{
                                $t('importGroups.form.file.desc', {
                                    maxSize: `${bytesToMB(MAX_FILE_SIZE)}MB`,
                                })
                            }}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                </FormField>
            </form>
            <Progress v-else :model-value="props.progress" />

            <DialogFooter>
                <Button type="reset" form="dialogForm" variant="destructive" :disabled="props.isImporting">
                    {{ $t('importGroups.buttonReset') }}
                </Button>
                <Button type="submit" form="dialogForm" :disabled="props.isImporting">
                    {{ props.isImporting ? $t('importGroups.buttonImporting') : $t('importGroups.buttonImport') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
