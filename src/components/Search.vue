<script setup lang="ts">
import { computed, ref, watch, type Ref } from "vue";
import { cn } from "@/lib/utils.ts";
import { Icon } from "@iconify/vue";
import { format } from 'date-fns';
import { DateFormatter, getLocalTimeZone, type DateValue } from "@internationalized/date";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "@radix-icons/vue";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { type SearchConditions, useSearchStore } from "@/store/search.ts";

const df = new DateFormatter("en-US", { dateStyle: "long" });
const searched = ref(false);
const searchStore = useSearchStore();

const searchConditions: Ref<SearchConditions> = ref({
    text: undefined,
    startTime: undefined,
    endTime: undefined
})

function resetSearchConditions() {
    searchConditions.value = {
        text: undefined,
        startTime: undefined,
        endTime: undefined,
    }
}

const doSearch = () => {
    searchStore.updateSearchConditions(searchConditions.value);
    searched.value = !searchConditionsIsEmpty.value;
}

const doReset = () => {
    searchStore.resetSearchConditions();
    resetSearchConditions()
    searched.value = false;
}

function formatDateValue(dateValue?: DateValue, formatStr?: string): string | undefined {
    if (!dateValue) {
        return undefined;
    }
    const jsDate = new Date(dateValue.year, dateValue.month - 1, dateValue.day);
    return format(jsDate, formatStr || 'yyyy-MM-dd');
}

const inputPlaceholder = computed(() => {
    const defaultPlaceholder = "Search";
    const conditions = searchConditions.value;
    if (!conditions.text && !popoverConditionsIsEmpty.value) {
        const formatStr = "yyyy/MM/dd";
        if (!conditions.endTime) {
            return `${formatDateValue(conditions.startTime, formatStr)}-`;
        } else if (!conditions.startTime) {
            return `-${formatDateValue(conditions.endTime, formatStr)}`;
        }
        return `${formatDateValue(conditions.startTime, formatStr)}-${formatDateValue(conditions.endTime, formatStr)}`
    }
    return defaultPlaceholder;
})

const searchConditionsIsEmpty = computed(() => {
    const conditions = searchConditions.value;
    return !conditions.text && !conditions.startTime && !conditions.endTime;
})

const popoverConditionsIsEmpty = computed(() => {
    const conditions = searchConditions.value;
    return !conditions.startTime && !conditions.endTime;
})

watch(searchConditions, (_newSearchConditions) => {
    if (searched.value) {
        searchStore.resetSearchConditions();
        searched.value = false;
    }
}, { deep: true })
</script>

<template>
    <div class="flex items-center space-x-4">
        <div class="relative items-center">
            <Input id="search" type="text" :placeholder="inputPlaceholder" class="w-80 pr-16"
                v-model="searchConditions.text" @keyup.enter="doSearch" />
            <Popover>
                <div class="absolute end-0 inset-y-0 text-gray-300">
                    <Button variant="icon"
                        class="has-[>svg]:px-0 text-muted-foreground transition-opacity duration-500 ease-in-out"
                        :class="cn(searchConditionsIsEmpty ? 'opacity-0 pointer-events-none' : 'opacity-100')"
                        v-show="!searchConditionsIsEmpty" @click="resetSearchConditions">
                        <Icon icon="radix-icons:cross-circled"></Icon>
                    </Button>
                    <PopoverTrigger as-child>
                        <Button variant="icon"
                            :class="cn('px-2.5', !popoverConditionsIsEmpty && 'text-muted-foreground')">
                            <Icon icon="radix-icons:mix"></Icon>
                        </Button>
                    </PopoverTrigger>
                </div>
                <PopoverContent :side-offset="8" align="end" class="w-auto">
                    <div class="grid gap-4">
                        <div class="space-y-2">
                            <h4 class="font-medium leading-none">
                                Search
                            </h4>
                            <p class="text-sm text-muted-foreground">
                                Set more query conditions.
                            </p>
                        </div>
                        <div class="grid gap-2">
                            <div class="flex items-center gap-4">
                                <div class="mr-auto"><label>Start Time</label></div>
                                <div class="flex gap-4">
                                    <div class="min-w-48">
                                        <Popover>
                                            <PopoverTrigger as-child>
                                                <Button variant="outline"
                                                    :class="cn('justify-start text-left font-normal w-full', !searchConditions.startTime && 'text-muted-foreground',)">
                                                    <CalendarIcon class="mr-2 h-4 w-4" />
                                                    {{
                                                        searchConditions.startTime
                                                            ? df.format(searchConditions.startTime.toDate(getLocalTimeZone()))
                                                            : "Pick a date"
                                                    }}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent class="w-auto p-0">
                                                <Calendar v-model="searchConditions.startTime"
                                                    :max-value="searchConditions.endTime ? searchConditions.endTime : undefined"
                                                    initial-focus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <Button variant="outline" size="icon" class="px-2 text-gray-500 hover:text-gray-700"
                                        @click="() => { searchConditions.startTime = undefined }">
                                        <Icon icon="radix-icons:trash"></Icon>
                                    </Button>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="mr-auto"><label>End Time</label></div>
                                <div class="flex gap-4">
                                    <div class="min-w-48">
                                        <div class="min-w-48">
                                            <Popover>
                                                <PopoverTrigger as-child>
                                                    <Button variant="outline"
                                                        :class="cn('justify-start text-left font-normal w-full', !searchConditions.endTime && 'text-muted-foreground',)">
                                                        <CalendarIcon class="mr-2 h-4 w-4" />
                                                        {{
                                                            searchConditions.endTime
                                                                ? df.format(searchConditions.endTime.toDate(getLocalTimeZone()))
                                                                : "Pick a date"
                                                        }}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent class="w-auto p-0">
                                                    <Calendar v-model="searchConditions.endTime"
                                                        :min-value="searchConditions.startTime ? searchConditions.startTime : undefined"
                                                        initial-focus />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="icon" class="px-2 text-gray-500 hover:text-gray-700"
                                        @click="() => { searchConditions.endTime = undefined }">
                                        <Icon icon="radix-icons:trash"></Icon>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
        <Button v-if="!searched" @click="doSearch">Search</Button>
        <Button v-else @click="doReset" variant="destructive">
            <span class="invisible">Search</span>
            <span class="absolute">Cancel</span>
        </Button>
    </div>
</template>

<style scoped></style>