import { getLocalTimeZone } from '@internationalized/date';
import { addDays, eachDayOfInterval, format, parse } from 'date-fns';
import Dexie, { type EntityTable } from 'dexie';

import { type SearchConditions } from '@/store/search';
import { loadSettings } from '@/store/settings';

interface Tab {
    id?: number | string;
    title?: string;
    url?: string;
    pinned?: boolean;
    pendingUrl?: string;
    status?: string;
}

interface TabGroup {
    id?: string; // UUID
    name?: string;
    tabs_meta: Array<Tab>;
    is_starred?: boolean;
    is_locked?: boolean;
    is_browser_group?: boolean; // is_raw_group
    create_time?: Date;
    update_time?: Date;
    category_id?: string;
}

interface Category {
    id?: string; // UUID
    name: string;
    create_time?: Date;
}

interface DBTabGroup extends TabGroup {}

interface DBCategory extends Category {}

interface HeatmapData {
    date_list: string[];
    group_num_list: number[];
    tab_num_list: number[];
    group_max: number;
    group_min: number;
    tab_max: number;
    tab_min: number;
    years: number[];
}

class TabGroupDatabase extends Dexie {
    public tabGroups: EntityTable<DBTabGroup, 'id'>;
    public categories: EntityTable<DBCategory, 'id'>;

    constructor() {
        super('TabClip');
        this.version(2).stores({
            tabGroups: 'id, is_starred, is_locked, create_time, category_id',
            categories: 'id, name, create_time',
        });

        // 初始化表
        this.tabGroups = this.table('tabGroups');
        this.categories = this.table('categories');
    }

    isTabClipable = (tab: Tab) => {
        return !!(tab.url || tab.pendingUrl);
    };

    isBrowserNewTab = (tab: Tab): boolean => {
        const browserNewTabUrls = ['chrome://newtab', 'edge://newtab', 'about:newtab', 'about:home', 'about:blank'];
        return browserNewTabUrls.some((url: string) => tab.url?.startsWith(url));
    };

    formatTab = (tab: Tab): Tab => {
        const isLoading = tab.status === 'loading';
        const isNewTab = this.isBrowserNewTab(tab);
        const hasUrl = !!tab.url;

        const resolvedUrl = hasUrl ? (isLoading && isNewTab ? tab.pendingUrl : tab.url) : tab.pendingUrl;
        const resolvedTitle = tab.title && !(isLoading && isNewTab) ? tab.title : resolvedUrl;

        const formattedTab: Tab = {
            title: resolvedTitle || '',
            url: resolvedUrl || '',
        };

        if (tab.pinned) {
            formattedTab.pinned = true;
        }

        return formattedTab;
    };

    formatTabs = (tabs: Tab[]): Tab[] => {
        return tabs.filter(this.isTabClipable).map((tab: Tab) => this.formatTab(tab));
    };

    /** 添加 TabGroup */
    async addTabGroup(tabGroup: TabGroup) {
        if (!tabGroup.tabs_meta?.length) return;
        const settings = await loadSettings();
        const tabs_meta = this.formatTabs(tabGroup.tabs_meta);
        return this.tabGroups.add({
            ...tabGroup,
            tabs_meta,
            id: tabGroup.id || crypto.randomUUID(),
            is_starred: tabGroup.is_starred || false,
            is_locked: tabGroup.is_locked || settings.defaultLockGroup,
            is_browser_group: tabGroup.is_browser_group,
            create_time: tabGroup.create_time || new Date(),
            update_time: new Date(),
            category_id: tabGroup.category_id,
        });
    }

    /** 添加 Tab */
    async addTab(tab: Tab) {
        if (!this.isTabClipable(tab)) return;
        let latestTabGroup = await this.tabGroups.orderBy('create_time').reverse().first();
        if (!latestTabGroup) {
            await this.addTabGroup({ tabs_meta: [tab] });
        } else {
            const tabsMeta = latestTabGroup.tabs_meta;
            tabsMeta.unshift(this.formatTab(tab));
            await this.tabGroups.update(latestTabGroup.id, {
                tabs_meta: tabsMeta,
                update_time: new Date(),
            });
        }
    }

