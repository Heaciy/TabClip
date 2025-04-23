import { ref } from "vue";
import { v5 as uuidv5 } from 'uuid';
import { toast } from "vue-sonner";
import { db, type Tab, type TabGroup } from "@/database.ts";
import { i18n } from "@/locales";
import { useRefreshStore } from "@/store/refreshStore";


export function useImport() {
    const isImporting = ref<boolean>(false);
    const importProgress = ref<number>(0);
    const isImportDialogOpened = ref<boolean>(false);

    const refreshStore = useRefreshStore();
    const t = i18n.global.t;

    function formatOnetabGroup(onetabGroup: { id: string, tabsMeta: Array<Tab>, createDate: number, locked: boolean, starred: boolean }): TabGroup {
        return {
            id: uuidv5(onetabGroup.id, uuidv5.DNS),
            tabs_meta: onetabGroup.tabsMeta.map(({ url, title }) => ({ url, title })),
            create_time: new Date(onetabGroup.createDate),
            update_time: new Date(),
            total: onetabGroup.tabsMeta.length,
            is_locked: onetabGroup.locked ?? false,
            is_starred: onetabGroup.starred ?? false,
        }
    }

    function sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function importData(file: File) {
        isImporting.value = true;

        try {
            const jsonStr = await file.text();
            const data = JSON.parse(jsonStr);
            importProgress.value = 10;

            let appType, tabGroups;

            if (data.state?.tabGroups) {
                appType = "Onetab";
                tabGroups = data.state.tabGroups;
            } else if (data.tabGroups) {
                appType = "TabClip";
                tabGroups = data.tabGroups;
            } else {
                throw new Error('File format error');
            }

            const pageSize = 100;
            const pageCount = Math.ceil(tabGroups.length / pageSize);
            for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
                const slice = tabGroups.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
                await db.bulkPutGroups(appType === "Onetab" ? slice.map(formatOnetabGroup) : slice);
                importProgress.value += (100 - importProgress.value) / (pageCount - pageIndex + 1)
                await sleep(200);
            }

            isImportDialogOpened.value = false;
            refreshStore.refresh();
            toast.success(t("importGroups.success.toastTitle"), {
                description: t("importGroups.success.toastDesc", { total: tabGroups.length }),
            })
        }
        finally {
            isImporting.value = false;
            importProgress.value = 0;
        }
    }

    return {
        isImporting,
        importProgress,
        importData,
        isImportDialogOpened,
    }
}