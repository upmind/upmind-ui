<template>
  <article>
    <ContentSection>
      <BasketLoading
        class="min-h-screen"
        skrim="light"
        :text="t('basket.loading.text')"
        :animated-icon="{
          icon: 'basket',
          delay: 250,
          primaryColor: 'base-foreground',
          secondaryColor: 'tertiary',
          size: '4xl',
        }"
      >
        <template #title>
          <SmartTitle
            i18n-key="basket.loading.title"
            size="3xl"
            align="center"
          />
        </template>
      </BasketLoading>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless-vue";

// -- components
import ContentSection from "../../components/content/ContentSection.vue";
import BasketLoading from "../basket/components/Loading.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// ---types
// -----------------------------------------------------------------------------

const { next } = useRoutingEngine();

// ensure we wait for the animation to complete (2s)
const animation = new Promise(resolve => setTimeout(resolve, 2_000));
await animation;

// --- everything should be loaded and resolved, so we can move on
next();

// ---------------------------------------------------
</script>
