<script setup lang="ts">
import { onMounted, watch } from 'vue';

import Navbar from '@/components/Navbar.vue';
import { Sidebar } from '@/components/sidebar';
import TabGroupList from '@/components/TabGroupList.vue';
import Toolbar from '@/components/Toolbar.vue';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useSettingStore } from '@/store/settings.ts';
import { Tab, useTabStore } from '@/store/tab.ts';

const settingsStore = useSettingStore();
const tabStore = useTabStore();

watch(
    () => settingsStore.settings.trashEnabled,
    (enabled) => {
        if (!enabled && tabStore.currentTab === Tab.Trash) {
            tabStore.selectAll();
        }
    },
);

const pinTab = (tab: Browser.tabs.Tab) => {
    browser.tabs.update(tab.id!, { active: true, pinned: true });
    browser.tabs.move(tab.id!, { index: 0 });
    browser.windows.update(tab.windowId, { focused: true });
};

onMounted(() => {
    const extensionURL = browser.runtime.getURL('/tabclip.html');
    browser.tabs.getCurrent((currentTab) => {
        browser.tabs.query({}, (tabs) => {
            if (currentTab) {
                const extensionTab = tabs.find((tab) => tab.url?.includes(extensionURL) && tab.id !== currentTab?.id);
                if (extensionTab) {
                    pinTab(extensionTab);
                    browser.tabs.remove(currentTab.id!);
                } else {
                    pinTab(currentTab);
                }
            }
        });
    });
});
</script>

<template>
    <SidebarProvider>
        <Sidebar />
        <SidebarInset class="min-w-0">
            <Navbar></Navbar>
            <Toolbar></Toolbar>
            <TabGroupList></TabGroupList>
            <Toaster rich-colors />
        </SidebarInset>
    </SidebarProvider>
</template>

<style scoped>
.flex > * {
    min-width: 0;
}
</style>
