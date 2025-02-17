<template>
  <article>
    <ContentSection v-auto-animate>
      <Interstitial
        skrim="light"
        :i18n-title="{ key: 'basket.loading.title' }"
        :text="t('basket.loading.text')"
        :animated-icon="{
          icon: 'basket',
          delay: 250,
          primaryColor: loadingPrimaryColor,
          secondaryColor: loadingSecondaryColor,
          size: '4xl',
        }"
      >
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
const { t } = useI18n();

// -- components
import Interstitial from "../../components/content/Interstitial.vue";

// ---types
import type { InterstitialExtendedProps } from "../../components/content/types";

withDefaults(
  defineProps<
    InterstitialExtendedProps & {
      loadingPrimaryColor?: string;
      loadingSecondaryColor?: string;
    }
  >(),
  {
    loadingPrimaryColor: "base-foreground",
    loadingSecondaryColor: "secondary",
  }
);
</script>
