<script setup lang="ts">
import {ref} from "vue";

interface Tab {
  id: number
  title: string
  url: string
}

const getTabs = async (): Promise<void> => {
  try {
    const allTabs = await chrome.tabs.query({pinned: false});
    const currentTab = await chrome.tabs.getCurrent();
    const filteredTabs = allTabs.filter(tab => tab.id !== currentTab?.id);
    tabs.value = filteredTabs.map(tab => ({
      id: tab.id!,
      title: tab.title || '未命名标签页',
      url: tab.url || '#'
    }));
  } catch (error) {
    console.error('获取标签页失败:', error);
  }
}

const tabs = ref<Tab[]>([])
</script>

<template>
  <div>
    <h2>标签管理 🏷️</h2>
    <button v-on:click="getTabs">获取标签</button>
    <div>
      <div v-for="tab in tabs" :key="tab.id">
        <div class="flex">
          <span>icon</span>
          <a :href="tab.url" target="_blank" :title="tab.url">{{ tab.title }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>