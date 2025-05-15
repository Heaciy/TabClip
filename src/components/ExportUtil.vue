<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

const emits = defineEmits(['exportLargeJsonFile']);
const props = withDefaults(defineProps<{ isExporting?: boolean; progress?: number }>(), {
    isExporting: false,
    progress: 0,
});
</script>

<template>
    <DropdownMenuItem :disabled="props.isExporting" @click="emits('exportLargeJsonFile')">
        <div class="mr-auto flex items-center gap-2">
            <span>{{ $t('moreOperations.dataOperations.exportGroups') }}</span>
            <span v-if="props.isExporting" class="text-muted-foreground text-sm">{{ props.progress.toFixed(0) }}%</span>
        </div>
        <Icon icon="radix-icons:download"></Icon>
    </DropdownMenuItem>
</template>

<style scoped></style>
