<script setup lang="ts">
import { format } from "date-fns";
import TabIcon from "./TabIcon.vue";
import { Icon } from '@iconify/vue';

const props = defineProps(['tabGroup'])

</script>

<template>
  <div class="m-5">
    <div class="flex flex-row gap-3 align-middle">
      <span class="inline-flex items-center">Total: {{ props.tabGroup.tabs_meta.length }} tabs</span>
      <span class="inline-flex items-center">{{ format(props.tabGroup.create_time, "yyyy-MM-dd HH:mm:ss") }}</span>
    </div>
    <div v-for="tab in props.tabGroup.tabs_meta" class="flex items-center group">
      <button
        class="hidden md:flex items-center invisible group-hover:visible transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100 mr-2">
        <Icon icon="radix-icons:cross-2" class="h-4 w-4 text-grass11" />
      </button>
      <TabIcon :tab-url="tab.url"></TabIcon>
      <a :href="tab.url" target="_blank" class="text-sm text-nowrap overflow-hidden text-ellipsis">{{ tab.title }}</a>
    </div>
  </div>
</template>

<style scoped></style>