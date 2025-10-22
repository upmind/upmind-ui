<template>
  <component :is="templateVariant" />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- components
import LoginLTR from "./login/LoginLTR.vue";
import LoginRTL from "./login/LoginRTL.vue";
import LoginSplit from "./login/LoginSplit.vue";
import LoginCanvasCard from "./login/LoginCanvasCard.vue";

// --- types
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";

const variant = LAYOUT_VARIANTS.CANVAS_CARD;

const supportedTemplates = {
  [LAYOUT_VARIANTS.SPLIT]: LoginSplit,
  [LAYOUT_VARIANTS.CANVAS_CARD]: LoginCanvasCard,
  [LAYOUT_VARIANTS.TWO_COLUMN_LTR]: LoginLTR,
  [LAYOUT_VARIANTS.TWO_COLUMN_RTL]: LoginRTL
};

const templateVariant = computed(
  () => supportedTemplates[variant] ?? LoginSplit
);
</script>
