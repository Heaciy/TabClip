<script setup lang="ts">
const props = defineProps(['tabGroup'])
</script>

<template>
  <div class="m-5">
    <div class="flex">
      <div class="flex-col">
        <span>Total: {{ props.tabGroup.tabs_meta.length }} tabs</span>
        <span class="text-sm">{{ props.tabGroup.create_time }}</span>
      </div>
    </div>
    <div v-for="tab in props.tabGroup.tabs_meta" class="flex items-center">
      <a :href="tab.url" target="_blank" class="text-sm text-nowrap overflow-hidden text-ellipsis">{{ tab.title }}</a>
    </div>
  </div>
</template>

<style scoped>

</style>