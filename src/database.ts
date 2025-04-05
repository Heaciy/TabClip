import Dexie, {type EntityTable} from "dexie";
import {loadSettings} from "@/store/settings.ts";

interface Tab {
    title?: string;
    url?: string;
}

interface TabGroup {
    id?: string; // UUID
    tabs_meta: Array<Tab>; // 其实是Array<tab>的字符串形式，为了方便存储故设计为一整个JSON字符串
    is_starred?: boolean;
    is_locked?: boolean;
    create_time?: Date;
    update_time?: Date;
}

interface DBTabGroup extends Omit<TabGroup, "tabs_meta"> {
    tabs_meta: string;
}

class TabGroupDatabase extends Dexie {
    public tabGroups: EntityTable<DBTabGroup, "id">;

    constructor() {
        super("TabClip");
        this.version(1).stores({
            tabGroups: "++id, tabs_meta, is_starred, is_locked, create_time",
        });

        // 初始化表
        this.tabGroups = this.table("tabGroups");
    }

    /** 添加 TabGroup */
    async addTabGroup(tabGroup: TabGroup) {
        if (!tabGroup.tabs_meta?.length) return;
        const settings = await loadSettings();
        return this.tabGroups.add({
            ...tabGroup,
            id: tabGroup.id || crypto.randomUUID(),
            tabs_meta: JSON.stringify(tabGroup.tabs_meta.map(({title, url}) => ({title, url}))),
            is_starred: tabGroup.is_starred || false,
            is_locked: tabGroup.is_locked || settings.defaultLockGroup,
            create_time: tabGroup.create_time || new Date(),
            update_time: new Date(),
        });
    }

    /** 添加 Tab */
    async addTab(tab: Tab) {
        let latestTabGroup = await this.tabGroups.orderBy("create_time").reverse().first();
        console.log(latestTabGroup);
        if (!latestTabGroup) {
            await this.addTabGroup({tabs_meta: [tab]});
        } else {
            const tabsMeta = JSON.parse(latestTabGroup.tabs_meta) as Array<Tab>;
            tabsMeta.unshift(tab);
            await this.tabGroups.update(latestTabGroup.id, {
                tabs_meta: JSON.stringify(tabsMeta),
                update_time: new Date(),
            });
        }
    }

    /** 更新 TabGroup */
    async updateTabGroup(tabGroup: TabGroup) {
        return this.tabGroups.update(tabGroup.id!, {
            ...tabGroup,
            tabs_meta: JSON.stringify(tabGroup.tabs_meta.map(({title, url}) => ({title, url}))),
            update_time: new Date(),
        });
    }

    /** 删除 TabGroup */
    async deleteTabGroup(tabGroupId: string) {
        return this.tabGroups.delete(tabGroupId);
    }

    /** 查询所有 TabGroup */
    async getAllTabGroups(): Promise<TabGroup[]> {
        const rawData = await this.tabGroups.orderBy("create_time").reverse().toArray();
        return rawData.map((data) => ({
            ...data,
            tabs_meta: JSON.parse(data.tabs_meta),
        }));
    }
}

// 创建数据库实例
const db = new TabGroupDatabase();

export type {Tab, TabGroup};
export {db};