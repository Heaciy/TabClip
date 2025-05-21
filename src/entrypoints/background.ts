// entrypoints/background.ts (or your chosen WXT background script location)

// WXT provides the 'browser' global from webextension-polyfill
// No explicit import for 'browser' is usually needed in WXT entrypoints.

// Adjust import paths based on your WXT project structure
// e.g., if 'database' and 'store/settings' are in a 'shared' or 'utils' folder
import { db } from '@/database';
import { loadSettings, type Settings } from '@/store/settings';

const i18n = (messageName: any, substitutions?: string | string[], defaultValue?: string): string => {
    const translation = browser.i18n.getMessage(messageName, substitutions);
    if (translation) return translation;

    console.warn(`No translation available for: ${messageName}`);
    return defaultValue ?? messageName;
};

export default defineBackground(() => {
    const contextMenuProperties: Array<Browser.contextMenus.CreateProperties> = [
        {
            id: 'TabClip',
            title: 'TabClip', // Consider i18n: i18n('extensionName', undefined, 'TabClip')
            contexts: ['all'],
        },
        {
            parentId: 'TabClip',
            id: 'displayTabClipMenu',
            title: i18n('displayTabClip', undefined, 'Display TabClip Interface'),
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
            title: i18n('sendAllTabsInCurrentWindow', undefined, 'Clip All Tabs in Current Window'),
            contexts: ['all'],
        },
        {
            parentId: 'TabClip',
            id: 'sendAllTabsInAllWindowsMenu',
            title: i18n('sendAllTabsInAllWindows', undefined, 'Clip All Tabs in All Windows'),
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
            title: i18n('sendCurrentTab', undefined, 'Clip Current Tab'),
            contexts: ['all'],
        },
        {
            parentId: 'TabClip',
            id: 'sendTabsExceptThisMenu',
            title: i18n('sendTabsExceptThis', undefined, 'Clip Tabs Except This'),
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
            title: i18n('sendTabsToTheLeft', undefined, 'Clip Tabs to the Left'),
            contexts: ['all'],
        },
        {
            parentId: 'TabClip',
            id: 'sendTabsToTheRightMenu',
            title: i18n('sendTabsToTheRight', undefined, 'Clip Tabs to the Right'),
            contexts: ['all'],
        },
    ];

    async function setupContextMenus() {
        // WXT might handle declarative context menus in wxt.config.ts in the future,
        // but programmatic creation is fully supported.
        // For Firefox, it's good practice to remove existing menus before recreating,
        // especially during development to avoid errors if IDs conflict.
        await browser.contextMenus.removeAll();
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

        const settings = await loadSettings();
        if (settings.isStartupPage && (details.reason === 'install' || details.reason === 'update')) {
            await redirectToExtensionPage();
        }
    });

    function addTabAndWindowListeners(callback: () => void | Promise<void>) {
        const tabEvents: Array<Browser.events.Event<(_arg1?: any, _arg2?: any, _arg3?: any) => void>> = [
            browser.tabs.onCreated,
            browser.tabs.onUpdated,
            browser.tabs.onMoved,
            browser.tabs.onRemoved,
            // browser.tabs.onReplaced, // Deprecated in MV3; onUpdated generally covers this.
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
        } catch (error) {
            // This can happen if the menu was somehow removed or not created.
            console.warn(`Could not update context menu state for "${menuId}":`, error);
        }
    }

    function isExtensionPage(tab: Browser.tabs.Tab): boolean {
        const url = tab.url || tab.pendingUrl;
        // Use browser.runtime.getURL to create the base URL for comparison
        return url ? url.startsWith(browser.runtime.getURL('')) && url.includes('tabclip.html') : false;
    }

    type Pair<T, U> = [T, U];

    function checkPinTabStatus(tab: Browser.tabs.Tab, settings: Settings): boolean {
        return !tab.pinned || settings.storePinnedTabs;
    }

    function isTabClipable(tab: Browser.tabs.Tab, settings: Settings): boolean {
        return !isExtensionPage(tab) && checkPinTabStatus(tab, settings);
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
        } catch (err) {
            // This error is common if the extension page/popup isn't open to receive.
            console.warn('Failed to send TabGroupUpdate message (possibly no listeners):', err);
        }
    }

    class TabGroupManager {
        private async clipAndCloseTabs(tabsToClip: Browser.tabs.Tab[]) {
            if (tabsToClip.length === 0) return;

            // Assuming db.addTabGroup is for multiple tabs and db.addTab for single.
            // If db.addTabGroup can handle a single tab in an array, this can be simplified.
            if (tabsToClip.length > 1) {
                await db.addTabGroup({ tabs_meta: tabsToClip });
            } else if (tabsToClip.length === 1) {
                await db.addTab(tabsToClip[0]); // Or adjust db.addTabGroup to handle this.
            }

            const tabIdsToRemove = tabsToClip.map((tab) => tab.id).filter((id) => id !== undefined) as number[];
            if (tabIdsToRemove.length > 0) {
                await browser.tabs.remove(tabIdsToRemove);
            }
            await sendRefreshMessageToApp();
        }

        addTabs = async (tabsToAdd: Browser.tabs.Tab[]) => {
            const settings = await loadSettings();
            const clipableTabs = tabsToAdd.filter((tab) => isTabClipable(tab, settings));
            await this.clipAndCloseTabs(clipableTabs);
        };

        displayTabClip = async (_activeTab?: Browser.tabs.Tab) => {
            await redirectToExtensionPage();
        };

        sendCurrentTab = async (activeTab: Browser.tabs.Tab) => {
            const settings = await loadSettings();
            if (isTabClipable(activeTab, settings)) {
                await this.clipAndCloseTabs([activeTab]);
            } else {
                // If current tab isn't clipable (e.g., it's the extension page itself, or a pinned tab not allowed)
                // still redirect to the page to show the UI.
                console.warn('Current tab is not clippable. Displaying TabClip page.');
                await redirectToExtensionPage();
            }
        };

        sendTabsExceptThis = async (activeTab: Browser.tabs.Tab) => {
            const allTabsInWindow = await browser.tabs.query({ windowId: activeTab.windowId });
            const tabsToClip = allTabsInWindow.filter((_tab) => _tab.id !== activeTab.id);
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
            await this.addTabs(allTabsInAllWindow);
        };

        sendTabsToTheLeft = async (activeTab: Browser.tabs.Tab) => {
            const allTabsInWindow = await browser.tabs.query({ windowId: activeTab.windowId });
            const tabsToClip = allTabsInWindow.filter((_tab) => _tab.index < activeTab.index);
            await this.addTabs(tabsToClip);
        };

        sendTabsToTheRight = async (activeTab: Browser.tabs.Tab) => {
            const allTabsInWindow = await browser.tabs.query({ windowId: activeTab.windowId });
            const tabsToClip = allTabsInWindow.filter((_tab) => _tab.index > activeTab.index);
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
            console.log('Browser action clicked', tab);
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

    browser.runtime.onStartup.addListener(async () => {
        // Menus should be recreated by onInstalled if needed, but state update is good.
        await updateAllContextMenuStates();
        const settings = await loadSettings();
        if (settings.isStartupPage) {
            await redirectToExtensionPage();
        }
    });

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
        } catch (error) {
            console.error('Error redirecting to extension page:', error);
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
        updateAllContextMenuStates();
    }

    console.log('TabClip WXT Background Script Loaded.');

    // WXT typically uses an empty export or a main function for background scripts.
    // export default () => {
    //   console.log("WXT Background script main function executed (if used).");
    // };
    // Using top-level await and event listeners is common and works well.
});
