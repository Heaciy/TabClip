<script setup lang="ts">
import { ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { Icon } from '@iconify/vue';
import { format } from 'date-fns';

import GroupName from './GroupName.vue';
import TabIcon from './TabIcon.vue';
import { Button } from '@/components/ui/button';
import { type Tab, type TabGroup } from '@/database';
import { useSettingStore } from '@/store/settings.ts';

const { t } = useI18n();
const settingStore = useSettingStore();
const props = defineProps<{ tabGroup: TabGroup; searchText?: string }>();
const emits = defineEmits(['remove-group', 'remove-tab', 'update-group']);
const tabs = ref<Array<Tab>>(props.tabGroup.tabs_meta);

function isTabOpenable(tab: Tab): boolean {
    if (import.meta.env.FIREFOX) {
        return tab.url?.startsWith('http') ?? false;
    }
    return true;
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
    if (import.meta.env.FIREFOX) {
        console.log(2);
        const index = tabs.value.findIndex((tab) => tab.id === id);
        if (index !== -1) {
            const tab = tabs.value[index];
            if (!isTabOpenable(tab)) {
                await navigator.clipboard.writeText(tab.url!);
                toast.warning(t('tabGroup.openTab.firefoxNotAllow.toastTitle'), {
                    description: t('tabGroup.openTab.firefoxNotAllow.toastDesc'),
                });
                return;
            }
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
    if (import.meta.env.FIREFOX) {
        if (tabGroup.tabs_meta.every((tab: Tab) => !isTabOpenable(tab))) {
            toast.warning(t('tabGroup.openTabGroup.firefoxNotAllow.toastTitle'), {
                description: t('tabGroup.openTabGroup.firefoxNotAllow.toastDesc'),
            });
            return;
        }
    }

    const window = newWindow ? await browser.windows.create({ focused: true }) : await browser.windows.getCurrent();
    const tabsToClose: Array<Browser.tabs.Tab> = newWindow ? await browser.tabs.query({ windowId: window.id! }) : [];

    tabGroup.tabs_meta.map(async (tab) => {
        await browser.tabs.create({ windowId: window.id, url: tab.url!, pinned: tab.pinned });
    });

    if (tabsToClose) {
        await browser.tabs.remove(tabsToClose.map((tab) => tab.id!));
    }

    if (import.meta.env.FIREFOX) {
        if (tabGroup.tabs_meta.some((tab: Tab) => !isTabOpenable(tab))) {
            toast.warning(t('tabGroup.openTabGroup.firefoxNotAllow.toastTitle'), {
                description: t('tabGroup.openTabGroup.firefoxNotAllow.toastDesc'),
            });
            return;
        }
    }

    emits('remove-group');
}

async function copyTabGroup(tabGroup: TabGroup) {
    const text = tabGroup.tabs_meta.map((tab) => `${tab.title}\n${tab.url}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    toast.success(t('tabGroup.copyLinks.toastTitle'), {
        description: t('tabGroup.copyLinks.toastDesc', { total: tabGroup.tabs_meta.length }),
    });
}

function escapeHtml(text: string): string {
    return text.replace(
        /[&<>"']/g,
        (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[match] || match,
    );
}

function highlightedTitle(title: string): string {
    if (!props.searchText) {
        return escapeHtml(title); // 防止 XSS
    }

    const escapedSearch = props.searchText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); // 转义正则关键字符
    const regex = new RegExp(`(${escapedSearch})`, 'gi');

    return escapeHtml(title).replace(regex, '<span class="text-red-500 font-bold">$1</span>');
}
</script>

<template>
    <div class="m-5">
        <div class="mb-2 flex flex-row gap-3 align-middle">
            <GroupName
                :name="props.tabGroup.name"
                @update-name="
                    (name) => {
                        $emit('update-group', { name: name });
                    }
                "
            >
            </GroupName>
            <span class="inline-flex items-center">
                {{ $t('tabGroup.total', { total: props.tabGroup.tabs_meta.length }) }}
            </span>
            <span class="inline-flex items-center">
                {{ format(props.tabGroup.create_time!, 'yyyy-MM-dd HH:mm:ss') }}</span
            >
            <Button :disabled="props.tabGroup.is_locked" variant="ghost" size="icon" @click="$emit('remove-group')">
                <Icon icon="radix-icons:trash"></Icon>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                @click="$emit('update-group', { is_starred: !props.tabGroup.is_starred })"
            >
                <Icon :icon="props.tabGroup.is_starred ? 'radix-icons:star-filled' : 'radix-icons:star'"></Icon>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                @click="$emit('update-group', { is_locked: !props.tabGroup.is_locked })"
            >
                <Icon :icon="props.tabGroup.is_locked ? 'radix-icons:lock-closed' : 'radix-icons:lock-open-1'"></Icon>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                @click="openTabGroup(tabGroup, settingStore.settings.openGroupInNewWindow)"
            >
                <Icon icon="radix-icons:open-in-new-window"></Icon>
            </Button>
            <Button variant="ghost" size="icon" @click="copyTabGroup(tabGroup)">
                <Icon icon="radix-icons:copy"></Icon>
            </Button>
        </div>
        <VueDraggable
            v-model="tabs"
            :disabled="!!props.tabGroup.is_locked"
            :animation="150"
            group="tabGroup"
            ghost-class="ghost"
            @update="onTabsMetaUpdate"
            @add="onTabsMetaUpdate"
            @remove="onTabsMetaUpdate"
        >
            <div v-for="tab in tabs" :key="tab.id" class="group flex items-center gap-2">
                <button
                    class="invisible hidden items-center opacity-0 transition-opacity duration-500 ease-in-out group-hover:visible group-hover:opacity-100 md:flex"
                    :style="{ visibility: props.tabGroup.is_locked ? 'hidden' : 'visible' }"
                    @click="removeTab(tab.id!)"
                >
                    <Icon icon="radix-icons:cross-2" class="h-4 w-4" />
                </button>
                <TabIcon :tab-url="tab.url!" :use-google-icon="settingStore.settings.useGoogleIcon"></TabIcon>
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
                    :class="tab.url?.includes(props.searchText) ? 'font-bold text-red-500' : ''"
                    @click.prevent="handleLinkClick(tab.id!)"
                    v-html="highlightedTitle(tab.title!)"
                ></a>
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
