<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const emits = defineEmits(["exportLargeJsonFile"]);
const props = withDefaults(defineProps<{ isExporting: boolean, progress: number }>(), { isExporting: false, progress: 0 });
</script>

<template>
    <DropdownMenuItem @click="emits('exportLargeJsonFile')" :disabled="props.isExporting">
        <div class="flex items-center mr-auto gap-2">
            <span>{{ $t("moreOperations.dataOperations.exportGroups") }}</span>
            <span v-if="props.isExporting" class="text-sm text-muted-foreground">{{ props.progress.toFixed(0) }}%</span>
        </div>
        <Icon icon="radix-icons:download"></Icon>
    </DropdownMenuItem>
</template>

<style scoped></style>