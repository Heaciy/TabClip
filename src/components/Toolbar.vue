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
        <Tabs :default-value="StarStatus.All" v-model:model-value="starStatus" class='my-4'>
            <div class="flex pl-6 pr-4">
                <div class="flex-auto">
                    <h2 class="text-foreground font-semibold">
                        {{
                            !searchStore.isEmpty() ? $t('toolBar.searchTitle') :
                                starStatus === StarStatus.All ? $t('toolBar.allTabsTitle') : $t('toolBar.starredTitle')
                        }}
                    </h2>
                    <div class="space-x-3 text-muted-foreground text-sm">
                        <span>{{ $t('toolBar.groupNum', {groupNum: refreshStore.groupTotal}) }}</span>
                        <span>{{ $t('toolBar.tabNum', {tabNum: refreshStore.tabTotal}) }}</span>
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