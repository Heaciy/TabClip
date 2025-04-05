<script setup lang="ts">
import {useColorMode} from '@vueuse/core'
import {Icon} from "@iconify/vue";
import {Button} from "@/components/ui/button";
import {Input} from '@/components/ui/input';
import SettingSheet from "@/components/SettingsSheet.vue";

const mode = useColorMode();
</script>

<template>
    <header class="flex py-2 px-2 md:px-4 border-b border-border">
        <!--left-->
        <div class="flex flex-1 items-center space-x-4">
            <img :src="mode==='light'? '/logo.png' : '/logo-black.png'" alt="TabClip" class="h-11">
            <Input type="text" placeholder="Search" class="w-80"></Input>
            <Button>Search</Button>
        </div>
        <!--right-->
        <div class="flex items-center space-x-0.5">
            <Button variant="ghost" size="icon" @click="mode === 'light' ? mode = 'dark' : mode = 'light'">
                <Icon :icon="`radix-icons:${mode === 'light' ? 'moon' : 'sun'}`" :class="'size-4'"></Icon>
            </Button>
            <SettingSheet></SettingSheet>
        </div>
    </header>
</template>

<style scoped>

</style>