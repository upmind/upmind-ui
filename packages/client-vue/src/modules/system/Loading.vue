<template>
  <article>
    <UpmContentSection>
      <UpmBasketLoading
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
          <i18n-t
            keypath="basket.loading.title"
            tag="span"
            for="basket.loading.exciting"
            class="text-primary font-bold"
          >
            <mask class="bg-accent leading-relaxed">{{
              t("basket.loading.exciting")
            }}</mask>
          </i18n-t>
        </template>
      </UpmBasketLoading>
    </UpmContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// --- internal
import { useRoutingEngine } from "@upmind-automation/client-vue";

// -- components
import {
  UpmBasketLoading,
  UpmContentSection,
} from "@upmind-automation/client-vue";

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
