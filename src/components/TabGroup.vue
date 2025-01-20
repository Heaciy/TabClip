<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Tab {
    id: number
    title: string
    url: string
}

const tabs = ref<Tab[]>([])

const getTabs = async (): Promise<void> => {
    try {
        const allTabs = await chrome.tabs.query({ pinned: false })
        tabs.value = allTabs.map(tab => ({
            id: tab.id!,
            title: tab.title || '未命名标签页',
            url: tab.url || '#'
        }))

        const currentTab = await chrome.tabs.getCurrent()

        allTabs.forEach(tab => {
            if (tab.id !== currentTab?.id) {
                chrome.tabs.remove(tab.id!)
            }
        })
    } catch (error) {
        console.error('获取标签页失败:', error)
    }
}

onMounted(() => {
    getTabs()
})
</script>

<template>
    <div class="tab-manager">
      <h2 class="tab-manager__title">标签页管理器</h2>
      <div class="tab-manager__list">
        <div v-for="tab in tabs" :key="tab.id" class="tab-item">
          <div class="tab-item__content">
            <span class="tab-item__title">{{ tab.title }}</span>
            <a :href="tab.url" 
               target="_blank" 
               class="tab-item__link"
               :title="tab.url">
              {{ tab.url }}
            </a>
          </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
.tab-manager {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.tab-manager__title {
    font-size: 24px;
    color: #333;
    margin-bottom: 20px;
}

.tab-manager__list {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.tab-item {
    padding: 16px;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
}

.tab-item:last-child {
    border-bottom: none;
}

.tab-item:hover {
    background-color: #f9f9f9;
}

.tab-item__content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tab-item__title {
    font-weight: 600;
    color: #333;
}

.tab-item__link {
    color: #666;
    text-decoration: none;
    word-break: break-all;
    font-size: 0.9em;
}

.tab-item__link:hover {
    color: #1a73e8;
    text-decoration: underline;
}
</style>