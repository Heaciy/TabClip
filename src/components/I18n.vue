<script lang="ts" setup>
import {ref, watch, onMounted} from 'vue';
import {useI18n} from 'vue-i18n';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Icon} from "@iconify/vue";
import {availableLocales} from "@/locales";

const {locale} = useI18n();
const currentLang = ref(locale.value);

onMounted(() => {
    const savedLang = localStorage.getItem('locale');
    if (savedLang && savedLang !== locale.value) {
        locale.value = savedLang;
        currentLang.value = savedLang;
    }
})

watch(currentLang, () => {
    locale.value = currentLang.value;
    localStorage.setItem('locale', currentLang.value);
})
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon">
                <Icon icon="lucide:languages" :class="'size-4'"></Icon>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
            <DropdownMenuLabel>{{ $t("i18n.label") }}</DropdownMenuLabel>
            <DropdownMenuSeparator/>
            <DropdownMenuRadioGroup v-model="currentLang">
                <DropdownMenuRadioItem v-for="(label, key) in availableLocales" :key="key" :value="key">
                    {{ label }}
                </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
</template>