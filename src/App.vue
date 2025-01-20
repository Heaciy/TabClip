<script setup lang="ts">
// import TabGroup from '@/components/TabGroup.vue';
import TabQuery from "@/components/TabQuery.vue";
import {onMounted} from "vue";

const pinTab = (tab: chrome.tabs.Tab) => {
  chrome.tabs.update(tab.id!, {active: true, pinned: true});
  chrome.tabs.move(tab.id!, {index: 0});
  chrome.windows.update(tab.windowId, {focused: true});
}

onMounted(() => {
  const extensionId = chrome.runtime.id;
  chrome.tabs.getCurrent(currentTab => {
    chrome.tabs.query({}, (tabs) => {
      if (currentTab) {
        const extensionTab = tabs.find(tab => tab.url?.includes(extensionId) && tab.id !== currentTab?.id);
        if (extensionTab) {
          pinTab(extensionTab);
          chrome.tabs.remove(currentTab.id!);
        } else {
          pinTab(currentTab);
        }
      }
    })
  })

})
</script>

<template>
  <!--  <TabGroup></TabGroup>-->
  <TabQuery></TabQuery>
</template>

<style scoped>
</style>
