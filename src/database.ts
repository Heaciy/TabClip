import Dexie, {type EntityTable} from "dexie";

interface Tab {
    title: string;
    url: string;
}

interface TabGroup {
    id?: string; // UUID
    tabs_meta: Array<Tab>; // 其实是Array<tab>的字符串形式，为了方便存储故设计为一整个JSON字符串
    is_starred: boolean;
    is_locked: boolean;
    create_time: Date;
    update_time: Date;
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
        return this.tabGroups.add({
            ...tabGroup,
            id: tabGroup.id || crypto.randomUUID(),
            tabs_meta: JSON.stringify(tabGroup.tabs_meta),
        });
    }

    /** 更新 TabGroup */
    async updateTabGroup(tabGroup: TabGroup) {
        return this.tabGroups.update(tabGroup.id!, {
            ...tabGroup,
            tabs_meta: JSON.stringify(tabGroup.tabs_meta),
        });
    }

    /** 删除 TabGroup */
    async deleteTabGroup(tabGroupId: string) {
        return this.tabGroups.delete(tabGroupId);
    }

    /** 查询所有 TabGroup */
    async getAllTabGroups(): Promise<TabGroup[]> {
        const rawData = await this.tabGroups.toArray();
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