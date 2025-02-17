<template>
  <Interstitial v-bind="props" />
</template>

<script lang="ts" setup>
// -- components
import Interstitial from "../../../components/content/Interstitial.vue";

// ---types
import type { InterstitialExtendedProps } from "../../../components/content/types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InterstitialExtendedProps>(), {
  open: true,
  modal: false,
  skrim: "primary",
  size: "2xl",
  animatedIcon: {
    icon: "tapping-card",
    primaryColor: "primary",
    secondaryColor: "secondary",
    size: "4xl",
  },
});
</script>
