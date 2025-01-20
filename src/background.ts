/// <reference types="chrome"/>
chrome.action.onClicked.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
        const extensionId = chrome.runtime.id;
        const extensionTab = tabs.find(tab => tab.url?.includes(extensionId));
        if (extensionTab) {
            chrome.tabs.update(extensionTab.id!, {active: true, pinned: true});
            chrome.tabs.move(extensionTab.id!, {index: 0});
            chrome.windows.update(extensionTab.windowId, {focused: true});
            // TODO: 切换到对应的窗口上
        } else {
            chrome.tabs.create({url: 'tabclip.html', index: 0, pinned: true});
        }
    });
});

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

chrome.runtime.onInstalled.addListener(() => {
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
    chrome.contextMenus.update(menuId, {enabled});
}

function isExtensionTab(tab: chrome.tabs.Tab): boolean {
    return !!tab.url && tab.url.includes("tabclip.html");
}


const storePinnedTabs = false; // TODO: 从设置中读取
type Pair<T, U> = [T, U];

function checkPinTab(tab: chrome.tabs.Tab): boolean {
    return !tab.pinned || storePinnedTabs;
}

// @ts-ignore
function updateAllContextMenu() {
    chrome.windows.getLastFocused((window: chrome.windows.Window) => {
        if (!window) return;

        chrome.tabs.query({windowId: window.id}, (tabs) => {
            const activeTab = tabs.find(tab => tab.active);
            if (!tabs || !activeTab) return;

            const sendCurrentTabMenuEnabled = !isExtensionTab(activeTab);
            const sendTabsExceptThisMenuEnabled = tabs.some(tab => {
                return tab.id !== activeTab.id && !isExtensionTab(tab) && checkPinTab(tab);
            });
            const sendTabsToTheLeftMenuEnabled = tabs.some(tab => {
                return tab.index < activeTab.index && !isExtensionTab(tab) && checkPinTab(tab);
            });
            const sendTabsToTheRightMenuEnabled = tabs.some(tab => {
                return tab.index > activeTab.index && !isExtensionTab(tab) && checkPinTab(tab);
            });
            const sendAllTabsInCurrentWindowMenuEnabled = tabs.some((tab) => {
                return !isExtensionTab(tab) && checkPinTab(tab);
            });

            chrome.tabs.query({}, (tabs) => {
                const sendAllTabsInAllWindowsMenuEnabled = tabs.some(tab => tab.windowId !== activeTab.windowId && !isExtensionTab(tab));
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