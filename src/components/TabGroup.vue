<script setup lang="ts">
import { ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import {
    CopyIcon,
    LockClosedIcon,
    LockOpen1Icon,
    OpenInNewWindowIcon,
    StarFilledIcon,
    StarIcon,
} from '@radix-icons/vue';
import { format } from 'date-fns';
import { CalendarClockIcon, ChartBarBigIcon, Folder, TrashIcon, XIcon } from 'lucide-vue-next';
import { AcceptableValue, SelectItem as SelectItemReka, SelectItemText, SelectTrigger } from 'reka-ui';

import GroupName from './GroupName.vue';
import HighlightText from './HighlightText.vue';
import TabIcon from './TabIcon.vue';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectValue,
} from '@/components/ui/select';
import { useConfirmDialog } from '@/composables/useConfirmDialog.ts';
import { useEditCategoryDialog } from '@/composables/useEditCategoryDialog.ts';
import { Category, type Tab, type TabGroup } from '@/database';
import { useCategoryStore } from '@/store/category.ts';
import { useSettingStore } from '@/store/settings.ts';

const { t } = useI18n();
const settingStore = useSettingStore();
const props = defineProps<{ tabGroup: TabGroup; searchText?: string }>();
const emits = defineEmits(['remove-group', 'remove-tab', 'update-group']);
const tabs = ref<Array<Tab>>(props.tabGroup.tabs_meta);
const { openDialog: openConfirmDialog } = useConfirmDialog();

function isTabOpenable(tab: Tab): boolean {
    const blockedPrefixes = ['about:', 'javascript:', 'file:', 'view-source:', 'data:'];
    if (blockedPrefixes.some((prefix) => tab.url?.startsWith(prefix))) {
        return false;
    }

    let browserBlocked: string[];
    if (import.meta.env.FIREFOX) {
        browserBlocked = ['edge:', 'chrome:'];
    } else if (import.meta.env.EDGE) {
        browserBlocked = ['chrome:'];
    } else {
        browserBlocked = ['edge:'];
    }

    return !browserBlocked.some((prefix) => tab.url?.startsWith(prefix));
}

function removeTab(id: number | string) {
    const index = tabs.value.findIndex((tab) => tab.id === id);
    if (index !== -1) {
        const removedTab = tabs.value[index];
        emits('remove-tab', index);
        return removedTab;
    }
}

async function handleLinkClick(id: number | string) {
    const index = tabs.value.findIndex((tab) => tab.id === id);
    if (index !== -1) {
        const tab = tabs.value[index];
        if (!isTabOpenable(tab)) {
            await navigator.clipboard.writeText(tab.url!);
            toast.warning(t('tabGroup.openTab.notAllow.dialogTitle'), {
                description: t('tabGroup.openTab.notAllow.dialogDesc'),
            });
            return;
        }
    }

    const tabToOpen = removeTab(id);
    if (tabToOpen) {
        browser.tabs.create({ url: tabToOpen.url });
    }
}

const onTabsMetaUpdate = () => {
    emits('update-group', { tabs_meta: tabs.value });
};

async function openTabGroup(tabGroup: TabGroup, newWindow: boolean = false) {
    if (tabGroup.tabs_meta.some((tab: Tab) => !isTabOpenable(tab))) {
        if (tabGroup.tabs_meta.every((tab: Tab) => !isTabOpenable(tab))) {
            openConfirmDialog(
                t('tabGroup.openTabGroup.notAllow.dialogTitle'),
                t('tabGroup.openTabGroup.notAllow.dialogDesc'),
            );
        } else {
            openConfirmDialog(
                t('tabGroup.openTabGroup.notAllow.dialogTitle'),
                t('tabGroup.openTabGroup.notAllow.dialogDesc'),
                () => doOpenTabGroup(tabGroup, newWindow, false),
            );
        }
    } else {
        await doOpenTabGroup(tabGroup, newWindow, true);
    }
}

async function doOpenTabGroup(tabGroup: TabGroup, newWindow: boolean = false, removeGroup?: boolean) {
    const window = (
        newWindow ? await browser.windows.create({ focused: true }) : await browser.windows.getCurrent()
    ) as Browser.windows.Window;
    const tabsToClose: Array<Browser.tabs.Tab> = newWindow ? await browser.tabs.query({ windowId: window.id! }) : [];

    const createdTabs: Browser.tabs.Tab[] = await Promise.all(
        tabGroup.tabs_meta.map((tab) =>
            browser.tabs.create({ windowId: window.id, url: tab.url!, pinned: tab.pinned }),
        ),
    );
    if (tabGroup.is_browser_group) {
        const tabIds = createdTabs.map((tab) => tab.id!).filter(Boolean) as [number, ...number[]];
        const groupId = await browser.tabs.group({ tabIds });
        if (tabGroup.name) {
            await browser.tabGroups.update(groupId, { title: tabGroup.name });
        }
    }

    if (tabsToClose) {
        await browser.tabs.remove(tabsToClose.map((tab) => tab.id!));
    }

    if (removeGroup) {
        emits('remove-group');
    }
}

