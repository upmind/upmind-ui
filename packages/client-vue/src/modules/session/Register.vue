<template>
  <component :is="templateVariant" />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- components
import RegisterLTR from "./templates/RegisterLTR.template.vue";
import RegisterRTL from "./templates/RegisterRTL.template.vue";
import RegisterSplit from "./templates/RegisterSplit.template.vue";
import RegisterCanvasCard from "./templates/RegisterCanvasCard.template.vue";
import RegisterSurfaceBox from "./templates/RegisterSurfaceBox.template.vue";

// --- types
import { REGISTER_TEMPLATE } from "./types";

const variant = REGISTER_TEMPLATE.TWO_COLUMN_LTR;

const supportedTemplates = {
  [REGISTER_TEMPLATE.SPLIT]: RegisterSplit,
  [REGISTER_TEMPLATE.CANVAS_CARD]: RegisterCanvasCard,
  [REGISTER_TEMPLATE.SURFACE_BOX]: RegisterSurfaceBox,
  [REGISTER_TEMPLATE.TWO_COLUMN_LTR]: RegisterLTR,
  [REGISTER_TEMPLATE.TWO_COLUMN_RTL]: RegisterRTL
};

const templateVariant = computed(
  () => supportedTemplates[variant] ?? RegisterLTR.template
);
</script>
