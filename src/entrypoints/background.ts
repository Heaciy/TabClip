// entrypoints/background.ts (or your chosen WXT background script location)

// WXT provides the 'browser' global from webextension-polyfill
// No explicit import for 'browser' is usually needed in WXT entrypoints.

// Adjust import paths based on your WXT project structure
// e.g., if 'database' and 'store/settings' are in a 'shared' or 'utils' folder
import { db, TabGroup } from '@/database';
import deMessages from '@/locales/messages/de.json';
import enMessages from '@/locales/messages/en.json';
import esMessages from '@/locales/messages/es.json';
import frMessages from '@/locales/messages/fr.json';
import jaMessages from '@/locales/messages/ja.json';
import koMessages from '@/locales/messages/ko.json';
import ptMessages from '@/locales/messages/pt.json';
import ruMessages from '@/locales/messages/ru.json';
import zhMessages from '@/locales/messages/zh.json';
import zh_TWMessages from '@/locales/messages/zh-TW.json';
import { loadSettings, type Settings } from '@/store/settings';

const MESSAGES: Record<string, Record<string, string>> = {
    zh: zhMessages,
    en: enMessages,
    de: deMessages,
    es: esMessages,
    fr: frMessages,
    ko: koMessages,
    ja: jaMessages,
    'zh-TW': zh_TWMessages,
    pt: ptMessages,
    ru: ruMessages,
};

const t = (key: string, lang: string): string => {
    return MESSAGES[lang]?.[key] || MESSAGES['en']?.[key] || key;
};

