<script setup lang="ts">
import {ref} from "vue";
import {useColorMode} from '@vueuse/core'
import {Icon} from "@iconify/vue";
import {Button} from "@/components/ui/button";
import SettingSheet from "@/components/SettingsSheet.vue";
import Search from "@/components/Search.vue";
import ExportUtil from "@/components/ExportUtil.vue";
import {
    DropdownMenu,
    DropdownMenuGroup,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import TruncateDialog from "@/components/TruncateDialog.vue";
import ImportDialog from "@/components/ImportDialog.vue";
import Logo from "@/components/Logo.vue";


const mode = useColorMode();

const isTruncateDialogOpened = ref(false);
const isImportDialogOpened = ref(false);
const redirectToGithub = () => {
    window.open('https://github.com/Heaciy/TabClip', '_blank');
};
</script>

<template>
    <header class="flex py-2 px-2 md:px-4 border-b border-border">
        <!--left-->
        <div class="flex flex-1 items-center space-x-4">
            <Logo class="h-11 fill-[#1e1e1e] dark:fill-[#f3f3f3] -translate-y-0.5"></Logo>
            <Search></Search>
        </div>
        <!--right-->
        <div class="flex items-center space-x-0.5">
            <Button variant="ghost" size="icon" @click="mode === 'light' ? mode = 'dark' : mode = 'light'">
                <Icon :icon="`radix-icons:${mode === 'light' ? 'moon' : 'sun'}`" :class="'size-4'"></Icon>
            </Button>
            <SettingSheet></SettingSheet>
            <Button variant="ghost" size="icon" @click="redirectToGithub">
                <Icon icon="radix-icons:github-logo"></Icon>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon">
                        <Icon icon="radix-icons:dots-vertical" class="size-4"></Icon>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-48" align="end">
                    <DropdownMenuLabel>Data Operations</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuGroup>
                        <ExportUtil></ExportUtil>
                        <DropdownMenuItem @click="isImportDialogOpened=true">
                            <span class="mr-auto">Import Data</span>
                            <Icon icon="radix-icons:upload"></Icon>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator/>
                    <DropdownMenuLabel>Danger Operations</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuGroup>
                        <DropdownMenuItem variant="destructive" @click="isTruncateDialogOpened=true">
                            <span class="mr-auto">Delete Groups</span>
                            <Icon icon="radix-icons:exclamation-triangle"></Icon>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <TruncateDialog v-model="isTruncateDialogOpened"></TruncateDialog>
        <ImportDialog v-model="isImportDialogOpened"></ImportDialog>
    </header>
</template>

<style scoped>

</style>