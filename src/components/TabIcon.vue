<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useTabIcon } from '@/composables/useTabIcon';

const props = withDefaults(defineProps<{ tabUrl: string; useGoogleIcon?: boolean }>(), { useGoogleIcon: false });

const iconUrl = ref<string>('');

onMounted(async () => {
    iconUrl.value = (await useTabIcon(props.tabUrl, props.useGoogleIcon)) || '';
});
</script>

<template>
    <div
        class="inline-block h-4 w-4"
        :style="{
            backgroundImage: `url(${iconUrl})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
        }"
    ></div>
</template>
