<template>
  <article>
    <ContentSection v-auto-animate>
      <Interstitial
        open
        :modal="false"
        skrim="primary"
        size="2xl"
        :action="{
          as: 'a',
          color: 'primary',
          href: storefrontUrl,
          appendIcon: 'arrow-right',
          label: t('basket.empty.actions.continue'),
        }"
        :animated-icon="{
          icon: 'basket-empty',
          trigger: 'loop',
          primaryColor: 'base-foreground',
          secondaryColor: 'tertiary',
          size: '4xl',
        }"
        :title="t('basket.empty.title')"
        :text="t('basket.empty.text')"
      >
        <slot #title>
          <SmartTitle i18n-key="basket.empty.title" size="2xl" class="mb-2" />
        </slot>
      </Interstitial>

      <Interstitial open modal skrim="light" :text="t('basket.empty.text')">
        <template #title> </template>

        <template #background>
          <slot name="loading-background"></slot>
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();
// @ts-ignore
const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;
</script>
