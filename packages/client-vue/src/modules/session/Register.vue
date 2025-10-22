<template>
  <component :is="templateVariant" />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- components
import RegisterLTR from "./register/RegisterLTR.vue";
import RegisterRTL from "./register/RegisterRTL.vue";
import RegisterSplit from "./register/RegisterSplit.vue";
import RegisterCanvasCard from "./register/RegisterCanvasCard.vue";

// --- types
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";

const variant = LAYOUT_VARIANTS.CANVAS_CARD;

const supportedTemplates = {
  [LAYOUT_VARIANTS.SPLIT]: RegisterSplit,
  [LAYOUT_VARIANTS.CANVAS_CARD]: RegisterCanvasCard,
  [LAYOUT_VARIANTS.TWO_COLUMN_LTR]: RegisterLTR,
  [LAYOUT_VARIANTS.TWO_COLUMN_RTL]: RegisterRTL
};

const templateVariant = computed(
  () => supportedTemplates[variant] ?? RegisterSplit
);
</script>
