<script setup lang="ts">
import { ref, watch } from 'vue';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchStore } from '@/store/search';
import {useRefreshStore} from "@/store/refreshStore.ts";

enum StarStatus {
    All,
    StarredOnly,
}

const starStatus = ref(StarStatus.All);
const searchStore = useSearchStore();
const refreshStore = useRefreshStore();

watch(starStatus, () => {
    searchStore.updateSearchConditions({ starredOnly: starStatus.value === StarStatus.StarredOnly })
})
</script>
<template>
    <div>
        <Tabs :default-value="StarStatus.All" v-model:model-value="starStatus">
            <div class="flex items-center px-4 py-2">
                <div class="flex-auto">
                    <h3 class="font-semibold leading-none tracking-tight">{{ !searchStore.isEmpty() ? 'Search' :
                        starStatus === StarStatus.All ? 'All tabs' : 'Starred' }}</h3>
                    <div class="space-x-2">
                        <span>{{ refreshStore.groupTotal }} groups</span>
                        <span>{{ refreshStore.tabTotal }} tabs</span>
                    </div>
                </div>
                <TabsList>
                    <TabsTrigger :value="StarStatus.All">
                        All tabs
                    </TabsTrigger>
                    <TabsTrigger :value="StarStatus.StarredOnly">
                        Starred
                    </TabsTrigger>
                </TabsList>
            </div>
        </Tabs>
    </div>
</template>