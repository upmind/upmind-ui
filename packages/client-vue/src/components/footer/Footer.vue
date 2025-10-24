<template>
  <component :is="templateVariant">
    <template
      #footer-actions
      v-if="!config.state.noLocale || !config.state.noCurrency"
    >
      <UpmLocale data-testid="locale-selector" v-if="!config.state.noLocale" />

      <UpmCurrency
        data-testid="currency-selector"
        v-if="!config.state.noCurrency"
      />
    </template>

    <template
      #footer-content
      v-if="!config.state.noLogo || !config.state.noPoweredBy"
    >
      <Content />
    </template>

    <template #footer-copyright v-if="!config.state.noCopyright">
      <Copyright />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useFooter } from "./useFooter";

// --- templates
import FooterFlat from "./templates/FooterFlat.template.vue";
import FooterStacked from "./templates/FooterStacked.template.vue";
import FooterNoOptions from "./templates/FooterNoOptions.template.vue";

// --- components
import Content from "./components/Content.vue";
import Copyright from "./components/Copyright.vue";
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import UpmLocale from "../../components/LocaleSwitcher.vue";

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
  [FOOTER_TEMPLATE.CANVAS_CARD]: FooterNoOptions,
  [FOOTER_TEMPLATE.SURFACE_BOX]: FooterNoOptions
};

const templateVariant = computed(
  () => supportedTemplates[meta.value.variant] ?? FooterStacked
);

// -----------------------------------------------------------------------------
const props = defineProps<{
  visible?: boolean;
  template?: FOOTER_TEMPLATE;
  noLocale?: boolean;
  noCurrency?: boolean;
  noAttribution?: boolean;
}>();

const { config } = useFooter(props);
</script>
