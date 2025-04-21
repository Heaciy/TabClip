<script setup lang="ts">
import {ref, provide, watch, onBeforeMount, computed} from 'vue';
import {useColorMode} from '@vueuse/core';
import {parseDate} from '@internationalized/date';
import {useI18n} from "vue-i18n";

import {use} from 'echarts/core';
import {CanvasRenderer} from 'echarts/renderers';
import {HeatmapChart} from 'echarts/charts';
import {TitleComponent, TooltipComponent, CalendarComponent, VisualMapComponent} from 'echarts/components';
import VChart, {THEME_KEY} from 'vue-echarts';

import {Icon} from "@iconify/vue";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {
    Drawer,
    DrawerTrigger,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerContent,
    DrawerFooter,
    DrawerClose
} from '@/components/ui/drawer'

import {useSearchStore} from "@/store/search.ts";
import {db, getDateRange, type HeatmapData} from "@/database.ts";

const {locale} = useI18n();
const searchStore = useSearchStore();
const mode = useColorMode();
use([CanvasRenderer, HeatmapChart, TitleComponent, TooltipComponent, CalendarComponent, VisualMapComponent]);
provide(THEME_KEY, mode);


const heatmapYear = ref(-1);
const heatmapType = ref('groups');
const heatmapData = ref<HeatmapData | null>(null);
const option = ref({});
const langDayLabelMap = new Map<string, Array<string>>(Object.entries({
    "zh": ["", "周一", "", "周三", "", "周五", ""],
    "en": ['', 'Mon', '', 'Wen', '', 'Fri  ', '']
}));

const doSearch = (params: any) => {
    if (params && params.data && params.data[0]) {
        const dateStr = params.data[0];
        searchStore.resetSearchConditions();
        searchStore.updateSearchConditions({
            startTime: parseDate(dateStr),
            endTime: parseDate(dateStr),
            starredOnly: false,
        }, true)
    }
}

const updateChart = () => {
    if (!heatmapData.value) return;

    const seriesData = heatmapType.value === 'groups'
        ? heatmapData.value.date_list.map((value, index) => [value, heatmapData.value!.group_num_list[index]])
        : heatmapData.value.date_list.map((value, index) => [value, heatmapData.value!.tab_num_list[index]]);

    const visualMapMin = heatmapType.value === 'groups' ? heatmapData.value.group_min : heatmapData.value.tab_min;
    const visualMapMax = heatmapType.value === 'groups' ? heatmapData.value.group_max : heatmapData.value.tab_max;

    option.value = {
        backgroundColor: '',
        title: {
            show: false,
        },
        tooltip: {
            formatter: function (params: { value: string[]; }) {
                return params.value[0] + ' : ' + params.value[1]
            }
        },
        visualMap: {
            show: false,
            inRange: {
                color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127', '#196127']
            },
            // type: 'piecewise',
            min: visualMapMin,
            max: visualMapMax,
            orient: 'horizontal',
            left: 'left',
            top: 'top'
        },
        calendar: {
            top: 24,
            left: 36,
            cellSize: ['auto', 13],
            range: getDateRange(heatmapYear.value),
            splitLine: true,
            itemStyle: {
                // color: '#ccc',
                borderWidth: 0.5,
                borderColor: '#fff'
            },
            dayLabel: {
                nameMap: computed(() => langDayLabelMap.get(locale.value)),
            },
            yearLabel: {show: false},
        },
        series: {
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: seriesData,
        }
    };
}


const fetchHeatmapData = async (year?: number) => {
    heatmapData.value = await db.heatmap(year);
    updateChart();
}

watch(heatmapType, () => {
    updateChart();
});

watch(heatmapYear, async (newYear) => {
    await fetchHeatmapData(newYear);
});

onBeforeMount(async () => {
    await fetchHeatmapData();
})

const handleOpenChange = async (open: boolean) => {
    if (open) {
        if (heatmapYear.value == -1) {
            await fetchHeatmapData(heatmapYear.value);
        } else {
            heatmapYear.value = -1;
        }
    }
}
</script>

<template>
    <Drawer v-on:update:open="handleOpenChange">
        <DrawerTrigger as-child>
            <Button variant="ghost" size="icon">
                <Icon icon="lucide:chart-column"></Icon>
            </Button>
        </DrawerTrigger>
        <DrawerContent>
            <div class="mx-auto w-full max-w-3xl">
                <DrawerHeader>
                    <div class="flex items-center">
                        <div>
                            <DrawerTitle>{{ $t("heatmap.title") }}</DrawerTitle>
                            <DrawerDescription>{{ $t("heatmap.desc") }}</DrawerDescription>
                        </div>
                        <div class="flex items-center space-x-2 ml-auto">
                            <!-- Type: Groups/Tabs -->
                            <Select v-model="heatmapType">
                                <SelectTrigger class="w-32">
                                    <SelectValue :placeholder="$t('heatmap.typePlaceholder')"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="tabs">{{ $t("heatmap.tabsSelect") }}</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectItem value="groups">{{ $t("heatmap.groupsSelect") }}</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <!-- Year -->
                            <Select v-model="heatmapYear">
                                <SelectTrigger class="w-32">
                                    <SelectValue :placeholder="$t('heatmap.yearPlaceholder')"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem :value="-1">
                                            {{ $t("heatmap.recentYear") }}
                                        </SelectItem>
                                        <SelectItem v-for="year in heatmapData?.years" :value="`${year}`">
                                            {{ year }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DrawerHeader>
                <VChart class="min-h-32 px-4" :init-options="{locale:locale}" :option="option" @click="doSearch"
                        autoresize></VChart>
                <DrawerFooter>
                    <DrawerClose as-child>
                        <Button>{{ $t("heatmap.buttonClose") }}</Button>
                    </DrawerClose>
                </DrawerFooter>
            </div>
        </DrawerContent>
    </Drawer>
</template>

<style scoped>

</style>