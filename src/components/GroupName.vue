<script setup lang="ts">
import { ref, nextTick } from "vue";
import { Icon } from '@iconify/vue';
import { Button } from "@/components/ui/button";

const props = defineProps<{ name: string | undefined }>();
const emits = defineEmits(["updateName"]);
const inputValue = ref(props.name);
const isEditing = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const focusInput = () => {
    isEditing.value = true;

    if (inputValue.value) {
        inputRef.value?.focus();
    } else {
        nextTick(() => {
            const handleTransitionEnd = () => {
                inputRef.value?.focus();
                inputRef.value?.removeEventListener('transitionend', handleTransitionEnd);
            };
            inputRef.value?.addEventListener('transitionend', handleTransitionEnd);
        })
    }
}

const handleEnter = () => {
    isEditing.value = false;
    inputRef.value?.blur();
}

const handleFocus = () => {
    isEditing.value = true;
}

const handleBlur = () => {
    isEditing.value = false;
    emits("updateName", inputValue.value);
}
</script>
<template>
    <div class="relative items-center">
        <input type="text" placeholder="Input Name" ref="inputRef"
            class='focus:placeholder:text-muted-foreground dark:bg-input/30 border-input flex leading-9 h-9 min-w-0 rounded-md border bg-transparent py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm,focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px],aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
            :class="[
                'transition-all duration-200 ease-in-out',
                isEditing ? 'visible w-auto pl-9 pr-3 min-w-0' : inputValue ? 'border-0 !shadow-none pl-9' : 'w-9 invisible placeholder-transparent',
            ]" @blur="handleBlur" @keyup.enter="handleEnter" v-model="inputValue" @focus="handleFocus"/>
        <span class="absolute start-0 inset-y-0 flex items-center justify-center">
            <Button variant="ghost" size="icon" @click="focusInput"
                :class="isEditing || inputValue ? 'over:bg-transparent hover:bg-transparent active:bg-transparent' : ''">
                <Icon icon="radix-icons:input"></Icon>
            </Button>
        </span>
    </div>
</template>