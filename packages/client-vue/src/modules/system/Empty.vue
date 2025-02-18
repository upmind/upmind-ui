<template>
  <article>
    <ContentSection v-auto-animate>
      <Interstitial
        open
        modal
        skrim="light"
        :i18n-title="{ key: 'basket.empty.title' }"
        :text="t('basket.empty.text')"
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
      >
        <template #title>
          <SmartTitle
            i18n-key="basket.empty.title"
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
import { Interstitial } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
const { t } = useI18n();
// @ts-ignore
const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;
</script>
