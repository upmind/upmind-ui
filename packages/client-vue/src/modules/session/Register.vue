<template>
  <component :is="templateVariant" />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import RegisterLTR from "./templates/RegisterLTR.template.vue";
import RegisterRTL from "./templates/RegisterRTL.template.vue";
import RegisterSplit from "./templates/RegisterSplit.template.vue";
import RegisterCanvasCard from "./templates/RegisterCanvasCard.template.vue";
import RegisterSurfaceBox from "./templates/RegisterSurfaceBox.template.vue";

// --- types
import { REGISTER_TEMPLATE } from "./types";

const { currentRoute } = useRoutingEngine();

const supportedTemplates = {
  [REGISTER_TEMPLATE.SPLIT]: RegisterSplit,
  [REGISTER_TEMPLATE.CANVAS_CARD]: RegisterCanvasCard,
  [REGISTER_TEMPLATE.SURFACE_BOX]: RegisterSurfaceBox,
  [REGISTER_TEMPLATE.TWO_COLUMN_LTR]: RegisterLTR,
  [REGISTER_TEMPLATE.TWO_COLUMN_RTL]: RegisterRTL
};

const layout = computed(() => {
  return currentRoute.value?.meta?.template as REGISTER_TEMPLATE;
});

const templateVariant = computed(
  () => supportedTemplates[layout.value] ?? RegisterLTR
);
</script>
