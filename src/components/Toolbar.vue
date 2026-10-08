<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRefreshStore } from '@/store/refreshStore.ts';
import { useSearchStore } from '@/store/search.ts';
import { useSettingStore } from '@/store/settings.ts';
import { Tab, useTabStore } from '@/store/tab.ts';

const { locale } = useI18n();
const searchStore = useSearchStore();
const refreshStore = useRefreshStore();
const settingsStore = useSettingStore();
const tabStore = useTabStore();

const isSearching = computed(
    () =>
        !searchStore.isEmpty({
            ignoreIsStarred: tabStore.currentTab === Tab.Starred,
            ignoreIsDeleted: tabStore.currentTab === Tab.Trash || !settingsStore.settings.trashEnabled,
        }),
);

function handleTabChange(value: string | number) {
    if (value === Tab.Starred) {
        tabStore.selectStarred();
    } else if (value === Tab.Trash) {
        tabStore.selectTrash();
    } else if (value === Tab.All) {
        tabStore.selectAll();
    }
}
</script>
<template>
    <div>
        <Tabs :model-value="tabStore.currentTab" class="mt-4 mb-1" @update:model-value="handleTabChange">
            <div class="flex px-5">
                <div class="flex-auto">
                    <h2 class="text-foreground font-semibold" :class="locale !== 'zh' ? 'text-lg leading-none' : ''">
                        {{
                            isSearching
                                ? $t('toolBar.searchTitle')
                                : tabStore.currentTab === Tab.Starred
                                  ? $t('toolBar.starredTitle')
                                  : tabStore.currentTab === Tab.Trash
                                    ? $t('toolBar.trashTitle')
                                    : $t('toolBar.allTabsTitle')
                        }}
                    </h2>
                    <div class="text-muted-foreground space-x-2 text-sm">
                        <span>{{ $t('toolBar.groupNum', { groupNum: refreshStore.groupTotal }) }}</span>
                        <span>{{ $t('toolBar.tabNum', { tabNum: refreshStore.tabTotal }) }}</span>
                    </div>
                </div>
                <TabsList>
                    <TabsTrigger :value="Tab.All" class="px-3">
                        {{ $t('toolBar.allTabsTab') }}
                    </TabsTrigger>
                    <TabsTrigger :value="Tab.Starred" class="px-3">
                        {{ $t('toolBar.starredTab') }}
                    </TabsTrigger>
                    <TabsTrigger v-if="settingsStore.settings.trashEnabled" :value="Tab.Trash" class="px-3">
                        {{ $t('toolBar.trashTab') }}
                    </TabsTrigger>
                </TabsList>
            </div>
        </Tabs>
    </div>
</template>
