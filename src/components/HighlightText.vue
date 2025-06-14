<script setup lang="ts">
const props = defineProps({
    // 容器元素的 HTML 标签，默认为 'div'
    tag: {
        type: String,
        default: 'div',
    },
    // 原始文本
    text: {
        type: String,
        default: '',
    },
    // 需要高亮的关键词
    keyword: {
        type: String,
        required: true,
    },
    // 针对链接 URL
    url: {
        type: String,
        default: '',
    },
});

// 辅助函数：转义正则表达式中的特殊字符
function escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& 表示匹配到的整个字符串
}

function getTextParts(text: string, keyword: string, url: string) {
    const parts: Array<{ text: string; highlight: boolean }> = [];

    // 如果没有文本或关键词，直接返回原始文本
    if ((!props.text && !props.url) || !props.keyword) {
        parts.push({ text: props.text, highlight: false });
        return parts;
    }

    const keywordRegex = new RegExp(`(${escapeRegExp(props.keyword)})`, 'i');

    if (keywordRegex.test(props.text)) {
        // 如果正文包含关键词则仅高亮显示关键词
        const rawParts = props.text.split(keywordRegex);
        rawParts.forEach((part) => {
            // 检查这个片段是否是我们要高亮的关键词
            if (part && part.toLowerCase() === props.keyword.toLowerCase()) {
                parts.push({ text: part, highlight: true });
            } else if (part) {
                parts.push({ text: part, highlight: false });
            }
        });
        return parts;
    }

    if (!!props.url && keywordRegex.test(props.url)) {
        // 如果仅 URL 包含关键词则高亮显示整个正文
        parts.push({ text: props.text, highlight: true });
        return parts;
    }

    // 正文和 URL 都不包含关键词则直接返回不高亮的正文
    parts.push({ text: props.text, highlight: false });
    return parts;
}

// 如后续有动态变化需求可改为 computed
const textParts = getTextParts(props.text, props.keyword, props.url);
</script>

<template>
    <component :is="tag">
        <template v-for="(part, index) in textParts" :key="index">
            <span v-if="part.highlight" class="highlight">
                {{ part.text }}
            </span>
            <template v-else>
                {{ part.text }}
            </template>
        </template>
    </component>
</template>

<style scoped>
.highlight {
    background-color: var(--color-hightlight-background);
    color: var(--color-hightlight-text);
}
</style>
