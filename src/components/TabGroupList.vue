<script setup lang="ts">
import {
    type ComponentPublicInstance,
    computed,
    type ComputedRef,
    nextTick,
    onMounted,
    onUnmounted,
    type Ref,
    ref,
    watch,
} from 'vue';

import BackToTop from './BackToTop.vue';
import EditCategoryDialog from './sidebar/EditCategoryDialog.vue';
import TabGroupComponent from './TabGroup.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import type { Tab, TabGroup } from '@/database.ts';
import { db } from '@/database.ts';
import { useRefreshStore } from '@/store/refreshStore.ts';
import { useSearchStore } from '@/store/search.ts';
import { useSettingStore } from '@/store/settings.ts';

const tabGroups: Ref<TabGroup[]> = ref([]);
const tabGroupRefs = ref(new Map<string, ComponentPublicInstance>());

const hasMore = ref(true);
const isLoading = ref(false);
const searchStore = useSearchStore();
const settingsStore = useSettingStore();
const refreshStore = useRefreshStore();

const pageIndex = ref(1);
const pageSize: ComputedRef<number> = computed(() => settingsStore.settings?.pageSize);

let abortController: AbortController | null = null;

const resetTabGroups = () => {
    observer.disconnect();
    abortController?.abort();
    pageIndex.value = 1;
    tabGroups.value = [];
    isLoading.value = false;
    hasMore.value = true;
};

const fetchTabGroups = async () => {
    if (isLoading.value || !hasMore.value) return;

    abortController?.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    isLoading.value = true;
    const data = await db.getAllTabGroups({
        ...searchStore.searchConditions,
        ...{
            pageIndex: pageIndex.value,
            pageSize: pageSize.value,
        },
    });

    if (signal.aborted) return;

    tabGroups.value.push(...data.tabGroups);
    refreshStore.refreshTotal(data.groupTotal, data.tabTotal);

    if (data.tabGroups.length < pageSize.value) {
        hasMore.value = false;
    }

    await nextTick(() => {
        if (!signal.aborted) {
            if (hasMore.value) observeLastTabGroup();
            isLoading.value = false;
            abortController = null;
        }
    });
};

watch(
    [
        () => searchStore.searchConditions,
        () => refreshStore.refreshed,
        pageSize,
        () => settingsStore.settings?.useGoogleIcon,
    ],
    async () => {
        resetTabGroups();
        await fetchTabGroups();
    },
);

watch(pageIndex, async () => {
    await fetchTabGroups();
});

onMounted(async () => {
    await fetchTabGroups();
    browser.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
        if (message.event === 'TabGroupUpdate') {
            resetTabGroups();
            await fetchTabGroups();
        }
    });
});

onUnmounted(() => {
    observer.disconnect();
});

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !isLoading.value) {
                const lastTabGroup = tabGroups.value[tabGroups.value.length - 1];
                if (entry.target === tabGroupRefs.value.get(lastTabGroup.id!)?.$el) {
                    pageIndex.value++;
                }
            }
        });
    },
    {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
    },
);

function observeLastTabGroup() {
    if (tabGroups.value.length && hasMore.value) {
        const lastTabGroup = tabGroups.value[tabGroups.value.length - 1];
        const lastTabGroupEl = tabGroupRefs.value.get(lastTabGroup.id!)?.$el;
        if (lastTabGroupEl instanceof HTMLElement) {
            observer.observe(lastTabGroupEl);
        }
    }
}

const removeGroup = async (groupIndex: number, removeFromDB: boolean = true) => {
    if (removeFromDB && tabGroups.value[groupIndex].is_locked) {
        return;
    }

    const removedGroup = tabGroups.value.splice(groupIndex, 1)[0];
    tabGroupRefs.value.delete(removedGroup.id!);

    if (removeFromDB) {
        await db.deleteTabGroup(removedGroup.id!);
    }

    refreshStore.refreshTotal(refreshStore.groupTotal - 1, refreshStore.tabTotal - removedGroup.tabs_meta.length);
};

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
};

const updateGroup = async (
    groupIndex: number,
    params: {
        name?: string;
        is_starred?: boolean;
        is_locked?: boolean;
        tabs_meta?: Array<Tab>;
        category_id?: string | null;
    },
) => {
    const group = tabGroups.value[groupIndex];
    const updates = Object.fromEntries(Object.entries(params).filter(([_, value]) => value !== undefined));
    Object.assign(group, updates);

    if (group.tabs_meta.length < 1) {
        await removeGroup(groupIndex);
        return;
    }

    await db.updateTabGroup(group);

    // Unstar the group or clear its category, then remove it from the current list
    const { starredOnly, categoryId, text } = searchStore.searchConditions;
    const loweredText = text?.toLowerCase();

    const isStarredMismatch = starredOnly && params.is_starred === false;
    const isCategoryMismatch = categoryId && 'category_id' in updates && updates.category_id !== categoryId;
    const isTextMismatch =
        loweredText &&
        'name' in updates &&
        !(
            group.name?.toLowerCase().includes(loweredText) ||
            group.tabs_meta?.some(
                (tab) => tab.title?.toLowerCase().includes(loweredText) || tab.url?.toLowerCase().includes(loweredText),
            )
        );
    if (isStarredMismatch || isCategoryMismatch || isTextMismatch) {
        await removeGroup(groupIndex, false);
    }
};
</script>

<template>
    <div>
        <TabGroupComponent
            v-for="(tabGroup, index) in tabGroups"
            :key="tabGroup.id"
            :ref="
                (el) => {
                    if (el) {
                        tabGroupRefs.set(tabGroup.id!, el as ComponentPublicInstance);
                    } else {
                        tabGroupRefs.delete(tabGroup.id!);
                    }
                }
            "
            :tab-group="tabGroup"
            :search-text="searchStore.searchConditions.text"
            @remove-group="removeGroup(index)"
            @remove-tab="removeTab(index, $event)"
            @update-group="updateGroup(index, $event)"
        >
        </TabGroupComponent>

        <EditCategoryDialog />
        <ConfirmDialog />
    </div>
    <BackToTop />
</template>
