import { ref } from 'vue';
import { toast } from 'vue-sonner';

import { Category, db, type TabGroup } from '@/database.ts';
import { i18n } from '@/locales';
import { ORDERED_CATEGORIES } from '@/store/category';

export function useExport() {
    const isExporting = ref(false);
    const exportProgress = ref(0);
    const t = i18n.global.t;

    const stringify = (tabGroup: TabGroup): string => {
        const { id, tabs_meta, create_time, update_time, is_locked, is_starred, category_id } = tabGroup;
        return JSON.stringify({
            id,
            tabs_meta,
            create_time,
            update_time,
            is_locked,
            is_starred,
            category_id,
        });
    };

    const exportLargeJsonFile = async () => {
        isExporting.value = true;

        try {
            const pageSize = 100;
            const total = await db.tabGroups.count();
            const pageCount = Math.ceil(total / pageSize);
            exportProgress.value = 10;

            // 创建一个转换流来处理JSON数据
            const encoder = new TextEncoder();
            let streamClosed = false;

            // 创建可读流来输出数据
            const readableStream = new ReadableStream({
                async start(controller) {
                    try {
                        // 写入JSON开头
                        const storageResult = await browser.storage.local.get(ORDERED_CATEGORIES);
                        const categories = (storageResult[ORDERED_CATEGORIES] as Category[]) || [];
                        controller.enqueue(encoder.encode(`{"categories":${JSON.stringify(categories)},"tabGroups":[`));

                        // 逐页处理数据
                        for (let pageIndex = 1; pageIndex <= pageCount && !streamClosed; pageIndex++) {
                            // 检查流是否已关闭，避免不必要的数据库操作
                            if (streamClosed) {
                                break;
                            }
                            // 每次处理一页数据
                            const tabGroups = (
                                await db.getAllTabGroups({
                                    pageSize,
                                    pageIndex,
                                })
                            ).tabGroups;
                            if (tabGroups && tabGroups.length > 0) {
                                const jsonList = tabGroups.map((tabGroup) => stringify(tabGroup));
                                const prefix = pageIndex === 1 ? '' : ',';
                                controller.enqueue(encoder.encode(prefix + jsonList.join(',')));
                            }
                            // 更新进度
                            exportProgress.value += (100 - exportProgress.value) / (pageCount - pageIndex + 1);
                            // 允许浏览器进行其他操作
                            await new Promise((resolve) => setTimeout(resolve, 100));
                        }

                        // 如果流未关闭，添加JSON结尾并关闭流
                        if (!streamClosed) {
                            controller.enqueue(encoder.encode(']}'));
                            controller.close();
                            streamClosed = true;
                        }
                    } catch (error) {
                        console.error('流处理过程中出错:', error);
                        if (!streamClosed) {
                            controller.error(error);
                            streamClosed = true;
                        }
                    }
                },

                cancel() {
                    // 标记流已关闭，避免继续处理
                    streamClosed = true;
                },
            });

            // 将流转换为Blob
            const response = new Response(readableStream, {
                headers: { 'Content-Type': 'application/json' },
            });
            const blob = await response.blob();

            // 创建Blob URL
            const url = URL.createObjectURL(blob);

            try {
                // 使用browser.downloads.download触发保存
                await browser.downloads.download({
                    url,
                    filename: 'tabGroups_export.json',
                    saveAs: true,
                });
                toast.success(t('exportGroups.success.toastTitle'), {
                    description: t('exportGroups.success.toastDesc', {
                        total: total,
                    }),
                });
            } catch (downloadError) {
                console.error('Chrome下载API失败:', downloadError);
                // 回退到传统下载方法
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tabGroups_export.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.success(t('exportGroups.success.toastTitle'), {
                    description: t('exportGroups.success.toastDesc', {
                        total: total,
                    }),
                });
            } finally {
                // 确保释放Blob URL
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);
            }
        } catch (error) {
            toast.error(t('exportGroups.error.toastTitle'), {
                description: t('exportGroups.error.toastDesc', {
                    error: error,
                }),
            });
            console.error('导出过程出错:', error);
            throw new Error(`导出JSON文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            isExporting.value = false;
            exportProgress.value = 0;
        }
    };

    return {
        isExporting,
        exportProgress,
        exportLargeJsonFile,
    };
}
