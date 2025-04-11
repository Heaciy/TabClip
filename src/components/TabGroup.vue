<script setup lang="ts">
import { format } from "date-fns";
import { Icon } from '@iconify/vue';
import { Button } from "@/components/ui/button";
import TabIcon from "./TabIcon.vue";
import { type TabGroup } from "@/database";
import { useSettingStore } from "@/store/settings.ts";

const settingStore = useSettingStore();
const props = defineProps(['tabGroup'])
const emits = defineEmits(['remove-group', 'remove-tab', 'update-group'])

function handleLinkClick(index: number) {
    const tab = props.tabGroup.tabs_meta[index];
    chrome.tabs.create({ url: tab.url });
    emits('remove-tab', index);
}

async function openTabGroup(tabGroup: TabGroup, newWindow: boolean = false) {
    if (newWindow) {
        chrome.windows.create(
            { focused: true, url: tabGroup.tabs_meta.map(tab => tab.url!) },
            () => { emits('remove-group'); }
        )
    } else {
        const window = await chrome.windows.getCurrent();
        tabGroup.tabs_meta.map(async (tab) => {
            await chrome.tabs.create({ windowId: window.id, url: tab.url! });
        });
        emits('remove-group');
    }
}

async function copyTabGroup(tabGroup: TabGroup) {
    const text = tabGroup.tabs_meta.map(tab => `${tab.title}\n${tab.url}`).join('\n\n');
    await navigator.clipboard.writeText(text);
}
</script>

<template>
    <div class="m-5">
        <div class="flex flex-row gap-3 align-middle mb-2">
            <span class="inline-flex items-center">
                Total: {{ props.tabGroup.tabs_meta.length }} tabs
            </span>
            <span class="inline-flex items-center">
                {{ format(props.tabGroup.create_time, "yyyy-MM-dd HH:mm:ss") }}</span>
            <Button @click="$emit('remove-group')" :disabled="props.tabGroup.is_locked" variant="ghost" size="icon">
                <Icon icon="radix-icons:trash"></Icon>
            </Button>
            <Button @click="$emit('update-group', { is_starred: !props.tabGroup.is_starred })" variant="ghost"
                size="icon">
                <Icon :icon="props.tabGroup.is_starred ? 'radix-icons:star-filled' : 'radix-icons:star'"></Icon>
            </Button>
            <Button @click="$emit('update-group', { is_locked: !props.tabGroup.is_locked })" variant="ghost" size="icon">
                <Icon :icon="props.tabGroup.is_locked ? 'radix-icons:lock-closed' : 'radix-icons:lock-open-1'"></Icon>
            </Button>
            <Button @click="openTabGroup(tabGroup, settingStore.settings.openGroupInNewWindow)" variant="ghost"
                size="icon">
                <Icon icon="radix-icons:open-in-new-window"></Icon>
            </Button>
            <Button @click="copyTabGroup(tabGroup)" variant="ghost" size="icon">
                <Icon icon="radix-icons:copy"></Icon>
            </Button>
        </div>
        <div v-for="(tab, index) in props.tabGroup.tabs_meta" class="flex items-center group gap-2">
            <button @click="$emit('remove-tab', index)"
                class="hidden md:flex items-center invisible group-hover:visible transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100"
                :style="{ visibility: props.tabGroup.is_locked ? 'hidden' : 'visible' }">
                <Icon icon="radix-icons:cross-2" class="h-4 w-4" />
            </button>
            <TabIcon :tab-url="tab.url"></TabIcon>
            <a @click.prevent="handleLinkClick(index)" :href="tab.url"
                class="text-sm text-nowrap overflow-hidden text-ellipsis">{{ tab.title }}</a>
        </div>
    </div>
</template>

<style scoped></style>