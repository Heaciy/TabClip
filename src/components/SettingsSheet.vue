<script setup lang="ts">
import { ref } from 'vue';
import { GearIcon } from '@radix-icons/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { defaultSettings, Settings, useSettingStore } from '@/store/settings.ts';

const opened = ref(false);
const settingsStore = useSettingStore();
const pageSizeChoices = [5, 10, 20, 50, 100];
const spaceBewteenTabsChoices = [0, 0.5, 1, 1.5, 2];

const formSchema = toTypedSchema(
    z.object({
        storePinnedTabs: z.boolean().optional(),
        defaultLockGroup: z.boolean().optional(),
        openGroupInNewWindow: z.boolean().optional(),
        useGoogleIcon: z.boolean().optional(),
        pageSize: z.number().optional(),
        spaceBetweenTabs: z.number().optional(),
        isStartupPage: z.boolean().optional(),
        storeBrowserGroup: z.boolean().optional(),
        tabWhitelist: z.string().optional(),
    }),
);

const formatSettings = (settings: Settings) => {
    return {
        ...settings,
        tabWhitelist: settings.tabWhitelist?.join('\n'),
    };
};

const form = useForm({
    validationSchema: formSchema,
    initialValues: formatSettings(settingsStore.settings),
});

const handleOpenChange = (open: boolean) => {
    form.resetForm({ values: formatSettings(settingsStore.settings) });
    opened.value = open;
};

const onSubmit = form.handleSubmit((values) => {
    settingsStore.refreshSettings({
        ...values,
        tabWhitelist: values.tabWhitelist
            ?.split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0),
    });
    handleOpenChange(false);
});

const doReset = () => {
    form.resetForm({ values: formatSettings(settingsStore.settings) });
};

const doRestoreDefaults = () => {
    form.resetForm({ values: formatSettings(defaultSettings) });
};
</script>

<template>
    <Sheet :open="opened" @update:open="handleOpenChange">
        <SheetTrigger as-child>
            <Button variant="ghost" size="icon">
                <GearIcon class="size-4" />
            </Button>
        </SheetTrigger>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>{{ $t('settings.sheetTile') }}</SheetTitle>
                <SheetDescription>
                    {{ $t('settings.sheetDesc') }}
                </SheetDescription>
            </SheetHeader>
            <ScrollArea class="overflow-auto">
                <form id="settingsForm" class="space-y-6 p-4" @submit="onSubmit">
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
                                    <Switch :model-value="value" @update:model-value="handleChange" />
                                </FormControl>
                            </FormItem>
                        </FormField>
                        <FormField v-slot="{ value, handleChange }" name="storeBrowserGroup">
                            <FormItem class="flex flex-row items-center justify-between">
                                <div class="space-y-0.5">
                                    <FormLabel class="text-base">
                                        {{ $t('settings.storeBrowserGroup.title') }}
                                    </FormLabel>
                                    <FormDescription>
                                        {{ $t('settings.storeBrowserGroup.desc') }}
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch :model-value="value" @update:model-value="handleChange" />
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
                                                <SelectValue placeholder="Select page size" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>{{ $t('settings.pageSize.selectLabel') }}</SelectLabel>
                                                <SelectItem
                                                    v-for="(size, index) in pageSizeChoices"
                                                    :key="index"
                                                    :value="size"
                                                >
                                                    {{ size }}
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        </FormField>
                        <FormField v-slot="{ componentField }" name="spaceBetweenTabs">
                            <FormItem class="flex flex-row items-center justify-between">
                                <div class="space-y-0.5">
                                    <FormLabel class="text-base">
                                        {{ $t('settings.spaceBetweenTabs.title') }}
                                    </FormLabel>
                                    <FormDescription>
                                        {{ $t('settings.spaceBetweenTabs.desc') }}
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Select v-bind="componentField">
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select space between tabs" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel
                                                    >{{ $t('settings.spaceBetweenTabs.selectLabel') }}
                                                </SelectLabel>
                                                <SelectItem
                                                    v-for="(space, index) in spaceBewteenTabsChoices"
                                                    :key="index"
                                                    :value="space"
                                                >
                                                    {{ space }}
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        </FormField>
                        <FormField v-slot="{ componentField }" name="tabWhitelist">
                            <FormItem class="flex-col items-center">
                                <div class="space-y-0.5">
                                    <FormLabel class="text-base">
                                        {{ $t('settings.TabWhitelist.title') }}
                                    </FormLabel>
                                    <FormDescription>
                                        {{ $t('settings.TabWhitelist.desc') }}
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Textarea
                                        v-bind="componentField"
                                        :placeholder="$t('settings.TabWhitelist.placeholder')"
                                    />
                                </FormControl>
                            </FormItem>
                        </FormField>
                    </div>
                </form>
            </ScrollArea>
            <SheetFooter>
                <div class="flex gap-2">
                    <Button type="button" form="settingsForm" variant="secondary" class="flex-1" @click="doReset">
                        {{ $t('settings.buttonDiscard') }}
                    </Button>
                    <Button
                        type="button"
                        form="settingsForm"
                        variant="destructive"
                        class="flex-1"
                        @click="doRestoreDefaults"
                    >
                        {{ $t('settings.buttonRestoreDefaults') }}
                    </Button>
                </div>
                <Button type="submit" form="settingsForm">
                    {{ $t('settings.buttonSave') }}
                </Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>
