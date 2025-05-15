<script setup lang="ts">
import { computed, type Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Icon } from '@iconify/vue';
import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
import { CalendarIcon } from '@radix-icons/vue';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils.ts';
import { type SearchConditions, useSearchStore } from '@/store/search.ts';

const { t, locale } = useI18n();
const df = computed(() => new DateFormatter(locale.value, { dateStyle: 'long' }));
const searched = ref(false);
const searchStore = useSearchStore();

const searchConditions: Ref<SearchConditions> = ref({
    text: undefined,
    startTime: undefined,
    endTime: undefined,
});

function resetSearchConditions() {
    searchConditions.value = {
        text: undefined,
        startTime: undefined,
        endTime: undefined,
    };
}

const doSearch = () => {
    searchStore.updateSearchConditions(searchConditions.value);
    searched.value = !searchConditionsIsEmpty.value;
};

const doReset = () => {
    searchStore.resetSearchConditions();
    resetSearchConditions();
    searched.value = false;
};

function formatDateValue(dateValue?: DateValue, formatStr?: string): string | undefined {
    if (!dateValue) {
        return undefined;
    }
    const jsDate = new Date(dateValue.year, dateValue.month - 1, dateValue.day);
    return format(jsDate, formatStr || 'yyyy-MM-dd');
}

const inputPlaceholder = computed(() => {
    const defaultPlaceholder = t('search.textPlaceholder');
    const conditions = searchConditions.value;
    if (!conditions.text && !popoverConditionsIsEmpty.value) {
        const formatStr = 'yyyy/MM/dd';
        if (!conditions.endTime) {
            return `${formatDateValue(conditions.startTime, formatStr)}-`;
        } else if (!conditions.startTime) {
            return `-${formatDateValue(conditions.endTime, formatStr)}`;
        }
        return `${formatDateValue(conditions.startTime, formatStr)}-${formatDateValue(conditions.endTime, formatStr)}`;
    }
    return defaultPlaceholder;
});

const searchConditionsIsEmpty = computed(() => {
    const conditions = searchConditions.value;
    return !conditions.text && !conditions.startTime && !conditions.endTime;
});

const popoverConditionsIsEmpty = computed(() => {
    const conditions = searchConditions.value;
    return !conditions.startTime && !conditions.endTime;
});

const isPassivelyRefreshing = ref(false);

watch(
    searchConditions,
    () => {
        if (!isPassivelyRefreshing.value && searched.value) {
            searchStore.resetSearchConditions();
            searched.value = false;
        }
        isPassivelyRefreshing.value = false;
    },
    { deep: true },
);

watch(
    () => searchStore.passivelyRefreshed,
    () => {
        isPassivelyRefreshing.value = true;
        searchConditions.value = {
            text: searchStore.searchConditions.text,
            startTime: searchStore.searchConditions.startTime,
            endTime: searchStore.searchConditions.endTime,
        };
        searched.value = true;
    },
);
</script>

<template>
    <div class="flex items-center space-x-4">
        <div class="relative items-center">
            <Input
                id="search"
                v-model="searchConditions.text"
                type="text"
                :placeholder="inputPlaceholder"
                class="w-80 pr-16"
                @keyup.enter="doSearch"
            />
            <Popover>
                <div class="absolute inset-y-0 end-0 text-gray-300">
                    <Button
                        v-show="!searchConditionsIsEmpty"
                        variant="icon"
                        class="text-muted-foreground transition-opacity duration-500 ease-in-out has-[>svg]:px-0"
                        :class="cn(searchConditionsIsEmpty ? 'pointer-events-none opacity-0' : 'opacity-100')"
                        @click="resetSearchConditions"
                    >
                        <Icon icon="radix-icons:cross-circled"></Icon>
                    </Button>
                    <PopoverTrigger as-child>
                        <Button
                            variant="icon"
                            :class="cn('px-2.5', !popoverConditionsIsEmpty && 'text-muted-foreground')"
                        >
                            <Icon icon="radix-icons:mix"></Icon>
                        </Button>
                    </PopoverTrigger>
                </div>
                <PopoverContent :side-offset="8" align="end" class="w-auto">
                    <div class="grid gap-4">
                        <div class="space-y-2">
                            <h4 class="leading-none font-medium">
                                {{ $t('search.popoverTitle') }}
                            </h4>
                            <p class="text-muted-foreground text-sm">
                                {{ $t('search.popoverDesc') }}
                            </p>
                        </div>
                        <div class="grid gap-2">
                            <div class="flex items-center gap-4">
                                <div class="mr-auto">
                                    <label>{{ $t('search.startTime') }}</label>
                                </div>
                                <div class="flex gap-4">
                                    <div class="min-w-48">
                                        <Popover>
                                            <PopoverTrigger as-child>
                                                <Button
                                                    variant="outline"
                                                    :class="
                                                        cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !searchConditions.startTime && 'text-muted-foreground',
                                                        )
                                                    "
                                                >
                                                    <CalendarIcon class="mr-2 h-4 w-4" />
                                                    {{
                                                        searchConditions.startTime
                                                            ? df.format(
                                                                  searchConditions.startTime.toDate(getLocalTimeZone()),
                                                              )
                                                            : $t('search.timePlaceholder')
                                                    }}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent class="w-auto p-0">
                                                <Calendar
                                                    v-model="searchConditions.startTime"
                                                    :max-value="
                                                        searchConditions.endTime ? searchConditions.endTime : undefined
                                                    "
                                                    :locale="locale"
                                                    initial-focus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        class="px-2 text-gray-500 hover:text-gray-700"
                                        @click="
                                            () => {
                                                searchConditions.startTime = undefined;
                                            }
                                        "
                                    >
                                        <Icon icon="radix-icons:trash"></Icon>
                                    </Button>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="mr-auto">
                                    <label>{{ $t('search.endTime') }}</label>
                                </div>
                                <div class="flex gap-4">
                                    <div class="min-w-48">
                                        <div class="min-w-48">
                                            <Popover>
                                                <PopoverTrigger as-child>
                                                    <Button
                                                        variant="outline"
                                                        :class="
                                                            cn(
                                                                'w-full justify-start text-left font-normal',
                                                                !searchConditions.endTime && 'text-muted-foreground',
                                                            )
                                                        "
                                                    >
                                                        <CalendarIcon class="mr-2 h-4 w-4" />
                                                        {{
                                                            searchConditions.endTime
                                                                ? df.format(
                                                                      searchConditions.endTime.toDate(
                                                                          getLocalTimeZone(),
                                                                      ),
                                                                  )
                                                                : $t('search.timePlaceholder')
                                                        }}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent class="w-auto p-0">
                                                    <Calendar
                                                        v-model="searchConditions.endTime"
                                                        :min-value="
                                                            searchConditions.startTime
                                                                ? searchConditions.startTime
                                                                : undefined
                                                        "
                                                        :locale="locale"
                                                        initial-focus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        class="px-2 text-gray-500 hover:text-gray-700"
                                        @click="
                                            () => {
                                                searchConditions.endTime = undefined;
                                            }
                                        "
                                    >
                                        <Icon icon="radix-icons:trash"></Icon>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
        <Button v-if="!searched" @click="doSearch">{{ $t('search.buttonSearch') }}</Button>
        <Button v-else variant="destructive" @click="doReset">
            <span class="invisible">{{ $t('search.buttonSearch') }}</span>
            <span class="absolute">{{ $t('search.buttonCancel') }}</span>
        </Button>
    </div>
</template>

<style scoped></style>
