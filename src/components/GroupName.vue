<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';

import { Button } from '@/components/ui/button';

const props = defineProps<{ name: string | undefined }>();
const emits = defineEmits(['updateName']);
const inputValue = ref(props.name);
const isEditing = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const sizerRef = ref<HTMLElement | null>(null);
const inputWidth = ref(0);

const focusInput = () => {
    isEditing.value = true;

    if (inputValue.value) {
        inputRef.value?.focus();
    } else {
        nextTick(() => {
            setTimeout(() => {
                inputRef.value?.focus();
            }, 200);
        });
    }
};

const handleEnter = () => {
    isEditing.value = false;
    inputRef.value?.blur();
};

const handleFocus = () => {
    isEditing.value = true;
};

const handleBlur = () => {
    isEditing.value = false;
    emits('updateName', inputValue.value);
};

const updateWidth = () => {
    nextTick(() => {
        if (sizerRef.value) {
            inputWidth.value = sizerRef.value.offsetWidth;
        }
    });
};

watch([inputValue, isEditing], updateWidth);
onMounted(updateWidth);
</script>
<template>
    <div class="relative min-w-9 items-center">
        <span
            ref="sizerRef"
            class="invisible absolute max-w-56 min-w-9 whitespace-pre"
            :class="isEditing ? 'min-w-36 pr-2 pl-9' : inputValue ? 'pr-2 pl-9' : ''"
        >
            {{ inputValue }}
        </span>

        <input
            ref="inputRef"
            v-model="inputValue"
            type="text"
            :placeholder="$t('tabGroup.InputGroupName')"
            class="focus:placeholder:text-muted-foreground dark:bg-input/30 border-input md:text-sm,focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px],aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-9 min-w-9 rounded-md border bg-transparent py-1 text-base leading-9 shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            :class="[
                'transition-all duration-200 ease-in-out',
                'truncate overflow-hidden whitespace-nowrap',
                isEditing
                    ? 'visible min-w-36 pr-2 pl-9'
                    : inputValue
                      ? 'border-0 pl-9 !shadow-none dark:bg-transparent'
                      : 'invisible placeholder-transparent',
            ]"
            :style="{ width: inputWidth + 'px' }"
            @blur="handleBlur"
            @focus="handleFocus"
            @keyup.enter="handleEnter"
        />

        <span class="absolute inset-y-0 start-0 flex items-center justify-center">
            <Button
                variant="ghost"
                size="icon"
                :class="isEditing || inputValue ? 'over:bg-transparent hover:bg-transparent active:bg-transparent' : ''"
                @click="focusInput"
            >
                <Icon icon="radix-icons:input"></Icon>
            </Button>
        </span>
    </div>
</template>
