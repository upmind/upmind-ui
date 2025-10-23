<template>
  <component :is="templateVariant" />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- components
import LoginLTR from "./templates/LoginLTR.template.vue";
import LoginRTL from "./templates/LoginRTL.template.vue";
import LoginSplit from "./templates/LoginSplit.template.vue";
import LoginCanvasCard from "./templates/LoginCanvasCard.template.vue";
import LoginSurfaceBox from "./templates/LoginSurfaceBox.template.vue";

// --- types
import { LOGIN_TEMPLATE } from "./types";

const variant = LOGIN_TEMPLATE.TWO_COLUMN_LTR;

const supportedTemplates = {
  [LOGIN_TEMPLATE.SPLIT]: LoginSplit,
  [LOGIN_TEMPLATE.CANVAS_CARD]: LoginCanvasCard,
  [LOGIN_TEMPLATE.SURFACE_BOX]: LoginSurfaceBox,
  [LOGIN_TEMPLATE.TWO_COLUMN_LTR]: LoginLTR,
  [LOGIN_TEMPLATE.TWO_COLUMN_RTL]: LoginRTL
};

const templateVariant = computed(() => supportedTemplates[variant] ?? LoginLTR);
</script>
