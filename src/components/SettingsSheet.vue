<script setup lang="ts">
import {Button} from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {Icon} from "@iconify/vue";
import {toTypedSchema} from "@vee-validate/zod";
import {useForm} from "vee-validate";
import * as z from "zod";
import {ref} from "vue";
import {useSettingStore} from "@/store/settings.ts";

const opened = ref(false);
const settingsStore = useSettingStore();
const pageSizeChoices = [5, 10, 20, 50, 100];

const formSchema = toTypedSchema(z.object({
    storePinnedTabs: z.boolean().optional(),
    defaultLockGroup: z.boolean().optional(),
    openGroupInNewWindow: z.boolean().optional(),
    useGoogleIcon: z.boolean().optional(),
    pageSize: z.number().optional(),
    isStartupPage: z.boolean().optional(),
}))

const form = useForm({
    validationSchema: formSchema,
    initialValues: {...settingsStore.settings},
})

const handleOpenChange = (open: boolean) => {
    form.resetForm({values: {...settingsStore.settings}});
    form.handleReset();
    opened.value = open;
}

const onSubmit = form.handleSubmit((values) => {
    settingsStore.refreshSettings(values);
    handleOpenChange(false);
})

const onReset = () => {
    form.resetForm({values: {...settingsStore.settings}});
    form.handleReset();
}
</script>

<template>
    <Sheet :open="opened" @update:open="handleOpenChange">
        <SheetTrigger as-child>
            <Button variant="ghost" size="icon">
                <Icon icon="radix-icons:gear" :class="'size-4'"></Icon>
            </Button>
        </SheetTrigger>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>{{ $t('settings.sheetTile') }}</SheetTitle>
                <SheetDescription>
                    {{ $t('settings.sheetDesc') }}
                </SheetDescription>
            </SheetHeader>
            <form class="space-y-6 p-4" @submit="onSubmit" @reset="onReset" id="settingsForm">
                <div class="space-y-4">
                    <FormField v-slot="{ value, handleChange }" name="storePinnedTabs">
                        <FormItem class="flex flex-row items-center justify-between">
                            <div class="space-y-0.5">
                                <FormLabel class="text-base">
                                    {{ $t('settings.storePinnedTabs.title') }}
                                </FormLabel>
                                <FormDescription>
                                    {{ $t('settings.storePinnedTabs.desc') }}
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    :model-value="value"
                                    @update:model-value="handleChange"
                                />
                            </FormControl>
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ value, handleChange }" name="defaultLockGroup">
                        <FormItem class="flex flex-row items-center justify-between">
                            <div class="space-y-0.5">
                                <FormLabel class="text-base">
                                    {{ $t('settings.defaultLockGroup.title') }}
                                </FormLabel>
                                <FormDescription>
                                    {{ $t('settings.defaultLockGroup.desc') }}
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    :model-value="value"
                                    aria-readonly="true"
                                    @update:model-value="handleChange"
                                />
                            </FormControl>
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ value, handleChange }" name="openGroupInNewWindow">
                        <FormItem class="flex flex-row items-center justify-between">
                            <div class="space-y-0.5">
                                <FormLabel class="text-base">
                                    {{ $t('settings.openGroupInNewWindow.title') }}
                                </FormLabel>
                                <FormDescription>
                                    {{ $t('settings.openGroupInNewWindow.desc') }}
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    :model-value="value"
                                    aria-readonly="true"
                                    @update:model-value="handleChange"
                                />
                            </FormControl>
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ value, handleChange }" name="useGoogleIcon">
                        <FormItem class="flex flex-row items-center justify-between">
                            <div class="space-y-0.5">
                                <FormLabel class="text-base">
                                    {{ $t('settings.useGoogleIcon.title') }}
                                </FormLabel>
                                <FormDescription>
                                    {{ $t('settings.useGoogleIcon.desc') }}
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    :model-value="value"
                                    aria-readonly="true"
                                    @update:model-value="handleChange"
                                />
                            </FormControl>
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ value, handleChange }" name="isStartupPage">
                        <FormItem class="flex flex-row items-center justify-between">
                            <div class="space-y-0.5">
                                <FormLabel class="text-base">
                                    {{ $t('settings.isStartupPage.title') }}
                                </FormLabel>
                                <FormDescription>
                                    {{ $t('settings.isStartupPage.desc') }}
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    :model-value="value"
                                    aria-readonly="true"
                                    @update:model-value="handleChange"
                                />
                            </FormControl>
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="pageSize">
                        <FormItem class="flex flex-row items-center justify-between">
                            <div class="space-y-0.5">
                                <FormLabel class="text-base">
                                    {{ $t('settings.pageSize.title') }}
                                </FormLabel>
                                <FormDescription>
                                    {{ $t('settings.pageSize.desc') }}
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Select v-bind="componentField">
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a device"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{{ $t('settings.pageSize.selectLabel') }}</SelectLabel>
                                            <SelectItem v-for="(size,index) in pageSizeChoices" :key="index"
                                                        :value="size">
                                                {{ size }}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                        </FormItem>
                    </FormField>
                </div>
            </form>
            <SheetFooter>
                <Button type="reset" form="settingsForm" variant="destructive">
                    {{ $t('settings.buttonDiscard') }}
                </Button>
                <Button type="submit" form="settingsForm">
                    {{ $t('settings.buttonSave') }}
                </Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>