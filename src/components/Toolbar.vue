<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRefreshStore } from '@/store/refreshStore.ts';
import { useSearchStore } from '@/store/search';

enum StarStatus {
    // eslint-disable-next-line no-unused-vars
    All,
    // eslint-disable-next-line no-unused-vars
    StarredOnly,
}

const { locale } = useI18n();
const starStatus = ref(StarStatus.All);
const searchStore = useSearchStore();
const refreshStore = useRefreshStore();

const isPassivelyRefreshing = ref(false);

watch(starStatus, () => {
    if (!isPassivelyRefreshing.value) {
        searchStore.updateSearchConditions({ starredOnly: starStatus.value === StarStatus.StarredOnly });
    }
    isPassivelyRefreshing.value = false;
});

watch(
    () => searchStore.passivelyRefreshed,
    () => {
        const newStatus = searchStore.searchConditions.starredOnly ? StarStatus.StarredOnly : StarStatus.All;
        if (newStatus !== starStatus.value) {
            isPassivelyRefreshing.value = true;
            starStatus.value = newStatus;
        }
    },
);
</script>
<template>
    <div>
        <Tabs v-model:model-value="starStatus" :default-value="StarStatus.All" class="mt-4 mb-1">
            <div class="flex px-5">
                <div class="flex-auto">
                    <h2 class="text-foreground font-semibold" :class="locale !== 'zh' ? 'text-lg leading-none' : ''">
                        {{
                            !searchStore.isEmpty()
                                ? $t('toolBar.searchTitle')
                                : starStatus === StarStatus.All
                                  ? $t('toolBar.allTabsTitle')
                                  : $t('toolBar.starredTitle')
                        }}
                    </h2>
                    <div class="text-muted-foreground gap-2 space-x-3 text-sm">
                        <span>{{ $t('toolBar.groupNum', { groupNum: refreshStore.groupTotal }) }}</span>
                        <span>{{ $t('toolBar.tabNum', { tabNum: refreshStore.tabTotal }) }}</span>
                    </div>
                </div>
                <TabsList>
                    <TabsTrigger :value="StarStatus.All" class="px-3">
                        {{ $t('toolBar.allTabsTab') }}
                    </TabsTrigger>
                    <TabsTrigger :value="StarStatus.StarredOnly" class="px-3">
                        {{ $t('toolBar.starredTab') }}
                    </TabsTrigger>
                </TabsList>
            </div>
        </Tabs>
    </div>
</template>
