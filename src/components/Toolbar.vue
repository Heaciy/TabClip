<script setup lang="ts">
import {ref, watch} from 'vue';
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useSearchStore} from '@/store/search';
import {useRefreshStore} from "@/store/refreshStore.ts";

enum StarStatus {
    All,
    StarredOnly,
}

const starStatus = ref(StarStatus.All);
const searchStore = useSearchStore();
const refreshStore = useRefreshStore();

watch(starStatus, () => {
    searchStore.updateSearchConditions({starredOnly: starStatus.value === StarStatus.StarredOnly})
})
</script>
<template>
    <div>
        <Tabs :default-value="StarStatus.All" v-model:model-value="starStatus">
            <div class="flex items-center px-4 py-2">
                <div class="flex-auto">
                    <h3 class="font-semibold leading-none tracking-tight">{{
                            !searchStore.isEmpty() ? $t('toolBar.searchTitle') :
                                starStatus === StarStatus.All ? $t('toolBar.allTabsTitle') : $t('toolBar.starredTitle')
                        }}</h3>
                    <div class="space-x-2">
                        <span>{{ $t('toolBar.groupNum', {groupNum: refreshStore.groupTotal}) }}</span>
                        <span>{{ $t('toolBar.tabNum', {tabNum: refreshStore.tabTotal}) }}</span>
                    </div>
                </div>
                <TabsList>
                    <TabsTrigger :value="StarStatus.All">
                        {{ $t('toolBar.allTabsTab') }}
                    </TabsTrigger>
                    <TabsTrigger :value="StarStatus.StarredOnly">
                        {{ $t('toolBar.starredTab') }}
                    </TabsTrigger>
                </TabsList>
            </div>
        </Tabs>
    </div>
</template>