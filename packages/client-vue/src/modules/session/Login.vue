<template>
  <component :is="templateVariant" />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import LoginLTR from "./templates/LoginLTR.template.vue";
import LoginRTL from "./templates/LoginRTL.template.vue";
import LoginSplit from "./templates/LoginSplit.template.vue";
import LoginCanvasCard from "./templates/LoginCanvasCard.template.vue";
import LoginSurfaceBox from "./templates/LoginSurfaceBox.template.vue";

// --- types
import { LOGIN_TEMPLATE } from "./types";
import { ROUTE } from "@upmind-automation/headless";

const { currentRoute, isResolved, isReady } = useRoutingEngine();

await isReady();
await isResolved(ROUTE.SESSION_REGISTER);

const supportedTemplates = {
  [LOGIN_TEMPLATE.SPLIT]: LoginSplit,
  [LOGIN_TEMPLATE.CANVAS_CARD]: LoginCanvasCard,
  [LOGIN_TEMPLATE.SURFACE_BOX]: LoginSurfaceBox,
  [LOGIN_TEMPLATE.TWO_COLUMN_LTR]: LoginLTR,
  [LOGIN_TEMPLATE.TWO_COLUMN_RTL]: LoginRTL
};

const layout = computed(() => {
  return currentRoute.value?.meta?.template as LOGIN_TEMPLATE;
});

const templateVariant = computed(
  () => supportedTemplates[layout.value] ?? LoginLTR
);
</script>
