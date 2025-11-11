<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { TextCursorInputIcon } from 'lucide-vue-next';

import HighlightText from '@/components/HighlightText.vue';

const { t, locale } = useI18n();
const props = defineProps<{ name: string | undefined; searchText: string | undefined }>();
const emits = defineEmits(['updateName']);

const showInput = ref(false);
const inputValue = ref(props.name);
const isLocaleChanging = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const sizerRef = ref<HTMLSpanElement | null>(null); // 用于计算文本宽度的隐藏元素

const inputMinWidth = 118;
const inputMaxWidth = 38 * 4;
const contentWidth = ref(0);
const truncateText = computed(() => {
    return !showInput.value && contentWidth.value > inputMaxWidth;
});

const currentWidth = computed(() => {
    // 确保组件挂载后才计算宽度，避免首次渲染闪烁
    if (!contentWidth.value) return 'auto';

    // 编辑时保证输入框的最小宽度
    if (showInput.value) {
        return Math.max(contentWidth.value, inputMinWidth) + 'px';
    }
    return contentWidth.value + 'px';
});

// 计算文本实际渲染宽度
const updateWidth = () => {
    nextTick(() => {
        if (sizerRef.value) {
            contentWidth.value = sizerRef.value.offsetWidth;
        }
    });
};

const handleEnter = () => {
    inputRef.value?.blur();
};

const handleBlur = () => {
    emits('updateName', inputValue.value);
    showInput.value = false;
};

const handleClick = () => {
    showInput.value = true;
    nextTick(() => {
        setTimeout(() => {
            inputRef.value?.focus();
        }, 10);
    });
};

onMounted(() => {
    updateWidth();
});

watch([inputValue, showInput], updateWidth);

watch(locale, () => {
    isLocaleChanging.value = true;
    updateWidth();
    nextTick(() => {
        setTimeout(() => {
            isLocaleChanging.value = false;
        }, 200);
    });
});
</script>

<template>
    <div class="flex items-center gap-2">
        <TextCursorInputIcon class="size-4 shrink-0" />
        <div
            class="group flex max-w-38 items-center"
            :style="{ width: currentWidth }"
            :class="isLocaleChanging ? '' : 'transition-all duration-200 ease-in-out'"
        >
            <span ref="sizerRef" class="invisible absolute whitespace-pre" :class="{ truncate: !showInput }">
                {{ inputValue || t('tabGroup.unnamedGroup') }}
            </span>

            <input
                v-if="showInput"
                ref="inputRef"
                v-model="inputValue"
                name="groupName"
                :placeholder="t('tabGroup.inputGroupName')"
                class="text-muted-foreground placeholder-muted-foreground focus:border-b-foreground hover:border-b-foreground focus:placeholder-muted-foreground w-full items-center border-y border-transparent transition-colors duration-200 focus:outline-none"
                @keyup.enter="handleEnter"
                @blur="handleBlur"
            />
            <div v-else class="block w-full whitespace-nowrap" :class="{ truncate: truncateText }" @click="handleClick">
                <HighlightText
                    v-if="props.searchText && props.name?.toLocaleLowerCase().includes(props.searchText.toLowerCase())"
                    :keyword="props.searchText"
                    :text="props.name"
                    :class="{ truncate: truncateText }"
                />
                <template v-else>
                    {{ inputValue || t('tabGroup.unnamedGroup') }}
                </template>
            </div>
        </div>
    </div>
</template>
