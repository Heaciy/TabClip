import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { v5 as uuidv5 } from 'uuid';

import { db, type Tab, type TabGroup } from '@/database.ts';
import { i18n } from '@/locales';
import { useCategoryStore } from '@/store/category';
import { useRefreshStore } from '@/store/refreshStore';
import { useSettingStore } from '@/store/settings.ts';

export function useImport() {
    const isImporting = ref<boolean>(false);
    const importProgress = ref<number>(0);
    const isImportDialogOpened = ref<boolean>(false);

    const refreshStore = useRefreshStore();
    const settingsStore = useSettingStore();
    const categoryStore = useCategoryStore();
    const t = i18n.global.t;

    function formatOnetabGroup(onetabGroup: {
        id: string;
        tabsMeta: Array<Tab>;
        createDate: number;
        locked: boolean;
        starred: boolean;
    }): TabGroup {
        return {
            id: uuidv5(onetabGroup.id, uuidv5.DNS),
            tabs_meta: onetabGroup.tabsMeta.map(({ url, title }) => ({ url, title })),
            create_time: new Date(onetabGroup.createDate),
            update_time: new Date(),
            is_locked: onetabGroup.locked ?? false,
            is_starred: onetabGroup.starred ?? false,
        };
    }

    function formatGroup(tabGroup: TabGroup, categoryIds: Set<string | undefined> | null = null): TabGroup {
        tabGroup.category_id = categoryIds?.has(tabGroup.category_id) ? tabGroup.category_id : undefined;
        return tabGroup;
    }

    function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function importData(file: File) {
        isImporting.value = true;

        try {
            const jsonStr = await file.text();
            const data = JSON.parse(jsonStr);
            importProgress.value = 10;

            let appType, tabGroups, categories, settings;

            if (data.state?.tabGroups) {
                appType = 'Onetab';
                tabGroups = data.state.tabGroups;
            } else if (data.tabGroups) {
                appType = 'TabClip';
                tabGroups = data.tabGroups;
                categories = data.categories || [];
                settings = data.settings || {};
            } else {
                throw new Error('File format error');
            }

            await db.bulkPutCategories(categories);
            settingsStore.refreshSettings(settings);
            const categoryIds = new Set((await db.getAllCategories()).map((category) => category.id));

            const pageSize = 100;
            const pageCount = Math.ceil(tabGroups.length / pageSize);
            for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
                const slice = tabGroups.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
                await db.bulkPutGroups(
                    appType === 'Onetab'
                        ? slice.map(formatOnetabGroup)
                        : slice.map((group: TabGroup) => formatGroup(group, categoryIds)),
                );
                importProgress.value += (100 - importProgress.value) / (pageCount - pageIndex + 1);
                await sleep(200);
            }

            isImportDialogOpened.value = false;
            await categoryStore.loadCategories();
            refreshStore.refresh();
            toast.success(t('importData.success.toastTitle'), {
                description: t('importData.success.toastDesc', { total: tabGroups.length }),
            });
        } finally {
            isImporting.value = false;
            importProgress.value = 0;
        }
    }

    return {
        isImporting,
        importProgress,
        importData,
        isImportDialogOpened,
    };
}
