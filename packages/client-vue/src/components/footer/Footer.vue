<template>
  <component :is="templateVariant">
    <template #footer-actions>
      <Actions locale currency />
    </template>
    <template #footer-content>
      <Content />
    </template>
    <template #footer-copyright>
      <Copyright />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- templates
import FooterFlat from "./templates/FooterFlat.template.vue";
import FooterStacked from "./templates/FooterStacked.template.vue";
import FooterNoOptions from "./templates/FooterNoOptions.template.vue";

// --- components
import Actions from "./components/Actions.vue";
import Content from "./components/Content.vue";
import Copyright from "./components/Copyright.vue";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";
import { FOOTER_TEMPLATE } from "./types";

const { currentRoute } = useRoutingEngine();

const meta = computed(() => ({
  variant: currentRoute.value?.meta?.template as FOOTER_TEMPLATE
}));

const supportedTemplates = {
  [FOOTER_TEMPLATE.DEFAULT]: FooterStacked,
  [FOOTER_TEMPLATE.ENCLOSED]: FooterStacked,
  [FOOTER_TEMPLATE.FULL]: FooterStacked,
  [FOOTER_TEMPLATE.TWO_COLUMN_LTR]: FooterFlat,
  [FOOTER_TEMPLATE.TWO_COLUMN_RTL]: FooterFlat,
  [FOOTER_TEMPLATE.SPLIT]: FooterNoOptions,
  [FOOTER_TEMPLATE.CANVAS_CARD]: FooterFlat,
  [FOOTER_TEMPLATE.SURFACE_BOX]: FooterFlat
};

const templateVariant = computed(
  () => supportedTemplates[meta.value.variant] ?? FooterStacked
);
</script>
