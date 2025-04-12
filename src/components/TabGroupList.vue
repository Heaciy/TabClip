<script setup lang="ts">
import {type ComponentPublicInstance, nextTick, onMounted, onUnmounted, ref, type Ref, watch} from "vue";
import type {TabGroup} from "@/database.ts";
import {db} from "@/database.ts";
import {useSearchStore} from "@/store/search.ts";
import {useSettingStore} from "@/store/settings.ts";
import {useRefreshStore} from "@/store/refreshStore.ts";
import TabGroupComponent from './TabGroup.vue';

const tabGroups: Ref<TabGroup[]> = ref([]);
const tabGroupRefs = ref(new Map<string, ComponentPublicInstance>());

const isLoading = ref(false);
const searchStore = useSearchStore();
const settingsStore = useSettingStore();
const refreshStore = useRefreshStore();

const pageIndex = ref(1);
const pageSize = settingsStore.settings?.pageSize;

const resetTabGroups = () => {
    pageIndex.value = 1;
    tabGroups.value = [];
    isLoading.value = false;
}

const fetchTabGroups = async () => {
    if (isLoading.value) return;

    isLoading.value = true;
    const tabGroupPageData = await db.getAllTabGroups({
        ...searchStore.searchConditions, ...{
            pageIndex: pageIndex.value,
            pageSize,
        }
    });
    tabGroups.value.push(...tabGroupPageData);

    await nextTick(() => {
        observeLastTabGroup();
        isLoading.value = false;
    })
}

watch(() => searchStore.searchConditions, async () => {
    resetTabGroups();
    await fetchTabGroups();
})

watch(() => refreshStore.refreshed, async () => {
    resetTabGroups();
    await fetchTabGroups();
})


watch(pageIndex, async () => {
    await fetchTabGroups();
})

onMounted(async () => {
    await fetchTabGroups();
    chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
        if (message.event === "TabGroupUpdate") {
            tabGroups.value = await db.getAllTabGroups();
        }
    });
})

onUnmounted(() => {
    observer.disconnect();
})

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !isLoading.value) {
                const lastTabGroup = tabGroups.value[tabGroups.value.length - 1];
                if (entry.target === tabGroupRefs.value.get(lastTabGroup.id!)?.$el) {
                    pageIndex.value++;
                }
            }
        })
    },
    {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
    }
)

function observeLastTabGroup() {
    if (tabGroups.value.length) {
        const lastTabGroup = tabGroups.value[tabGroups.value.length - 1];
        const lastTabGroupEl = tabGroupRefs.value.get(lastTabGroup.id!)?.$el;
        if (lastTabGroupEl instanceof HTMLElement) {
            observer.observe(lastTabGroupEl);
        }
    }
}


const removeGroup = async (groupIndex: number) => {
    if (tabGroups.value[groupIndex].is_locked) {
        return;
    }
    const removedGroup = tabGroups.value.splice(groupIndex, 1)[0];
    tabGroupRefs.value.delete(removedGroup.id!);
    await db.deleteTabGroup(removedGroup.id!)

}

const removeTab = async (groupIndex: number, tabIndex: number) => {
    const group: TabGroup = tabGroups.value[groupIndex];
    if (group.is_locked) {
        return;
    }
    group.tabs_meta.splice(tabIndex, 1);
    if (group.tabs_meta.length < 1) {
        await removeGroup(groupIndex);
    } else {
        await db.updateTabGroup(group);
    }
}

const updateGroup = async (groupIndex: number, params: { is_starred?: boolean, is_locked?: boolean }) => {
    const group = tabGroups.value[groupIndex];
    Object.assign(group, {
        is_starred: params.is_starred ?? group.is_starred,
        is_locked: params.is_locked ?? group.is_locked
    });
    await db.updateTabGroup(group);

    if (searchStore.searchConditions.starredOnly && params.is_starred === false) {
        tabGroupRefs.value.delete(group.id!);
        tabGroups.value.splice(groupIndex, 1);
    }
}
</script>

<template>
    <div>
        <TabGroupComponent v-for="(tabGroup, index) in tabGroups" :tab-group="tabGroup" :key="tabGroup.id"
                           :ref="(el: ComponentPublicInstance) => { tabGroupRefs.set(tabGroup.id!, el as ComponentPublicInstance); return tabGroup.id; }"
                           @remove-group="removeGroup(index)" @remove-tab="removeTab(index, $event)"
                           @update-group="updateGroup(index, $event)">
        </TabGroupComponent>
    </div>
</template>