<script setup lang="ts">
import { onMounted, ref, type Ref } from "vue";
import { db } from "@/database.ts";

import type { TabGroup } from "@/database.ts";
import TabGroupComponent from './TabGroup.vue';

const tabGroups: Ref<TabGroup[]> = ref([]);

onMounted(async () => {
  const allTabGroups = await db.getAllTabGroups();
  console.log(allTabGroups);
  tabGroups.value = allTabGroups;
});
</script>

<template>
  <div>
    <TabGroupComponent v-for="tabGroup in tabGroups" :tab-group="tabGroup"></TabGroupComponent>
  </div>
</template>