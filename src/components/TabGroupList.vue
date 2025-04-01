<script setup lang="ts">
import {type ComponentPublicInstance, onMounted, ref, type Ref} from "vue";
import type {TabGroup} from "@/database.ts";
import {db} from "@/database.ts";
import TabGroupComponent from './TabGroup.vue';

const tabGroups: Ref<TabGroup[]> = ref([]);
const tabGroupRefs = ref(new Map<string, ComponentPublicInstance>());

const removeGroup = async (groupIndex: number) => {
    if (tabGroups.value[groupIndex].is_locked) {
        return;
    }
    const removedGroup = tabGroups.value.splice(groupIndex, 1)[0];
    tabGroupRefs.value.delete(removedGroup.id!);
    await db.deleteTabGroup(removedGroup.id!)

}

const removeTab = async (groupIndex: number, tabIndex: number) => {
    const group: TabGroup = tabGroups.value[groupIndex];
    if (group.is_locked) {
        return;
    }
    group.tabs_meta.splice(tabIndex, 1);
    if (group.tabs_meta.length < 1) {
        await removeGroup(groupIndex);
    } else {
        await db.updateTabGroup(group);
    }
}


onMounted(async () => {
    tabGroups.value = await db.getAllTabGroups();
    chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
        if (message.event === "TabGroupUpdate") {
            tabGroups.value = await db.getAllTabGroups();
        }
    });
});
</script>

<template>
    <div>
        <TabGroupComponent
            v-for="(tabGroup, index) in tabGroups" :tab-group="tabGroup" :key="tabGroup.id"
            :ref="(el: ComponentPublicInstance) => { tabGroupRefs.set(tabGroup.id!, el as ComponentPublicInstance); return tabGroup.id; }"
            @remove-group="removeGroup(index)"
            @remove-tab="removeTab(index, $event)">
        </TabGroupComponent>
    </div>
</template>