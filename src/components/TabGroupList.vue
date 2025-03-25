<script setup lang="ts">
import {ref, type Ref} from "vue";

import type {TabGroup} from "@/database.ts";
import TabGroupComponent from './TabGroup.vue';

const tabGroups: Ref<TabGroup[]> = ref([]);
tabGroups.value = [
  {
    id: crypto.randomUUID(),
    tabs_meta: [
      {title: "GitHub", url: "https://github.com"},
      {title: "Vue.js", url: "https://vuejs.org"}
    ],
    is_starred: true,
    is_locked: false,
    create_time: new Date(),
    update_time: new Date(),
  },
  {
    id: crypto.randomUUID(),
    tabs_meta: [
      {title: "MDN", url: "https://developer.mozilla.org"},
      {title: "Dexie.js", url: "https://dexie.org"}
    ],
    is_starred: false,
    is_locked: true,
    create_time: new Date(),
    update_time: new Date(),
  }
]
</script>

<template>
  <div>
    <TabGroupComponent v-for="tabGroup in tabGroups" :tab-group="tabGroup"></TabGroupComponent>
  </div>
</template>

<style scoped>

</style>