export default defineBackground(() => {
    async function getCurrentLang(): Promise<string> {
        const result = await browser.storage.local.get('locale');
        const storageLang = result['locale'];

        if (storageLang in MESSAGES) {
            return storageLang;
        }

        const browserLang = browser.i18n.getUILanguage();
        if (browserLang.startsWith('zh')) {
            return 'zh';
        }
        return 'en';
    }

    async function getContextMenuProperties(): Promise<Array<Browser.contextMenus.CreateProperties>> {
        const lang = await getCurrentLang();
        return [
            {
                id: 'TabClip',
                title: 'TabClip',
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'displayTabClipMenu',
                title: t('displayTabClip', lang),
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'separator0',
                type: 'separator',
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'sendAllTabsInCurrentWindowMenu',
                title: t('sendAllTabsInCurrentWindow', lang),
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'sendAllTabsInAllWindowsMenu',
                title: t('sendAllTabsInAllWindows', lang),
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'separator1',
                type: 'separator',
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'sendCurrentTabMenu',
                title: t('sendCurrentTab', lang),
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'sendTabsExceptThisMenu',
                title: t('sendTabsExceptThis', lang),
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'separator2',
                type: 'separator',
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'sendTabsToTheLeftMenu',
                title: t('sendTabsToTheLeft', lang),
                contexts: ['all'],
            },
            {
                parentId: 'TabClip',
                id: 'sendTabsToTheRightMenu',
                title: t('sendTabsToTheRight', lang),
                contexts: ['all'],
            },
        ];
    }

    async function setupContextMenus() {
        // WXT might handle declarative context menus in wxt.config.ts in the future,
        // but programmatic creation is fully supported.
        // For Firefox, it's good practice to remove existing menus before recreating,
        // especially during development to avoid errors if IDs conflict.
        await browser.contextMenus.removeAll();
        const contextMenuProperties = await getContextMenuProperties();
        contextMenuProperties.forEach((menu) => {
            try {
                browser.contextMenus.create(menu);
            } catch (e) {
                // This error can happen if an ID is duplicated or another issue occurs.
                console.error(`Failed to create context menu "${menu.id}":`, e);
            }
        });
    }

    browser.runtime.onInstalled.addListener(async (details) => {
        await setupContextMenus();
        await updateAllContextMenuStates(); // Initialize states after creation

        // Only show dialog on extension install or version update, not on browser updates
        const manifest = browser.runtime.getManifest();
        const isExtensionVersionChanged =
            details.reason === 'update' && details.previousVersion && details.previousVersion !== manifest.version;

        if (details.reason === 'install' || isExtensionVersionChanged) {
            await browser.storage.local.set({ showAboutDialog: import.meta.env.SHOW_ABOUT_DIALOG });

            const settings = await loadSettings();
            if (settings.isStartupPage) {
                await redirectToExtensionPage();
            }
        }
    });

    browser.runtime.onStartup.addListener(async () => {
        await setupContextMenus();
        await updateAllContextMenuStates();

        const settings = await loadSettings();
        if (settings.isStartupPage) {
            await redirectToExtensionPage();
        }
    });

    browser.storage.onChanged.addListener(async (changes, areaName) => {
        if (areaName !== 'local') return;
        if (changes['locale']) {
            await setupContextMenus();
            await updateAllContextMenuStates();
        }
    });

    function addTabAndWindowListeners(callback: () => void | Promise<void>) {
        const tabEvents: Array<Browser.events.Event<(_arg1?: any, _arg2?: any, _arg3?: any) => void>> = [
            browser.tabs.onCreated,
            browser.tabs.onUpdated,
            browser.tabs.onMoved,
            browser.tabs.onRemoved,
            browser.tabs.onReplaced, // Deprecated in MV3; onUpdated generally covers this.
            browser.tabs.onDetached,
            browser.tabs.onAttached,
            browser.tabs.onActivated,
        ];

        const windowEvents: Array<Browser.events.Event<(_arg1?: any) => void>> = [
            browser.windows.onFocusChanged,
            browser.windows.onCreated,
            browser.windows.onRemoved,
        ];

        tabEvents.forEach((event) => event.addListener(callback));
        windowEvents.forEach((event) => event.addListener(callback));
    }

    async function updateContextMenuState(menuId: string, enabled: boolean) {
        try {
            await browser.contextMenus.update(menuId, { enabled });
        } catch (e) {
            // This can happen if the menu was somehow removed or not created.
            console.warn(`Could not update context menu state for "${menuId}":`, e);
        }
    }

    function isTabInWhitelist(tab: Browser.tabs.Tab, settings: Settings) {
        const url = tab.url || tab.pendingUrl || '';
        const prefixes = settings.tabWhitelist;
        if (!url || prefixes.length === 0) return false;

        return prefixes.some((prefix) => url.startsWith(prefix));
    }

    // eslint-disable-next-line no-unused-vars
    function isBlankPage(tab: Browser.tabs.Tab): boolean {
        const url = tab.url || tab.pendingUrl || '';
        const blankTabs = ['about:blank', 'chrome://newtab/', 'edge://newtab', 'about:newtab'];
        return blankTabs.some((prefix) => url.startsWith(prefix));
    }

    function isExtensionPage(tab: Browser.tabs.Tab): boolean {
        const url = tab.url || tab.pendingUrl;
        // Use browser.runtime.getURL to create the base URL for comparison
        return url ? url.startsWith(browser.runtime.getURL('/tabclip.html')) : false;
    }

    type Pair<T, U> = [T, U];

    function checkPinTabStatus(tab: Browser.tabs.Tab, settings: Settings): boolean {
        return !tab.pinned || settings.storePinnedTabs;
    }

    function checkBrowserGroup(tab: Browser.tabs.Tab, settings: Settings): boolean {
        return tab.groupId === browser.tabGroups.TAB_GROUP_ID_NONE || settings.storeBrowserGroup;
    }

    function isTabClipable(tab: Browser.tabs.Tab, settings: Settings): boolean {
        return (
            !isTabInWhitelist(tab, settings) &&
            // !isBlankPage(tab) &&
            !isExtensionPage(tab) &&
            checkPinTabStatus(tab, settings) &&
            checkBrowserGroup(tab, settings)
        );
    }

    async function updateAllContextMenuStates() {
        let currentWindow: Browser.windows.Window | undefined;
        try {
            currentWindow = await browser.windows.getLastFocused({ populate: true, windowTypes: ['normal', 'popup'] });
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            // In Firefox, if no window is focused (e.g., devtools focused), this can throw.
            // Try browser.windows.getCurrent() as a fallback.
            try {
                currentWindow = await browser.windows.getCurrent({ populate: true, windowTypes: ['normal', 'popup'] });
            } catch (e2) {
                console.warn('Could not get current or last focused window:', e2);
                // If no window context, disable all actionable menus
                const contextMenuProperties = await getContextMenuProperties();
                const menuIdsToDisable = contextMenuProperties
                    .filter((m) => m.id !== 'TabClip' && m.id !== 'displayTabClipMenu' && m.type !== 'separator')
                    .map((m) => m.id);
                for (const id of menuIdsToDisable) await updateContextMenuState(id!, false);
                return;
            }
        }

        if (!currentWindow || currentWindow.id === undefined || currentWindow.id === browser.windows.WINDOW_ID_NONE) {
            // Fallback for safety, though covered above.
            return;
        }

        const currentTabs = currentWindow.tabs || (await browser.tabs.query({ windowId: currentWindow.id }));
        if (!currentTabs || currentTabs.length === 0) {
            const contextMenuProperties = await getContextMenuProperties();
            const menuIdsToDisable = contextMenuProperties
                .filter(
                    (m) =>
                        m.id !== 'TabClip' &&
                        m.id !== 'displayTabClipMenu' &&
                        m.type !== 'separator' &&
                        m.id?.startsWith('send'),
                )
                .map((m) => m.id);
            for (const id of menuIdsToDisable) await updateContextMenuState(id!, false);
            return;
        }

        const activeTab = currentTabs.find((tab) => tab.active);
        if (!activeTab || activeTab.id === undefined) return;

        const settings = await loadSettings();

        const isCurrentTabClipable = isTabClipable(activeTab, settings) && !isExtensionPage(activeTab);
        const clipableTabsInCurrentWindow = currentTabs.filter((t) => isTabClipable(t, settings));

        const sendCurrentTabMenuEnabled = isCurrentTabClipable;
        const sendTabsExceptThisMenuEnabled = clipableTabsInCurrentWindow.some((t) => t.id !== activeTab.id);
        const sendTabsToTheLeftMenuEnabled = clipableTabsInCurrentWindow.some((t) => t.index < activeTab.index);
        const sendTabsToTheRightMenuEnabled = clipableTabsInCurrentWindow.some((t) => t.index > activeTab.index);
        const sendAllTabsInCurrentWindowMenuEnabled = clipableTabsInCurrentWindow.length > 0;

        const allBrowserTabs = await browser.tabs.query({});
        const clipableTabsInOtherWindows = allBrowserTabs.filter(
            (t) => t.windowId !== activeTab.windowId && isTabClipable(t, settings),
        );
        const sendAllTabsInAllWindowsMenuEnabled =
            clipableTabsInOtherWindows.length > 0 ||
            (sendAllTabsInCurrentWindowMenuEnabled && allBrowserTabs.length > currentTabs.length);

        const contextMenuStates: Pair<string, boolean>[] = [
            ['sendCurrentTabMenu', sendCurrentTabMenuEnabled],
            ['sendAllTabsInAllWindowsMenu', sendAllTabsInAllWindowsMenuEnabled],
            ['sendTabsToTheLeftMenu', sendTabsToTheLeftMenuEnabled],
            ['sendTabsToTheRightMenu', sendTabsToTheRightMenuEnabled],
            ['sendTabsExceptThisMenu', sendTabsExceptThisMenuEnabled],
            ['sendAllTabsInCurrentWindowMenu', sendAllTabsInCurrentWindowMenuEnabled],
        ];

        await Promise.all(contextMenuStates.map(([menuId, status]) => updateContextMenuState(menuId, status)));
    }

    addTabAndWindowListeners(updateAllContextMenuStates);

    async function sendRefreshMessageToApp() {
        try {
            await browser.runtime.sendMessage({ event: 'TabGroupUpdate' });
        } catch (e) {
            // This error is common if the extension page/popup isn't open to receive.
            console.warn('Failed to send TabGroupUpdate message (possibly no listeners):', e);
        }
    }

    class TabGroupManager {
        private async clipAndCloseTabs(tabsToClip: Browser.tabs.Tab | Browser.tabs.Tab[], isBrowserGroup?: boolean) {
            // Assuming db.addTabGroup is for multiple tabs and db.addTab for single.
            // If db.addTabGroup can handle a single tab in an array, this can be simplified.

            if (!Array.isArray(tabsToClip)) {
                await db.addTab(tabsToClip);
                await browser.tabs.remove(tabsToClip.id!);
                await sendRefreshMessageToApp();
            } else if (tabsToClip.length > 0) {
                let group: TabGroup = { tabs_meta: tabsToClip };
                if (isBrowserGroup) {
                    const extraInfo = await browser.tabGroups.get(tabsToClip[0].groupId);
                    group = { ...group, is_browser_group: isBrowserGroup, name: extraInfo.title };
                }
                await db.addTabGroup(group);

                const tabIdsToRemove = tabsToClip.map((tab) => tab.id).filter((id) => id !== undefined);
                if (tabIdsToRemove.length > 0) {
                    await browser.tabs.remove(tabIdsToRemove);
                }
                await sendRefreshMessageToApp();
            }
        }

        addTabs = async (tabsToAdd: Browser.tabs.Tab[]) => {
            const settings = await loadSettings();

            // 过滤可 clip 的 tab
            const clipableTabs = tabsToAdd.filter((tab) => isTabClipable(tab, settings));

            // 按 groupId 分组
            const groupMap = new Map<number, Browser.tabs.Tab[]>();
            for (const tab of clipableTabs) {
                const groupId = tab.groupId ?? browser.tabGroups.TAB_GROUP_ID_NONE;
                if (!groupMap.has(groupId)) {
                    groupMap.set(groupId, []);
                }
                groupMap.get(groupId)!.push(tab);
            }

            // 用于存放默认组的 tabs（非浏览器分组 & 不完整浏览器分组）
            const defaultGroupTabs: Browser.tabs.Tab[] = [];

            for (const [groupId, groupTabs] of groupMap.entries()) {
                if (groupId === browser.tabGroups.TAB_GROUP_ID_NONE) {
                    // 非分组 tab 直接并入默认组
                    defaultGroupTabs.push(...groupTabs);
                } else {
                    // 查询当前浏览器分组的所有 tab
                    const allTabsInGroup = await browser.tabs.query({ groupId });
                    if (allTabsInGroup.length === groupTabs.length) {
                        // 完整的浏览器分组 → 单独 clip
                        await this.clipAndCloseTabs(groupTabs, true);
                    } else {
                        // 不完整的分组 → 并入默认组
                        defaultGroupTabs.push(...groupTabs);
                    }
                }
            }

            // 最后处理默认组（如果有）
            if (defaultGroupTabs.length > 0) {
                await this.clipAndCloseTabs(defaultGroupTabs);
            }
        };

        displayTabClip = async (_activeTab?: Browser.tabs.Tab) => {
            await redirectToExtensionPage();
        };

        sendCurrentTab = async (activeTab: Browser.tabs.Tab) => {
            const settings = await loadSettings();
            if (isTabClipable(activeTab, settings)) {
                await this.clipAndCloseTabs(activeTab);
            } else {
                // If current tab isn't clipable (e.g., it's the extension page itself, or a pinned tab not allowed)
                // still redirect to the page to show the UI.
                console.warn('Current tab is not clippable. Displaying TabClip page.');
                await redirectToExtensionPage();
            }
        };

        sendTabsExceptThis = async (activeTab: Browser.tabs.Tab) => {
            const allTabsInWindow = await browser.tabs.query({ windowId: activeTab.windowId });
            const tabsToClip = allTabsInWindow.filter((tab) => tab.id !== activeTab.id);
            await this.addTabs(tabsToClip);
        };

        sendAllTabsInCurrentWindow = async (activeTab: Browser.tabs.Tab) => {
            await redirectToExtensionPage(); // Redirect first for better perceived performance
            const allTabsInWindow = await browser.tabs.query({ windowId: activeTab.windowId });
            await this.addTabs(allTabsInWindow);
        };

        sendAllTabsInAllWindows = async (_activeTab?: Browser.tabs.Tab) => {
            await redirectToExtensionPage();
            const allTabsInAllWindow = await browser.tabs.query({});

            // Group by windowId
            const tabsByWindow = allTabsInAllWindow.reduce<Record<number, Browser.tabs.Tab[]>>((acc, tab) => {
                if (tab.windowId != null) {
                    if (!acc[tab.windowId]) {
                        acc[tab.windowId] = [];
                    }
                    acc[tab.windowId].push(tab);
                }
                return acc;
            }, {});

            for (const windowTabs of Object.values(tabsByWindow)) {
                await this.addTabs(windowTabs);
            }
        };

        sendTabsToTheLeft = async (activeTab: Browser.tabs.Tab) => {
            const allTabsInWindow = await browser.tabs.query({ windowId: activeTab.windowId });
            const tabsToClip = allTabsInWindow.filter((tab) => tab.index < activeTab.index);
            await this.addTabs(tabsToClip);
        };

        sendTabsToTheRight = async (activeTab: Browser.tabs.Tab) => {
            const allTabsInWindow = await browser.tabs.query({ windowId: activeTab.windowId });
            const tabsToClip = allTabsInWindow.filter((tab) => tab.index > activeTab.index);
            await this.addTabs(tabsToClip);
        };
    }

    const tabGroupManager = new TabGroupManager();

    type ContextMenuAction = (
        _activeTab: Browser.tabs.Tab,
        _clickData: Browser.contextMenus.OnClickData,
    ) => Promise<void>;

    function createContextMenuClickHandler(action: ContextMenuAction) {
        return async (clickData: Browser.contextMenus.OnClickData, tab?: Browser.tabs.Tab) => {
            // 'tab' is the tab where the context menu was clicked.
            // For 'all' contexts, 'tab' should nearly always be present.
            const activeTab = tab || (await browser.tabs.query({ active: true, currentWindow: true }))[0];
            if (activeTab) {
                await action(activeTab, clickData);
            } else {
                console.error('Context menu clicked but no active tab could be determined.', clickData);
            }
        };
    }

    const contextMenuActionMap: Record<string, ReturnType<typeof createContextMenuClickHandler>> = {
        displayTabClipMenu: createContextMenuClickHandler(tabGroupManager.displayTabClip),
        sendCurrentTabMenu: createContextMenuClickHandler(tabGroupManager.sendCurrentTab),
        sendTabsExceptThisMenu: createContextMenuClickHandler(tabGroupManager.sendTabsExceptThis),
        sendAllTabsInCurrentWindowMenu: createContextMenuClickHandler(tabGroupManager.sendAllTabsInCurrentWindow),
        sendAllTabsInAllWindowsMenu: createContextMenuClickHandler(tabGroupManager.sendAllTabsInAllWindows),
        sendTabsToTheLeftMenu: createContextMenuClickHandler(tabGroupManager.sendTabsToTheLeft),
        sendTabsToTheRightMenu: createContextMenuClickHandler(tabGroupManager.sendTabsToTheRight),
    };

    browser.contextMenus.onClicked.addListener(
        async (info: Browser.contextMenus.OnClickData, tab?: Browser.tabs.Tab) => {
            const menuId = String(info.menuItemId);
            const handler = contextMenuActionMap[menuId];

            if (handler) {
                await handler(info, tab);
            } else {
                console.warn(`No action matched for menuItemId: "${menuId}"`);
            }
        },
    );

    const browserAction = browser.action ?? browser.browserAction;
    if (browserAction && browserAction.onClicked) {
        browserAction.onClicked.addListener(async (tab: Browser.tabs.Tab) => {
            // 'tab' here is the active tab in the current window when the action icon is clicked.
            // This might be undefined if clicked in a context without a tab (e.g. Firefox's customize menu view)
            // However, for a normal click, 'tab' will be populated.
            if (tab && tab.id !== undefined) {
                await tabGroupManager.sendAllTabsInCurrentWindow(tab);
            } else {
                // Fallback: try to get the current tab if not provided by the event (rare for onClicked)
                const currentTabs = await browser.tabs.query({ active: true, currentWindow: true });
                if (currentTabs.length > 0) {
                    await tabGroupManager.sendAllTabsInCurrentWindow(currentTabs[0]);
                } else {
                    console.error('Browser action clicked, but no active tab found.');
                    // Optionally, just open the extension page as a fallback action
                    await redirectToExtensionPage();
                }
            }
        });
    }

    async function redirectToExtensionPage() {
        const extensionPageUrl = browser.runtime.getURL('/tabclip.html');
        const allTabs = await browser.tabs.query({});
        const existingExtensionTab = allTabs.find((tab) => tab.url === extensionPageUrl);

        try {
            if (existingExtensionTab && existingExtensionTab.id !== undefined) {
                if (existingExtensionTab.windowId !== undefined) {
                    await browser.windows.update(existingExtensionTab.windowId, { focused: true });
                }
                await browser.tabs.update(existingExtensionTab.id, { active: true, pinned: true }); // Ensure pinned
                await browser.tabs.move(existingExtensionTab.id, { index: 0 });
            } else {
                await browser.tabs.create({ url: extensionPageUrl, index: 0, pinned: true });
            }
            // No need to call sendRefreshMessageToApp here unless the page itself needs an immediate refresh
            // after being focused or created. The page should handle its own state on load.
        } catch (e) {
            console.error('Error redirecting to extension page:', e);
            // Fallback if pinning/moving fails
            if (!existingExtensionTab) {
                try {
                    await browser.tabs.create({ url: extensionPageUrl }); // Create unpinned
                } catch (createError) {
                    console.error('Fallback: Failed to create extension tab:', createError);
                }
            }
        }
    }

    // Initial setup when the background script loads (e.g., after install/enable)
    // onInstalled handles the very first setup. Subsequent loads (e.g. enabling extension)
    // might also benefit from ensuring menu states are correct.
    if (browser.runtime && typeof browser.runtime.getManifest === 'function') {
        // Check if script is running as an extension
        void updateAllContextMenuStates();
    }

    console.log('TabClip WXT Background Script Loaded.');

    // WXT typically uses an empty export or a main function for background scripts.
    // export default () => {
    //   console.log("WXT Background script main function executed (if used).");
    // };
    // Using top-level await and event listeners is common and works well.
});
