<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';

import { Button } from '@/components/ui/button';

const visible = ref(false);

const toggleVisibility = () => {
    visible.value = window.scrollY > window.innerHeight / 2;
};

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
    window.addEventListener('scroll', toggleVisibility);
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', toggleVisibility);
});
</script>

<template>
    <Button
        variant="outline"
        size="icon"
        class="fixed right-8 bottom-8 transition-opacity duration-300 ease-in-out"
        :class="visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'"
        @click="scrollToTop"
    >
        <Icon icon="radix-icons:arrow-up"></Icon>
    </Button>
</template>
