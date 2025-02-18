<template>
  <article>
    <ContentSection v-auto-animate>
      <BasketEmpty
        open
        modal
        skrim="light"
        :title="tm('basket.empty.title')"
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
      />
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";
// -- components
import ContentSection from "../../components/content/ContentSection.vue";
import BasketEmpty from "../basket/components/Empty.vue";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();
// @ts-ignore
const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;
</script>
