<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { GithubLogoIcon } from '@radix-icons/vue';
import { GlobeIcon, MailIcon } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const VERSION = browser.runtime.getManifest().version;
const { locale, tm } = useI18n();
const isDialogOpen = defineModel<boolean>({ default: false });
const handleOpenChange = (open: boolean) => {
    isDialogOpen.value = open;
};
const releasesLink = computed(() => {
    const lang = locale.value === 'zh' ? '' : '/en';
    return `https://tabclip.heaciy.com${lang}/releases`;
});

const openEmail = () => {
    window.location.href = 'mailto:contact@heaciy.com';
};
const openWebsite = () => {
    const lang = locale.value === 'zh' ? '/' : '/en';
    window.open(`https://tabclip.heaciy.com${lang}`, '_blank');
};
const redirectToGithub = () => {
    window.open('https://github.com/Heaciy/TabClip', '_blank');
};

const sections = computed(() => tm(`about.sections`));
</script>
<template>
    <Dialog :open="isDialogOpen" @update:open="handleOpenChange">
        <DialogTrigger as-child>
            <slot></slot>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle class="space-x-2">
                    <span>TabClip</span>
                    <span class="text-muted-foreground text-sm">(v{{ VERSION }})</span>
                </DialogTitle>
                <DialogDescription>
                    {{ $t('about.dialogDesc') }}
                </DialogDescription>
            </DialogHeader>

            <div class="flex max-h-64 flex-col">
                <ScrollArea class="overflow-auto">
                    <div class="flex-col space-y-2">
                        <div v-for="(section, i) in sections" :key="i">
                            <span class="mb-1 inline-block font-bold">{{ section.title }}</span>
                            <ul class="text-secondary-foreground text-md list-disc pr-2 pl-6 text-sm">
                                <li v-for="(item, j) in section.items" :key="j">
                                    {{ item }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
                <div class="my-2">
                    <a class="link inline-block pr-1 font-bold" :href="releasesLink" target="_blank">
                        {{ $t('about.allReleases') }}
                    </a>
                </div>
            </div>

            <DialogFooter>
                <div class="flex flex-1 gap-4">
                    <Button variant="outline" type="button" class="flex-1" @click="redirectToGithub">
                        <GithubLogoIcon />
                        {{ $t('about.buttonGithub') }}
                    </Button>
                    <Button variant="outline" type="button" class="flex-1" @click="openWebsite">
                        <GlobeIcon />
                        {{ $t('about.buttonWebsite') }}
                    </Button>
                    <Button variant="outline" type="button" class="flex-1" @click="openEmail">
                        <MailIcon />
                        {{ $t('about.buttonEmail') }}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
.link {
    position: relative;
    box-shadow: 0 -1px var(--muted-foreground) inset;
    transition: box-shadow 0.3s ease;
}

.link:hover {
    box-shadow: 0 -1.5em var(--muted-foreground) inset;
}
</style>
