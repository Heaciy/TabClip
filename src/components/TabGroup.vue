<script setup lang="ts">
import {format} from "date-fns";
import TabIcon from "./TabIcon.vue";
import {Icon} from '@iconify/vue';
import {db, type TabGroup} from "@/database";

const props = defineProps(['tabGroup'])
const emits = defineEmits(['remove-group', 'remove-tab'])

const updateGroup = async (tabGroup: TabGroup) => {
    await db.updateTabGroup(tabGroup);
}

function handleLinkClick(index: number) {
    setTimeout(() => {
        emits('remove-tab', index);
    }, 100);
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
            <button @click="$emit('remove-group')" :disabled="props.tabGroup.is_locked">
                <Icon icon="radix-icons:trash"></Icon>
            </button>
            <button @click="props.tabGroup.is_starred = ! props.tabGroup.is_starred; updateGroup(props.tabGroup)">
                <Icon :icon="props.tabGroup.is_starred?'radix-icons:star-filled':'radix-icons:star'"></Icon>
            </button>
            <button @click="props.tabGroup.is_locked = !props.tabGroup.is_locked; updateGroup(props.tabGroup);">
                <Icon :icon="props.tabGroup.is_locked?'radix-icons:lock-closed':'radix-icons:lock-open-1'"></Icon>
            </button>
            <button>
                <Icon icon="radix-icons:open-in-new-window"></Icon>
            </button>
        </div>
        <div v-for="(tab, index) in props.tabGroup.tabs_meta" class="flex items-center group gap-2">
            <button @click="$emit('remove-tab', index)"
                    class="hidden md:flex items-center invisible group-hover:visible transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100"
                    :style="{ visibility: props.tabGroup.is_locked ? 'hidden' : 'visible' }">
                <Icon icon="radix-icons:cross-2" class="h-4 w-4"/>
            </button>
            <TabIcon :tab-url="tab.url"></TabIcon>
            <a @click="handleLinkClick(index)" :href="tab.url" target="_blank"
               class="text-sm text-nowrap overflow-hidden text-ellipsis">{{ tab.title }}</a>
        </div>
    </div>
</template>

<style scoped></style>