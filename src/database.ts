import Dexie, {type EntityTable} from "dexie";
import {loadSettings} from "@/store/settings.ts";
import {type SearchConditions} from "@/store/search.ts";
import {getLocalTimeZone} from "@internationalized/date";

interface Tab {
    id?: number | string;
    title?: string;
    url?: string;
    pinned?: boolean;
}

interface TabGroup {
    id?: string;  // UUID
    name?: string;
    tabs_meta: Array<Tab>;
    is_starred?: boolean;
    is_locked?: boolean;
    create_time?: Date;
    update_time?: Date;
    total?: number;
}

interface DBTabGroup extends Omit<TabGroup, "tabs_meta"> {
    tabs_meta: string;  // 其实是Array<tab>的字符串形式，为了方便存储故设计为一整个JSON字符串
}

class TabGroupDatabase extends Dexie {
    public tabGroups: EntityTable<DBTabGroup, "id">;

    constructor() {
        super("TabClip");
        this.version(1).stores({
            tabGroups: "id, tabs_meta, is_starred, is_locked, create_time, total",
        });

        // 初始化表
        this.tabGroups = this.table("tabGroups");
    }

    formatTab({title, url, pinned}: Tab): Tab {
        return pinned ? {title, url, pinned} : {title, url}
    }

    /** 添加 TabGroup */
    async addTabGroup(tabGroup: TabGroup) {
        if (!tabGroup.tabs_meta?.length) return;
        const settings = await loadSettings();
        return this.tabGroups.add({
            ...tabGroup,
            id: tabGroup.id || crypto.randomUUID(),
            tabs_meta: JSON.stringify(tabGroup.tabs_meta.map(this.formatTab)),
            is_starred: tabGroup.is_starred || false,
            is_locked: tabGroup.is_locked || settings.defaultLockGroup,
            create_time: tabGroup.create_time || new Date(),
            update_time: new Date(),
            total: tabGroup.tabs_meta.length,
        });
    }

    /** 添加 Tab */
    async addTab(tab: Tab) {
        let latestTabGroup = await this.tabGroups.orderBy("create_time").reverse().first();
        if (!latestTabGroup) {
            await this.addTabGroup({tabs_meta: [tab]});
        } else {
            const tabsMeta = JSON.parse(latestTabGroup.tabs_meta) as Array<Tab>;
            tabsMeta.unshift(tab);
            await this.tabGroups.update(latestTabGroup.id, {
                tabs_meta: JSON.stringify(tabsMeta),
                update_time: new Date(),
                total: tabsMeta.length,
            });
        }
    }

    /** 更新 TabGroup */
    async updateTabGroup(tabGroup: TabGroup) {
        return this.tabGroups.update(tabGroup.id!, {
            ...tabGroup,
            tabs_meta: JSON.stringify(tabGroup.tabs_meta.map(this.formatTab)),
            update_time: new Date(),
            total: tabGroup.tabs_meta.length,
        });
    }

    /** 删除 TabGroup */
    async deleteTabGroup(tabGroupId: string) {
        return this.tabGroups.delete(tabGroupId);
    }

    /** 查询所有 TabGroup */
    async getAllTabGroups(searchConditions: SearchConditions = {}): Promise<{
        tabGroups: TabGroup[],
        groupTotal: number,
        tabTotal: number
    }> {
        const settings = await loadSettings();
        let {
            text,
            startTime,
            endTime,
            starredOnly,
            pageSize = settings.pageSize,
            pageIndex = 1,
        } = searchConditions;

        let querySet = this.tabGroups.orderBy("create_time").reverse();
        if (starredOnly) querySet = querySet.filter((tabGroup) => tabGroup.is_starred === true);
        if (startTime) querySet = querySet.filter((tabGroup) => tabGroup.create_time! >= startTime.toDate(getLocalTimeZone()));
        if (endTime) querySet = querySet.filter((tabGroup) => tabGroup.create_time! <= endTime.add({days: 1}).toDate(getLocalTimeZone()));
        if (text) querySet = querySet.filter((tabGroup) => tabGroup.tabs_meta.toLowerCase().includes(text?.toLowerCase()));

        const groupTotal = await querySet.count();
        let tabTotal = 0;
        await querySet.each(tabGroup => {
            tabTotal += tabGroup.total ?? 0;
        })

        const rawData = await querySet.offset((pageIndex - 1) * pageSize).limit(pageSize).toArray();

        return {
            tabGroups: rawData.map((data) => ({
                ...data,
                tabs_meta: JSON.parse(data.tabs_meta).map((tab: Tab, index: number) => {
                    tab.id = index;
                    return tab;
                }),
            })),
            groupTotal: groupTotal,
            tabTotal: tabTotal,
        }
    }

    /** 批量更新/插入 TabGroup */
    async bulkPutGroups(tabGroups: Array<TabGroup>) {
        const data = tabGroups.map((tabGroup) => ({
            ...tabGroup,
            tabs_meta: JSON.stringify(tabGroup.tabs_meta.map(this.formatTab)),
            create_time: tabGroup.create_time ? new Date(tabGroup.create_time) : new Date(),
            update_time: new Date(),
            total: tabGroup.tabs_meta.length,
        }))
        await this.tabGroups.bulkPut(data);
    }
}

// 创建数据库实例
const db = new TabGroupDatabase();

export type {Tab, TabGroup};
export {db};