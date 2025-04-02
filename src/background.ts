/// <reference types="chrome"/>
import { db } from "./database";

const contextMenus: Array<chrome.contextMenus.CreateProperties> = [
    {
        id: "TabClip",
        title: "TabClip",
        contexts: ["all"],
    },
    {
        parentId: "TabClip",
        id: "sendAllTabsInCurrentWindowMenu",
        title: "发送当前窗口全部标签页至 TabClip",
        contexts: ["all"],
    },
    {
        parentId: "TabClip",
        id: "sendAllTabsInAllWindowsMenu",
        title: "发送所有窗口全部标签页至 TabClip",
        contexts: ["all"],
    },
    {
        parentId: "TabClip",
        id: "separator1",
        type: "separator",
        contexts: ["all"],
    },
    {
        parentId: "TabClip",
        id: "sendCurrentTabMenu",
        title: "发送此标签页至 TabClip",
        contexts: ["all"],
    },
    {
        parentId: "TabClip",
        id: "sendTabsExceptThisMenu",
        title: "发送除此标签页外的标签页至 TabClip",
        contexts: ["all"],
    },
    {
        parentId: "TabClip",
        id: "separator2",
        type: "separator",
        contexts: ["all"],
    },
    {
        parentId: "TabClip",
        id: "sendTabsToTheLeftMenu",
        title: "发送左侧标签页至 TabClip",
        contexts: ["all"],
    },
    {
        parentId: "TabClip",
        id: "sendTabsToTheRightMenu",
        title: "发送右侧标签页至 TabClip",
        contexts: ["all"],
    }
];

chrome.runtime.onInstalled.addListener(async () => {
    contextMenus.forEach((menu) => {
        chrome.contextMenus.create(menu);
    });
});

// @ts-ignore
function addTabAndWindowListener(call: () => void) {
    const tabEvents = [
        chrome.tabs.onCreated,
        chrome.tabs.onUpdated,
        chrome.tabs.onMoved,
        chrome.tabs.onRemoved,
        chrome.tabs.onReplaced,
        chrome.tabs.onDetached,
        chrome.tabs.onAttached,
        chrome.tabs.onActivated,
    ];

    const windowEvents = [
        chrome.windows.onFocusChanged,
        chrome.windows.onCreated,
        chrome.windows.onRemoved,
    ];

    tabEvents.forEach((event) => {
        event.addListener(() => call());
    });

    windowEvents.forEach((event) => {
        event.addListener(() => call());
    });
}

// @ts-ignore
function updateContextMenu(menuId: string, enabled: boolean) {
    chrome.contextMenus.update(menuId, { enabled });
}

function isExtensionTab(tab: chrome.tabs.Tab): boolean {
    return !!tab.url && tab.url.includes("tabclip.html");
}


const storePinnedTabs = false; // TODO: 从设置中读取
type Pair<T, U> = [T, U];

function checkPinTab(tab: chrome.tabs.Tab): boolean {
    return !tab.pinned || storePinnedTabs;
}

function isTabAddable(tab: chrome.tabs.Tab): boolean {
    return !isExtensionTab(tab) && checkPinTab(tab);
}

// @ts-ignore
function updateAllContextMenu() {
    chrome.windows.getLastFocused((window: chrome.windows.Window) => {
        if (!window) return;

        chrome.tabs.query({ windowId: window.id }, (tabs) => {
            const activeTab = tabs.find(tab => tab.active);
            if (!tabs || !activeTab) return;

            const sendCurrentTabMenuEnabled = !isExtensionTab(activeTab);
            const sendTabsExceptThisMenuEnabled = tabs.some(tab => {
                return tab.id !== activeTab.id && isTabAddable(tab);
            });
            const sendTabsToTheLeftMenuEnabled = tabs.some(tab => {
                return tab.index < activeTab.index && isTabAddable(tab);
            });
            const sendTabsToTheRightMenuEnabled = tabs.some(tab => {
                return tab.index > activeTab.index && isTabAddable(tab);
            });
            const sendAllTabsInCurrentWindowMenuEnabled = tabs.some((tab) => {
                return isTabAddable(tab);
            });

            chrome.tabs.query({}, (tabs) => {
                const sendAllTabsInAllWindowsMenuEnabled = tabs.some(tab => tab.windowId !== activeTab.windowId && isTabAddable(tab));
                const contextMenuStatus: Pair<string, boolean>[] = [
                    ["sendCurrentTabMenu", sendCurrentTabMenuEnabled],
                    ["sendAllTabsInAllWindowsMenu", sendAllTabsInAllWindowsMenuEnabled],
                    ["sendTabsToTheLeftMenu", sendTabsToTheLeftMenuEnabled],
                    ["sendTabsToTheRightMenu", sendTabsToTheRightMenuEnabled],
                    ["sendTabsExceptThisMenu", sendTabsExceptThisMenuEnabled],
                    ["sendAllTabsInCurrentWindowMenu", sendAllTabsInCurrentWindowMenuEnabled],
                ]
                contextMenuStatus.map(([menuId, status]) => {
                    updateContextMenu(menuId, status);
                })
            })
        })
    })
}

