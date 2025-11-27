<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { LanguagesIcon } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { availableLocales } from '@/locales';

const { locale } = useI18n();
const currentLang = ref(locale.value);

onMounted(async () => {
    const result = await browser.storage.local.get('locale');
    const savedLang = result.locale;
    if (savedLang && savedLang !== locale.value) {
        locale.value = savedLang;
        currentLang.value = savedLang;
    }
});

watch(currentLang, () => {
    locale.value = currentLang.value;
    browser.storage.local.set({ locale: currentLang.value });
});
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon">
                <LanguagesIcon />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
            <DropdownMenuLabel>{{ $t('i18n.label') }}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup v-model="currentLang">
                <DropdownMenuRadioItem v-for="(label, key) in availableLocales" :key="key" :value="key">
                    {{ label }}
                </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
