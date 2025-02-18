<template>
  <article>
    <ContentSection>
      <Interstitial
        open
        modal
        skrim="light"
        :title="t('errors.404.title')"
        :text="t('errors.404.text')"
        :actions="[
          {
            as: 'a',
            color: 'primary',
            href: storefrontUrl,
            appendIcon: 'arrow-left',
            label: t('errors.404.action'),
          },
        ]"
        :animated-icon="{
          icon: 'basket-empty',
          trigger: 'loop',
          primaryColor: 'base-foreground',
          secondaryColor: 'tertiary',
          size: '4xl',
        }"
      >
        <template #avatar>
          <IconAnimated
            v-for="(icon, index) in icons"
            :key="index"
            :ref="'icon' + index"
            :icon="icon.icon"
            size="3xl"
            secondary-color="accent"
            trigger="sequence"
            :sequence="icon.sequence"
          />
        </template>

        <template #title>
          <SmartTitle
            i18n-key="errors.404.title"
            class="mt-4"
            align="center"
            size="3xl"
          />
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// -- components
import ContentSection from "../../components/content/ContentSection.vue";
import { IconAnimated } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
// @ts-ignore
const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;

const createRepeatSequence = (
  sequence: string,
  repetitions: number = 1
): string => {
  return Array(repetitions).fill(sequence).join(",play,");
};

const icons = [
  {
    icon: "four",
    sequence: createRepeatSequence(
      "delay:0,state:in-reveal,play,delay:2000,state:out-reveal,play,delay:0",
      50
    ),
  },
  {
    icon: "zero",
    sequence: createRepeatSequence(
      "delay:300,state:in-reveal,play,delay:1700,state:out-reveal,play,delay:0",
      50
    ),
  },
  {
    icon: "four",
    sequence: createRepeatSequence(
      "delay:600,state:in-reveal,play,delay:1400,state:out-reveal,play,delay:0",
      50
    ),
  },
];
</script>
