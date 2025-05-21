let preloadPromise: Promise<void> | null = null;
let defaultIconBuffer: ArrayBuffer | null = null;

// 预加载默认地球图标
async function preloadDefaultIcon() {
    if (preloadPromise) return preloadPromise;

    preloadPromise = (async () => {
        const fakeUrl = new URL(chrome.runtime.getURL('/_favicon/'));
        fakeUrl.searchParams.set('pageUrl', 'chrome://newtab/');
        fakeUrl.searchParams.set('size', '32');

        try {
            const res = await fetch(fakeUrl.toString());
            const blob = await res.blob();
            defaultIconBuffer = await blob.arrayBuffer();
        } catch (e) {
            console.error('Failed to preload default favicon', e);
        }
    })();

    return preloadPromise;
}

// 获取 Chrome 内置 favicon 接口
function getChromeFaviconUrl(url: string, withPath: boolean = false) {
    const parsed = new URL(url);
    const baseUrl = withPath ? parsed.toString() : `${parsed.protocol}//${parsed.hostname}`;

    const faviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
    faviconUrl.searchParams.set('pageUrl', baseUrl);
    faviconUrl.searchParams.set('size', '32');
    return faviconUrl.toString();
}

// 备用的 Google favicon 地址
function getFallbackFaviconUrl(url: string) {
    const parsed = new URL(url);
    const baseUrl = `${parsed.protocol}//${parsed.hostname}`;
    return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${baseUrl}`;
}

// 比对两个 ArrayBuffer 是否相等
function isArrayBufferEqual(buf1: ArrayBuffer, buf2: ArrayBuffer) {
    if (buf1.byteLength !== buf2.byteLength) return false;
    const view1 = new Uint8Array(buf1);
    const view2 = new Uint8Array(buf2);
    for (let i = 0; i < view1.length; i++) {
        if (view1[i] !== view2[i]) return false;
    }
    return true;
}

// 图标缓存
const iconCache = new Map<string, string>();

// 主入口
export async function useTabIcon(url: string, useGoogleIcon: boolean = false): Promise<string> {
    // 如果是构建 Firefox 版本，直接返回空字符串
    if (import.meta.env.FIREFOX) {
        if (!useGoogleIcon) {
            return './global.png';
        }
        return getFallbackFaviconUrl(url);
    } else {
        if (!useGoogleIcon) {
            return getChromeFaviconUrl(url, true);
        }

        await preloadDefaultIcon();

        if (iconCache.has(url)) {
            return iconCache.get(url)!;
        }

        const chromeFaviconUrl = getChromeFaviconUrl(url);

        try {
            const res = await fetch(chromeFaviconUrl);
            const buf = await res.arrayBuffer();

            if (defaultIconBuffer && isArrayBufferEqual(buf, defaultIconBuffer)) {
                // 是地球，换用备用 favicon
                const fallback = getFallbackFaviconUrl(url);
                iconCache.set(url, fallback);
                return fallback;
            } else {
                // 正常图标
                iconCache.set(url, chromeFaviconUrl);
                return chromeFaviconUrl;
            }
        } catch (e) {
            console.error('Failed to fetch tab icon', e);
            const fallback = getFallbackFaviconUrl(url);
            iconCache.set(url, fallback);
            return fallback;
        }
    }
}
