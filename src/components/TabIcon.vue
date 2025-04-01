<script setup lang="ts">
const props = defineProps<{ tabUrl: string }>()


function getIconFromChrome(url: string): string | null {
    const src = new URL(chrome.runtime.getURL("/_favicon/"));
    src.searchParams.set("pageUrl", url)
    src.searchParams.set("size", "32")
    return src.toString()
}

function getUncachedIconStyle(url: string, iconSize: number = 16) {
    return {
        display: "inline-block",
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundImage: `url(${getIconFromChrome(url)})`,
    }
}
</script>

<template>
    <div :style="getUncachedIconStyle(props.tabUrl)"></div>
</template>