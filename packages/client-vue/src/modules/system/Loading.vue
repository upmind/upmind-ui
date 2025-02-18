<template>
  <article>
    <ContentSection v-auto-animate>
      <Interstitial
        v-bind="props"
        :title="t('basket.loading.title')"
        :text="t('basket.loading.text')"
      >
        <template #title>
          <SmartTitle
            i18n-key="basket.loading.title"
            class="mt-4"
            align="center"
            size="3xl"
          />
        </template>

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
import {
  Interstitial,
  type InterstitialProps,
} from "@upmind-automation/upmind-ui";

// ---types

const props = withDefaults(defineProps<InterstitialProps>(), {
  animatedIcon: () => ({
    icon: "basket",
    delay: 250,
    primaryColor: "base-foreground",
    secondaryColor: "secondary",
    size: "4xl",
  }),
});
</script>