addTabAndWindowListener(updateAllContextMenu);

class TabGroupManager {
    // Use arrow functions (ensure that 'this' always points to the instance)

    addTabs = async (tabsToAdd: chrome.tabs.Tab[]) => {
        const addableTabs = tabsToAdd.filter(tab => isTabAddable(tab));
        await db.addTabGroup({ tabs_meta: addableTabs });
        await chrome.tabs.remove(addableTabs.map(tab => tab.id!));
        chrome.runtime.sendMessage(chrome.runtime.id, { event: "TabGroupUpdate" })
    };

    sendCurrentTab = async (tab: chrome.tabs.Tab) => {
        await db.addTab(tab);
        await chrome.tabs.remove(tab.id!);
        chrome.runtime.sendMessage(chrome.runtime.id, { event: "TabGroupUpdate" })
    }

    sendTabsExceptThis = async (tab: chrome.tabs.Tab) => {
        const allTabs = await chrome.tabs.query({ windowId: tab.windowId });
        const tabsToAdd = allTabs.filter(_tab => _tab.id !== tab.id);
        await this.addTabs(tabsToAdd);
    }

    sendAllTabsInCurrentWindow = async (tab: chrome.tabs.Tab) => {
        const allTabs = await chrome.tabs.query({ windowId: tab.windowId });
        await this.addTabs(allTabs);
        redirectToExtensionPage();
    }

    sendAllTabsInAllWindows = async (_tab: chrome.tabs.Tab) => {
        const allTabs = await chrome.tabs.query({});
        await this.addTabs(allTabs);
        redirectToExtensionPage();
    }

    sendTabsToTheLeft = async (tab: chrome.tabs.Tab) => {
        const allTabs = await chrome.tabs.query({ windowId: tab.windowId });
        const tabsToAdd = allTabs.filter(_tab => _tab.index < tab.index);
        await this.addTabs(tabsToAdd);
    }

    sendTabsToTheRight = async (tab: chrome.tabs.Tab) => {
        const allTabs = await chrome.tabs.query({ windowId: tab.windowId });
        const tabsToAdd = allTabs.filter(_tab => _tab.index > tab.index);
        await this.addTabs(tabsToAdd);
    }
}

const tabGroupManager = new TabGroupManager();

function createContextMenuHandler(action: (tab: chrome.tabs.Tab) => Promise<void>) {
    return async (_info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => {
        await action(tab);
    };
}

const contextMenuHandlerMap = {
    sendCurrentTabMenu: createContextMenuHandler(tabGroupManager.sendCurrentTab),
    sendTabsExceptThisMenu: createContextMenuHandler(tabGroupManager.sendTabsExceptThis),
    sendAllTabsInCurrentWindowMenu: createContextMenuHandler(tabGroupManager.sendAllTabsInCurrentWindow),
    sendAllTabsInAllWindowsMenu: createContextMenuHandler(tabGroupManager.sendAllTabsInAllWindows),
    sendTabsToTheLeftMenu: createContextMenuHandler(tabGroupManager.sendTabsToTheLeft),
    sendTabsToTheRightMenu: createContextMenuHandler(tabGroupManager.sendTabsToTheRight),
}

chrome.contextMenus.onClicked.addListener(async (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => {
    const menuId = info.menuItemId;
    const handler = Object.entries(contextMenuHandlerMap).find(([key]) => key === menuId)?.[1];
    (handler && tab) ? await handler(info, tab) : console.log(`no action matched for menuItemId: ${menuId}`);
})

chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
    await tabGroupManager.sendAllTabsInCurrentWindow(tab);
});

function redirectToExtensionPage() {
    chrome.tabs.query({}, (tabs) => {
        const extensionId = chrome.runtime.id;
        const extensionTab = tabs.find(tab => tab.url?.includes(`chrome-extension://${extensionId}`));
        if (extensionTab) {
            chrome.tabs.update(extensionTab.id!, { active: true, pinned: true });
            chrome.tabs.move(extensionTab.id!, { index: 0 });
            chrome.windows.update(extensionTab.windowId, { focused: true });
            chrome.runtime.sendMessage(extensionId, { event: "TabGroupUpdate" })
        } else {
            chrome.tabs.create({ url: `tabclip.html`, index: 0, pinned: true });
        }
    });
}