    /** 更新 TabGroup */
    async updateTabGroup(tabGroup: TabGroup) {
        const tabs_meta = this.formatTabs(tabGroup.tabs_meta);
        return this.tabGroups.update(tabGroup.id!, {
            ...tabGroup,
            tabs_meta,
            update_time: new Date(),
        });
    }

    /** 删除 TabGroup */
    async deleteTabGroup(tabGroupId: string) {
        return this.tabGroups.delete(tabGroupId);
    }

    /** 查询所有 TabGroup */
    async getAllTabGroups(searchConditions: SearchConditions = {}): Promise<{
        tabGroups: TabGroup[];
        groupTotal: number;
        tabTotal: number;
    }> {
        const settings = await loadSettings();
        let {
            text,
            startTime,
            endTime,
            starredOnly,
            pageSize = settings.pageSize,
            pageIndex = 1,
            categoryId,
        } = searchConditions;

        let querySet = this.tabGroups.orderBy('create_time').reverse();
        if (starredOnly) querySet = querySet.filter((tabGroup) => tabGroup.is_starred === true);
        if (startTime)
            querySet = querySet.filter((tabGroup) => tabGroup.create_time! >= startTime.toDate(getLocalTimeZone()));
        if (endTime)
            querySet = querySet.filter(
                (tabGroup) => tabGroup.create_time! <= endTime.add({ days: 1 }).toDate(getLocalTimeZone()),
            );
        if (categoryId) querySet = querySet.filter((tabGroup) => tabGroup.category_id === categoryId);

        if (text) {
            const textLower = text.toLowerCase();
            querySet = querySet.filter((tabGroup) => {
                return (
                    tabGroup.name?.toLowerCase().includes(textLower) ||
                    tabGroup.tabs_meta?.some(
                        (tab) =>
                            tab.title?.toLowerCase().includes(textLower) || tab.url?.toLowerCase().includes(textLower),
                    )
                );
            });
        }

        const groupTotal = await querySet.count();
        let tabTotal = 0;
        await querySet.each((tabGroup) => {
            tabTotal += tabGroup.tabs_meta.length ?? 0;
        });

        const rawData = await querySet
            .offset((pageIndex - 1) * pageSize)
            .limit(pageSize)
            .toArray();

        return {
            tabGroups: rawData.map((data) => ({
                ...data,
                tabs_meta: data.tabs_meta.map((tab: Tab) => {
                    tab.id = crypto.randomUUID();
                    return tab;
                }),
            })),
            groupTotal: groupTotal,
            tabTotal: tabTotal,
        };
    }

    /** 批量更新/插入 TabGroup */
    async bulkPutGroups(tabGroups: Array<TabGroup>) {
        const data = tabGroups.map((tabGroup) => ({
            ...tabGroup,
            tabs_meta: tabGroup.tabs_meta.map(this.formatTab),
            create_time: tabGroup.create_time ? new Date(tabGroup.create_time) : new Date(),
            update_time: new Date(),
        }));
        await this.tabGroups.bulkPut(data);
    }

