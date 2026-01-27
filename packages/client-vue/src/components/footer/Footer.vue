<template>
  <component
    :is="layout"
    v-show="meta.isVisible"
    :localeCount="size(supportedLanguages)"
    :currencyCount="size(currencies)"
  >
    <template #footer-actions v-if="meta.hasActions">
      <UpmLocale
        data-testid="locale-selector"
        v-show="meta.showLocale && localeMeta.isAvailable"
      />
      <UpmCurrency data-testid="currency-selector" v-show="meta.showCurrency" />
    </template>

    <template #footer-content v-if="meta.hasContent && meta.showPoweredBy">
      <Content />
    </template>

    <template #footer-copyright v-if="meta.showCopyright">
      <Copyright />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- internal
import { useFooter } from "./useFooter";
import { useLocale, useBasketCurrency } from "@upmind-automation/headless";

// --- utils
import { size } from "lodash-es";

// --- components
import Content from "./components/Content.vue";
import Copyright from "./components/Copyright.vue";
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import UpmLocale from "../../components/LocaleSwitcher.vue";

// -----------------------------------------------------------------------------
const { meta, layout } = useFooter();
const { meta: localeMeta, supportedLanguages } = useLocale();
const { currencies } = useBasketCurrency();
</script>
