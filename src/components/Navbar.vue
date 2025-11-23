<script setup lang="ts">
import { ref } from 'vue';
import {
    DotsVerticalIcon,
    ExclamationTriangleIcon,
    GithubLogoIcon,
    MoonIcon,
    SunIcon,
    UploadIcon,
} from '@radix-icons/vue';
import { useColorMode } from '@vueuse/core';

import ExportUtil from '@/components/ExportUtil.vue';
import Heatmap from '@/components/Heatmap.vue';
import I18n from '@/components/I18n.vue';
import ImportDialog from '@/components/ImportDialog.vue';
import Logo from '@/components/Logo.vue';
import Search from '@/components/Search.vue';
import SettingSheet from '@/components/SettingsSheet.vue';
import TruncateDialog from '@/components/TruncateDialog.vue';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useExport } from '@/composables/useExport';
import { useImport } from '@/composables/useImport';

const mode = useColorMode();

const { isExporting, exportProgress, exportLargeJsonFile } = useExport();
const { isImporting, importProgress, importData, isImportDialogOpened } = useImport();

const isTruncateDialogOpened = ref(false);
const redirectToGithub = () => {
    window.open('https://github.com/Heaciy/TabClip', '_blank');
};
</script>

<template>
    <header class="border-border flex border-b px-2 py-2 md:px-4">
        <!--left-->
        <div class="flex flex-1 items-center space-x-4">
            <Logo class="h-11 shrink-0 -translate-y-0.5 fill-[#1e1e1e] dark:fill-[#f3f3f3]"></Logo>
            <Search></Search>
            <Separator orientation="vertical" class="mr-1.5 data-[orientation=vertical]:h-6" />
            <SidebarTrigger></SidebarTrigger>
        </div>
        <!--right-->
        <div class="flex items-center space-x-1">
            <I18n></I18n>
            <Button variant="ghost" size="icon" @click="mode === 'light' ? (mode = 'dark') : (mode = 'light')">
                <MoonIcon v-if="mode === 'light'" />
                <SunIcon v-if="mode === 'dark'" />
            </Button>
            <Heatmap></Heatmap>
            <SettingSheet></SettingSheet>
            <Button variant="ghost" size="icon" @click="redirectToGithub">
                <GithubLogoIcon />
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon">
                        <DotsVerticalIcon />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-48" align="end">
                    <DropdownMenuLabel>{{ $t('moreOperations.dataOperations.label') }}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <ExportUtil
                            :is-exporting="isExporting"
                            :progress="exportProgress"
                            @export-large-json-file="exportLargeJsonFile"
                        ></ExportUtil>
                        <DropdownMenuItem :disabled="isImporting" @click="isImportDialogOpened = true">
                            <div class="mr-auto flex items-center gap-2">
                                <span>{{ $t('moreOperations.dataOperations.importGroups') }}</span>
                                <span v-if="isImporting" class="text-muted-foreground text-sm">
                                    {{ importProgress.toFixed(0) }}%
                                </span>
                            </div>
                            <UploadIcon />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>{{ $t('moreOperations.dangerOperations.label') }}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem variant="destructive" @click="isTruncateDialogOpened = true">
                            <span class="mr-auto">{{ $t('moreOperations.dangerOperations.truncateData') }}</span>
                            <ExclamationTriangleIcon />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <TruncateDialog v-model="isTruncateDialogOpened"></TruncateDialog>
        <ImportDialog
            v-model="isImportDialogOpened"
            :is-importing="isImporting"
            :progress="importProgress"
            :import-data="importData"
        >
        </ImportDialog>
    </header>
</template>

<style scoped></style>
