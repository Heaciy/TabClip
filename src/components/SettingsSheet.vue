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
    pageSize: z.number().optional(),
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
                <SheetTitle>Edit Settings</SheetTitle>
                <SheetDescription>
                    Make changes to your settings here. Click save when you're done.
                </SheetDescription>
            </SheetHeader>
            <form class="space-y-6 p-4" @submit="onSubmit" @reset="onReset" id="settingsForm">
                <div class="space-y-4">
                    <FormField v-slot="{ value, handleChange }" name="storePinnedTabs">
                        <FormItem class="flex flex-row items-center justify-between">
                            <div class="space-y-0.5">
                                <FormLabel class="text-base">
                                    Store Pinned Tabs
                                </FormLabel>
                                <FormDescription>
                                    Store pinned tabs when adding group, default not.
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
                                    Default Lock Group
                                </FormLabel>
                                <FormDescription>
                                    Default lock group when adding group, default not.
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
                                    Open Group In New Window
                                </FormLabel>
                                <FormDescription>
                                    Open a new window when recover group, default not and open in current window.
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
                                    Page size
                                </FormLabel>
                                <FormDescription>
                                    The number of TabGroups loaded each time.
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
                                            <SelectLabel>Page size</SelectLabel>
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
                    Reset
                </Button>
                <Button type="submit" form="settingsForm">
                    Save changes
                </Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>