<template>
  <component :is="template" v-show="meta.isVisible">
    <template #footer-actions v-if="meta.hasActions">
      <UpmLocale data-testid="locale-selector" v-show="meta.showLocale" />
      <UpmCurrency data-testid="currency-selector" v-show="meta.showCurrency" />
    </template>

    <template #footer-content v-if="meta.hasContent">
      <Content />
    </template>

    <template #footer-copyright v-if="meta.showCopyright">
      <Copyright />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { useFooter } from "./useFooter";

// --- components
import Content from "./components/Content.vue";
import Copyright from "./components/Copyright.vue";
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import UpmLocale from "../../components/LocaleSwitcher.vue";

// --- internal
import { FOOTER_TEMPLATE, type FooterProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<FooterProps>(), {
  visible: undefined,
  template: undefined,
  noLocale: undefined,
  noCurrency: undefined,
  noCopyright: undefined,
  noLogo: undefined,
  noPoweredBy: undefined
});

const { meta, template, templateName } = useFooter(props);
</script>
