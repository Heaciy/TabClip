<script setup lang="ts">
import {
    type ComponentPublicInstance,
    computed,
    type ComputedRef,
    nextTick,
    onMounted,
    onUnmounted,
    ref,
    type Ref,
    watch
} from "vue";
import type {Tab, TabGroup} from "@/database.ts";
import {db} from "@/database.ts";
import {useSearchStore} from "@/store/search.ts";
import {useSettingStore} from "@/store/settings.ts";
import {useRefreshStore} from "@/store/refreshStore.ts";
import TabGroupComponent from './TabGroup.vue';
import BackToTop from "./BackToTop.vue";

const tabGroups: Ref<TabGroup[]> = ref([]);
const tabGroupRefs = ref(new Map<string, ComponentPublicInstance>());

const isLoading = ref(false);
const searchStore = useSearchStore();
const settingsStore = useSettingStore();
const refreshStore = useRefreshStore();

const pageIndex = ref(1);
const pageSize: ComputedRef<number> = computed(() => settingsStore.settings?.pageSize);

const resetTabGroups = () => {
    pageIndex.value = 1;
    tabGroups.value = [];
    isLoading.value = false;
}

const fetchTabGroups = async () => {
    if (isLoading.value) return;

    isLoading.value = true;
    const data = await db.getAllTabGroups({
        ...searchStore.searchConditions, ...{
            pageIndex: pageIndex.value,
            pageSize: pageSize.value,
        }
    });
    tabGroups.value.push(...data.tabGroups);
    refreshStore.refreshTotal(data.groupTotal, data.tabTotal);

    await nextTick(() => {
        observeLastTabGroup();
        isLoading.value = false;
    })
}

watch([
        () => searchStore.searchConditions,
        () => refreshStore.refreshed,
        pageSize,
        () => settingsStore.settings?.useGoogleIcon,
    ],
    async () => {
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
            resetTabGroups();
            await fetchTabGroups();
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
    refreshStore.refreshTotal(refreshStore.groupTotal - 1, refreshStore.tabTotal - removedGroup.tabs_meta.length);
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
    refreshStore.refreshTotal(refreshStore.groupTotal, refreshStore.tabTotal - 1);
}

const updateGroup = async (groupIndex: number, params: {
    name?: string,
    is_starred?: boolean,
    is_locked?: boolean,
    tabs_meta?: Array<Tab>,
}) => {
    const group = tabGroups.value[groupIndex];
    Object.assign(group, {
        is_starred: params.is_starred ?? group.is_starred,
        is_locked: params.is_locked ?? group.is_locked,
        tabs_meta: params.tabs_meta ?? group.tabs_meta,
        name: params.name ?? group.name,
    });

    if (group.tabs_meta.length < 1) {
        await removeGroup(groupIndex);
        return;
    }

    await db.updateTabGroup(group);

    if (searchStore.searchConditions.starredOnly && params.is_starred === false) {
        tabGroupRefs.value.delete(group.id!);
        const unstarredGroup = tabGroups.value.splice(groupIndex, 1)[0];
        refreshStore.refreshTotal(refreshStore.groupTotal - 1, refreshStore.tabTotal - unstarredGroup.tabs_meta.length);
    }
}
</script>

<template>
    <div>
        <TabGroupComponent v-for="(tabGroup, index) in tabGroups" :tab-group="tabGroup" :key="tabGroup.id"
                           :search-text="searchStore.searchConditions.text"
                           :ref="(el: ComponentPublicInstance) => { tabGroupRefs.set(tabGroup.id!, el as ComponentPublicInstance); return tabGroup.id; }"
                           @remove-group="removeGroup(index)" @remove-tab="removeTab(index, $event)"
                           @update-group="updateGroup(index, $event)">
        </TabGroupComponent>
    </div>
    <BackToTop/>
</template>