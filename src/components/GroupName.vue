<script setup lang="ts">
import {ref, nextTick, watch, onMounted} from "vue";
import {Icon} from "@iconify/vue";
import {Button} from "@/components/ui/button";

const props = defineProps<{ name: string | undefined }>();
const emits = defineEmits(["updateName"]);
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

const updateWidth = () => {
    nextTick(() => {
        if (sizerRef.value) {
            inputWidth.value = sizerRef.value.offsetWidth
        }
    })
}

watch([inputValue, isEditing], updateWidth);
onMounted(updateWidth);
</script>
<template>
    <div class="relative items-center min-w-9">
        <span ref="sizerRef"
              class="invisible absolute whitespace-pre max-w-56 min-w-9"
              :class="isEditing ? 'pl-9 pr-2 min-w-36' : inputValue? 'pl-9 pr-2' : ''">
            {{ inputValue }}
        </span>

        <input type="text" ref="inputRef" v-model="inputValue" :placeholder="$t('tabGroup.InputGroupName')"
               class='focus:placeholder:text-muted-foreground dark:bg-input/30 border-input flex leading-9 h-9 min-w-9 rounded-md border bg-transparent py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm,focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px],aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
               :class="[
                   'transition-all duration-200 ease-in-out',
                   'truncate whitespace-nowrap overflow-hidden',
                   isEditing ? 'visible pl-9 pr-2 min-w-36' : inputValue ? 'border-0 !shadow-none pl-9 dark:bg-transparent' : 'invisible placeholder-transparent',
               ]"
               :style="{ width: inputWidth + 'px' }"
               @blur="handleBlur"
               @focus="handleFocus"
               @keyup.enter="handleEnter"
        />

        <span class="absolute start-0 inset-y-0 flex items-center justify-center">
            <Button variant="ghost" size="icon" @click="focusInput"
                    :class="isEditing || inputValue ? 'over:bg-transparent hover:bg-transparent active:bg-transparent' : ''">
                <Icon icon="radix-icons:input"></Icon>
            </Button>
        </span>
    </div>
</template>