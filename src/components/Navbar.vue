<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    DotsVerticalIcon,
    ExclamationTriangleIcon,
    GearIcon,
    GithubLogoIcon,
    MoonIcon,
    SunIcon,
    UploadIcon,
} from '@radix-icons/vue';
import { useColorMode } from '@vueuse/core';
import { BookIcon, ChartColumnIcon, InfoIcon, TrashIcon } from 'lucide-vue-next';

import AboutDialog from './AboutDialog.vue';
import EmptyTrashDialog from '@/components/EmptyTrashDialog.vue';
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
import { useSearchStore } from '@/store/search.ts';
import { useSettingStore } from '@/store/settings.ts';

const { locale } = useI18n();
const mode = useColorMode();
const searchStore = useSearchStore();
const settingsStore = useSettingStore();

const headerRef = ref<HTMLElement | null>(null);
const headerWidth = ref(0);
// 顶栏宽度。搜索先变窄，再直接隐藏；到这些宽度再把下一组按钮收进「更多」。
const secondaryMinWidth = 780;
const utilitiesMinWidth = 640;
const searchFieldMinWidth = 480;

const measured = computed(() => headerWidth.value > 0);
const showSecondary = computed(() => !measured.value || headerWidth.value >= secondaryMinWidth);
const showUtilities = computed(() => !measured.value || headerWidth.value >= utilitiesMinWidth);
const showSearchField = computed(() => !measured.value || headerWidth.value >= searchFieldMinWidth);

watch(showSearchField, (visible) => {
    if (!visible) {
        searchStore.resetSearchConditions();
    }
});

const heatmapRef = ref<{ show: () => void } | null>(null);
const settingsRef = ref<{ show: () => void } | null>(null);

let headerObserver: ResizeObserver | null = null;

function toggleColorMode() {
    mode.value = mode.value === 'light' ? 'dark' : 'light';
}

const { isExporting, exportProgress, exportLargeJsonFile } = useExport();
const { isImporting, importProgress, importData, isImportDialogOpened } = useImport();

const isTruncateDialogOpened = ref(false);
const isEmptyTrashDialogOpened = ref(false);
const isAboutDialogOpened = ref(false);
const redirectToGithub = () => {
    window.open('https://github.com/Heaciy/TabClip', '_blank');
};

const redirectToWebsite = () => {
    const lang = locale.value === 'zh' ? '' : '/en';
    window.open(`https://tabclip.heaciy.com${lang}/settings/`, '_blank');
};

onMounted(async () => {
    if (headerRef.value) {
        headerWidth.value = headerRef.value.clientWidth;
        headerObserver = new ResizeObserver(() => {
            headerWidth.value = headerRef.value?.clientWidth ?? 0;
        });
        headerObserver.observe(headerRef.value);
    }

    const { showAboutDialog } = await browser.storage.local.get('showAboutDialog');

    if (showAboutDialog) {
        isAboutDialogOpened.value = true;
        await browser.storage.local.set({ showAboutDialog: false });
    }
});

onUnmounted(() => {
    headerObserver?.disconnect();
});
</script>

<template>
    <header ref="headerRef" class="border-border border-b px-4 py-2">
        <div class="flex min-w-0 items-center">
            <!--left-->
            <div class="flex min-w-0 flex-1 items-center space-x-4">
                <Logo class="h-11 shrink-0 -translate-y-0.5 fill-[#1e1e1e] dark:fill-[#f3f3f3]"></Logo>
                <Search v-if="showSearchField" class="shrink"></Search>
                <Separator orientation="vertical" class="mr-1.5 shrink-0 data-[orientation=vertical]:h-6" />
                <SidebarTrigger class="shrink-0"></SidebarTrigger>
            </div>
            <!--right-->
            <div class="flex shrink-0 items-center space-x-1">
                <div v-if="showSecondary" class="flex">
                    <I18n></I18n>
                </div>
                <div v-show="showSecondary" class="flex">
                    <Button variant="ghost" size="icon" @click="toggleColorMode">
                        <MoonIcon v-if="mode === 'light'" />
                        <SunIcon v-if="mode === 'dark'" />
                    </Button>
                </div>
                <div v-show="showUtilities" class="flex">
                    <Heatmap ref="heatmapRef"></Heatmap>
                </div>
                <div v-show="showUtilities" class="flex">
                    <SettingSheet ref="settingsRef"></SettingSheet>
                </div>
                <div v-show="showSecondary" class="flex">
                    <Button variant="ghost" size="icon" @click="redirectToGithub">
                        <GithubLogoIcon />
                    </Button>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon">
                            <DotsVerticalIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="w-56" align="end">
                        <template v-if="!showSecondary || !showUtilities">
                            <I18n v-if="!showSecondary" variant="sub"></I18n>
                            <DropdownMenuItem v-if="!showSecondary" @click="toggleColorMode">
                                <span class="mr-auto">{{ $t('navbar.theme') }}</span>
                                <MoonIcon v-if="mode === 'light'" />
                                <SunIcon v-else />
                            </DropdownMenuItem>
                            <DropdownMenuItem v-if="!showUtilities" @click="heatmapRef?.show()">
                                <span class="mr-auto">{{ $t('heatmap.title') }}</span>
                                <ChartColumnIcon />
                            </DropdownMenuItem>
                            <DropdownMenuItem v-if="!showUtilities" @click="settingsRef?.show()">
                                <span class="mr-auto">{{ $t('settings.sheetTile') }}</span>
                                <GearIcon />
                            </DropdownMenuItem>
                            <DropdownMenuItem v-if="!showSecondary" @click="redirectToGithub">
                                <span class="mr-auto">GitHub</span>
                                <GithubLogoIcon />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </template>
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
                                    <span>{{ $t('moreOperations.dataOperations.importData') }}</span>
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
                            <DropdownMenuItem
                                v-if="settingsStore.settings.trashEnabled"
                                variant="destructive"
                                @click="isEmptyTrashDialogOpened = true"
                            >
                                <span class="mr-auto">{{ $t('moreOperations.dangerOperations.emptyTrash') }}</span>
                                <TrashIcon />
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" @click="isTruncateDialogOpened = true">
                                <span class="mr-auto">{{ $t('moreOperations.dangerOperations.truncateData') }}</span>
                                <ExclamationTriangleIcon />
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{{ $t('moreOperations.moreInfo.label') }}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem @click="redirectToWebsite">
                                <span class="mr-auto">{{ $t('moreOperations.moreInfo.userGuide') }}</span>
                                <BookIcon />
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="isAboutDialogOpened = true">
                                <span class="mr-auto">{{ $t('moreOperations.moreInfo.about') }}</span>
                                <InfoIcon />
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <EmptyTrashDialog v-model="isEmptyTrashDialogOpened"></EmptyTrashDialog>
        <TruncateDialog v-model="isTruncateDialogOpened"></TruncateDialog>
        <ImportDialog
            v-model="isImportDialogOpened"
            :is-importing="isImporting"
            :progress="importProgress"
            :import-data="importData"
        >
        </ImportDialog>
        <AboutDialog v-model="isAboutDialogOpened"></AboutDialog>
    </header>
</template>

<style scoped></style>
