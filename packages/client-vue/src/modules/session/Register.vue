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
import RegisterSurfaceBox from "./register/RegisterSurfaceBox.vue";

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
  () => supportedTemplates[variant] ?? RegisterLTR
);
</script>
