<script setup lang="ts">
import { onMounted } from 'vue';

import Navbar from '@/components/Navbar.vue';
import TabGroupList from '@/components/TabGroupList.vue';
import Toolbar from '@/components/Toolbar.vue';
import { Toaster } from '@/components/ui/sonner';

const pinTab = (tab: chrome.tabs.Tab) => {
    chrome.tabs.update(tab.id!, { active: true, pinned: true });
    chrome.tabs.move(tab.id!, { index: 0 });
    chrome.windows.update(tab.windowId, { focused: true });
};

onMounted(() => {
    const extensionURL = chrome.runtime.getURL('tabclip.html');
    chrome.tabs.getCurrent((currentTab) => {
        chrome.tabs.query({}, (tabs) => {
            if (currentTab) {
                const extensionTab = tabs.find((tab) => tab.url?.includes(extensionURL) && tab.id !== currentTab?.id);
                if (extensionTab) {
                    pinTab(extensionTab);
                    chrome.tabs.remove(currentTab.id!);
                } else {
                    pinTab(currentTab);
                }
            }
        });
    });
});
</script>

<template>
    <Navbar></Navbar>
    <Toolbar></Toolbar>
    <TabGroupList></TabGroupList>
    <Toaster rich-colors />
</template>

<style scoped></style>
