<template>
  <component
    :is="layout"
    v-show="meta.isVisible"
    :localeCount="size(supportedLanguages)"
    :currencyCount="size(currencies)"
  >
    <template #footer-actions v-if="meta.hasActions">
      <UpmLocale
        v-bind="localeTestAttrs"
        v-show="meta.showLocale && localeMeta.isAvailable"
      />
      <UpmCurrency v-bind="currencyTestAttrs" v-show="meta.showCurrency" />
    </template>

    <template #footer-content v-if="meta.hasContent && meta.showPoweredBy">
      <Content />
    </template>

    <template #footer-copyright v-if="meta.showCopyright">
      <Markdown
        v-if="footerTemplate?.body"
        :model-value="footerTemplate.body"
      />
      <Copyright v-else />
    </template>
  </component>
</template>

<script lang="ts" setup>
import {
  useBrand,
  useLocale,
  useBasketCurrency,
  useClientTemplate,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";
import { Markdown, useTestAttrs } from "@upmind-automation/upmind-ui";
import UpmLocale from "../../components/LocaleSwitcher.vue";
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import Content from "./components/Content.vue";
import Copyright from "./components/Copyright.vue";
import { useFooter } from "./useFooter";
import { size } from "lodash-es";

// --- components

// -----------------------------------------------------------------------------

const localeTestAttrs = useTestAttrs({ key: "locale-selector" });
const currencyTestAttrs = useTestAttrs({ key: "currency-selector" });

const { meta, layout } = useFooter();
const { meta: localeMeta, supportedLanguages } = useLocale();
const { currencies } = useBasketCurrency();
const { brandId } = useBrand();
const { data: footerTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.FOOTER,
  objectId: brandId.value
});
</script>