    /** 获取热力图数据 */
    async heatmap(year?: number): Promise<HeatmapData> {
        const [startDate, endDate] = getDateRange(year).map((dateStr) => {
            return parse(dateStr, 'yyyy-MM-dd', new Date());
        });

        const dateList = eachDayOfInterval({ start: startDate, end: endDate }).map((date) =>
            format(date, 'yyyy-MM-dd'),
        );

        const groupCountMap: Record<string, number> = {};
        const tabCountMap: Record<string, number> = {};
        for (const dateStr of dateList) {
            groupCountMap[dateStr] = 0;
            tabCountMap[dateStr] = 0;
        }

        let querySet = this.tabGroups.orderBy('create_time').reverse();

        const years: Array<number> = [];
        const endYear = new Date().getFullYear();
        const startYear = (await querySet.clone().last())?.create_time?.getFullYear() || new Date().getFullYear();
        for (let year = startYear; year <= endYear; year++) {
            years.unshift(year);
        }

        querySet = querySet.filter(
            (tabGroup) => tabGroup.create_time! >= startDate && tabGroup.create_time! < addDays(endDate, 1),
        );
        await querySet.each((tabGroup) => {
            if (!tabGroup.create_time) return;
            const dateStr = format(tabGroup.create_time, 'yyyy-MM-dd');
            groupCountMap[dateStr] += 1;
            tabCountMap[dateStr] += tabGroup.tabs_meta.length || 0;
        });

        const group_num_list = dateList.map((date) => groupCountMap[date]);
        const tab_num_list = dateList.map((date) => tabCountMap[date]);

        return {
            date_list: dateList,
            group_num_list,
            tab_num_list,
            years,
            group_max: Math.max(...group_num_list),
            group_min: Math.min(...group_num_list),
            tab_max: Math.max(...tab_num_list),
            tab_min: Math.min(...tab_num_list),
        };
    }

    /** 通过 ID 获取分类 */
    async getCategoryById(id: string): Promise<Category | undefined> {
        return this.categories.get(id);
    }

    /** 添加分类 */
    async addCategory(category: Category) {
        const categoryId = await this.categories.add({
            id: category.id || crypto.randomUUID(),
            name: category.name,
            create_time: category.create_time || new Date(),
        });
        return this.categories.get(categoryId);
    }

    /** 获取所有分类 */
    async getAllCategories(desc: boolean = false): Promise<Category[]> {
        let query = this.categories.orderBy('create_time');
        if (desc) {
            query = query.reverse();
        }
        return query.toArray();
    }

    /** 更新分类 */
    async updateCategory(category: Category) {
        await this.categories.update(category.id!, { name: category.name });
        return this.categories.get(category.id!);
    }

    /** 批量更新/插入分类 */
    async bulkPutCategories(categories: Array<Category>) {
        await this.categories.bulkPut(categories);
    }

    /** 删除分类 */
    async deleteCategory(categoryId: string) {
        await this.tabGroups.where('category_id').equals(categoryId).modify({
            category_id: undefined, // 解除关联
            update_time: new Date(),
        });
        await this.categories.delete(categoryId);
    }

    /** 删除分类和关联的 TabGroup 数据 */
    async deleteCategoryAndAssociatedGroups(categoryId: string) {
        return this.transaction('rw', this.categories, this.tabGroups, async () => {
            await this.categories.delete(categoryId);
            await this.tabGroups.where('category_id').equals(categoryId).delete();
        });
    }

    async mergeCategory(category: Category, categoryTo: Category) {
        return this.transaction('rw', this.categories, this.tabGroups, async () => {
            // 检查 ID 是否有效且不相同
            if (!category.id || !categoryTo.id || category.id === categoryTo.id) {
                console.warn('Merge categories failed: Invalid or identical IDs.');
                return;
            }
            // 批量更新所有关联的 TabGroup，将其指向 categoryTo
            await this.tabGroups.where('category_id').equals(category.id).modify({
                category_id: categoryTo.id,
                update_time: new Date(),
            });

            // 删除原始的 category
            await this.categories.delete(category.id);
        });
    }
}

const getDateRange = (year?: number): [string, string] => {
    if (!!year && year !== -1) {
        // 如果提供了 year，则返回该年从 01-01 到 12-31 的范围
        const startDate = new Date(year, 0, 1); // January is month 0
        const endDate = new Date(year, 11, 31); // December is month 11
        return [format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')];
    } else {
        // 如果没有提供 year，则返回从一年前到今天的范围
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        return [format(oneYearAgo, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')];
    }
};

// 创建数据库实例
const db = new TabGroupDatabase();

export type { Category, HeatmapData, Tab, TabGroup };
export { db, getDateRange };