async function copyTabGroup(tabGroup: TabGroup) {
    const text = tabGroup.tabs_meta.map((tab) => `${tab.title}\n${tab.url}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    toast.success(t('tabGroup.copyLinks.toastTitle'), {
        description: t('tabGroup.copyLinks.toastDesc', { total: tabGroup.tabs_meta.length }),
    });
}

// TODO: 改为使用v-model传递Group数据，方便在子组件内直接更新
const categoryStore = useCategoryStore();
const selectedValue = ref<AcceptableValue>(props.tabGroup.category_id || null);
let previousValue: AcceptableValue = selectedValue.value;
const { openDialog: openEditCategoryDialog } = useEditCategoryDialog();

const handleSelectChange = (val: AcceptableValue) => {
    if (val === previousValue) {
        selectedValue.value = null;
    } else if (val === 'ADD_NEW_CATEGORY') {
        selectedValue.value = previousValue; // 保持值不变
        openEditCategoryDialog(undefined, bindNewCategoryToGroup);
        return;
    }
    previousValue = selectedValue.value;
    emits('update-group', { category_id: selectedValue.value });
};

const bindNewCategoryToGroup = (category: Category) => {
    emits('update-group', { category_id: category.id });
    selectedValue.value = category.id!;
    previousValue = selectedValue.value;
};
</script>

<template>
    <div class="m-5">
        <div class="mb-2 flex flex-row gap-5.5 align-middle">
            <div class="flex items-center gap-8">
                <GroupName
                    :name="props.tabGroup.name"
                    :search-text="props.searchText"
                    @update-name="
                        (name) => {
                            $emit('update-group', { name: name });
                        }
                    "
                >
                </GroupName>

                <div class="text-muted-foreground flex items-center gap-2">
                    <CalendarClockIcon class="size-4 shrink-0" />
                    <span class="text-muted-foreground inline-flex items-center whitespace-nowrap">
                        {{ format(props.tabGroup.create_time!, 'yyyy/MM/dd HH:mm:ss') }}</span
                    >
                </div>

                <div class="text-muted-foreground flex items-center gap-2">
                    <ChartBarBigIcon class="size-4 shrink-0" />
                    <span class="text-muted-foreground inline-flex items-center whitespace-nowrap">
                        {{ $t('tabGroup.total', { total: props.tabGroup.tabs_meta.length }) }}
                    </span>
                </div>
            </div>

            <!-- buttons -->
            <div class="flex gap-3">
                <Button :disabled="props.tabGroup.is_locked" variant="ghost" size="icon" @click="$emit('remove-group')">
                    <TrashIcon class="shrink-0" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    @click="$emit('update-group', { is_starred: !props.tabGroup.is_starred })"
                >
                    <StarFilledIcon v-if="props.tabGroup.is_starred" />
                    <StarIcon v-else />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    @click="$emit('update-group', { is_locked: !props.tabGroup.is_locked })"
                >
                    <LockClosedIcon v-if="props.tabGroup.is_locked" />
                    <LockOpen1Icon v-else />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    @click="openTabGroup(tabGroup, settingStore.settings.openGroupInNewWindow)"
                >
                    <OpenInNewWindowIcon />
                </Button>
                <Button variant="ghost" size="icon" @click="copyTabGroup(tabGroup)">
                    <CopyIcon />
                </Button>
                <Select v-model="selectedValue" @update:model-value="handleSelectChange">
                    <SelectTrigger as-child>
                        <Button
                            variant="ghost"
                            class="group font-normal focus-visible:ring-0"
                            :class="selectedValue ? 'gap-2' : 'gap-0'"
                        >
                            <Folder />
                            <SelectValue class="text-muted-foreground group-hover:text-inherit" />
                        </Button>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>{{ $t('category.label') }}</SelectLabel>
                            <SelectItem
                                v-for="category in categoryStore.orderedCategories"
                                :key="category.id"
                                :value="category.id!"
                            >
                                {{ category.name }}
                            </SelectItem>
                        </SelectGroup>
                        <SelectSeparator></SelectSeparator>
                        <SelectGroup>
                            <SelectLabel>{{ $t('category.quickActions.label') }}</SelectLabel>
                            <SelectItemReka
                                key="ADD_NEW_CATEGORY"
                                value="ADD_NEW_CATEGORY"
                                :class="`focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2`"
                            >
                                <SelectItemText>{{ $t('category.quickActions.add') }}</SelectItemText>
                            </SelectItemReka>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <VueDraggable
            v-model="tabs"
            :disabled="!!props.tabGroup.is_locked"
            :animation="150"
            group="tabGroup"
            ghost-class="ghost"
            class="space-y-2"
            @update="onTabsMetaUpdate"
            @add="onTabsMetaUpdate"
            @remove="onTabsMetaUpdate"
        >
            <div v-for="tab in tabs" :key="tab.id" class="group flex items-center gap-2">
                <button
                    class="text-muted-foreground hover:text-foreground invisible hidden items-center opacity-0 transition-[opacity,colors] duration-200 ease-in-out group-hover:visible group-hover:opacity-100 md:flex"
                    :style="{ visibility: props.tabGroup.is_locked ? 'hidden' : 'visible' }"
                    @click="removeTab(tab.id!)"
                >
                    <XIcon class="size-4" />
                </button>
                <TabIcon
                    :tab-url="tab.url!"
                    :use-google-icon="settingStore.settings.useGoogleIcon"
                    class="flex-shrink-0"
                ></TabIcon>
                <a
                    v-if="!props.searchText"
                    :href="tab.url"
                    class="overflow-hidden text-sm text-nowrap text-ellipsis"
                    @click.prevent="handleLinkClick(tab.id!)"
                    >{{ tab.title }}</a
                >
                <a
                    v-else
                    :href="tab.url"
                    class="overflow-hidden text-sm text-nowrap text-ellipsis"
                    @click.prevent="handleLinkClick(tab.id!)"
                >
                    <HighlightText :keyword="props.searchText" :text="tab.title" :url="tab.url"></HighlightText>
                </a>
            </div>
        </VueDraggable>
    </div>
</template>

<style scoped>
.ghost {
    color: var(--color-accent-foreground);
    background-color: var(--color-accent);
}
</style>
