<script setup lang="ts">
import {Icon} from "@iconify/vue";
import {toast} from "vue-sonner";
import {useI18n} from 'vue-i18n';
import {db} from "@/database.ts";
import {useSettingStore} from "@/store/settings.ts";
import {DropdownMenuItem} from "@/components/ui/dropdown-menu";

const {t} = useI18n();
const settingsStore = useSettingStore();

const exportLargeJsonFile = async () => {
    try {
        const pageSize = settingsStore.settings.pageSize;
        const total = await db.tabGroups.count();
        const pageCount = Math.ceil(total / pageSize);

        // 创建一个转换流来处理JSON数据
        const encoder = new TextEncoder();
        let streamClosed = false;

        // 创建可读流来输出数据
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    // 写入JSON开头
                    controller.enqueue(encoder.encode('{"tabGroups":['));

                    // 逐页处理数据
                    for (let pageIndex = 1; pageIndex <= pageCount && !streamClosed; pageIndex++) {
                        // 检查流是否已关闭，避免不必要的数据库操作
                        if (streamClosed) {
                            break;
                        }
                        // 每次处理一页数据
                        const tabGroups = (await db.getAllTabGroups({pageSize, pageIndex})).tabGroups;
                        if (tabGroups && tabGroups.length > 0) {
                            const jsonList = tabGroups.map(tabGroup => JSON.stringify(tabGroup));
                            const prefix = pageIndex === 1 ? '' : ',';
                            controller.enqueue(encoder.encode(prefix + jsonList.join(',')));
                        }
                        // 允许浏览器进行其他操作
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }

                    // 如果流未关闭，添加JSON结尾并关闭流
                    if (!streamClosed) {
                        controller.enqueue(encoder.encode(']}'));
                        controller.close();
                        streamClosed = true;
                    }
                } catch (error) {
                    console.error("流处理过程中出错:", error);
                    if (!streamClosed) {
                        controller.error(error);
                        streamClosed = true;
                    }
                }
            },

            cancel() {
                // 标记流已关闭，避免继续处理
                streamClosed = true;
            }
        });

        // 将流转换为Blob
        const response = new Response(readableStream, {
            headers: {"Content-Type": "application/json"}
        });
        const blob = await response.blob();

        // 创建Blob URL
        const url = URL.createObjectURL(blob);

        try {
            // 使用chrome.downloads.download触发保存
            await chrome.downloads.download({
                url,
                filename: "tabGroups_export.json",
                saveAs: true,
            });
            toast.success(t("exportGroups.success.toastTitle"), {
                description: t("exportGroups.success.toastDesc", {total: total})
            })
        } catch (downloadError) {
            console.error("Chrome下载API失败:", downloadError);
            // 回退到传统下载方法
            const a = document.createElement('a');
            a.href = url;
            a.download = "tabGroups_export.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success(t("exportGroups.success.toastTitle"), {
                description: t("exportGroups.success.toastDesc", {total: total})
            })
        } finally {
            // 确保释放Blob URL
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
        }
    } catch (error) {
        toast.error(t("exportGroups.error.toastTitle"), {
            description: t("exportGroups.error.toastDesc", {error: error}),
        })
        console.error("导出过程出错:", error);
        throw new Error(`导出JSON文件失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
};
</script>

<template>
    <DropdownMenuItem @click="exportLargeJsonFile">
        <span class="mr-auto">{{ $t("moreOperations.dataOperations.exportGroups") }}</span>
        <Icon icon="radix-icons:download"></Icon>
    </DropdownMenuItem>
</template>

<style scoped>

</style>