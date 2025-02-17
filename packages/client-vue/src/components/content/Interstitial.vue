<template>
  <Interstitial v-bind="props">
    <template v-if="i18nTitle" #title>
      <SmartTitle
        :i18n-key="i18nTitle.key"
        :plural="i18nTitle.plural"
        size="3xl"
        class="mb-2"
      />
    </template>

    <template #background>
      <slot name="background" />
    </template>
  </Interstitial>
</template>

<script setup lang="ts">
// --- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import SmartTitle from "./SmartTitle.vue";

// --- types
import type { InterstitialExtendedProps } from "./types";

// --- props
const props = defineProps<InterstitialExtendedProps>();
</script>
