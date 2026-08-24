<template>
  <component
    :is="layout"
    v-show="meta.isVisible"
    :localeCount="size(supportedLanguages)"
    :currencyCount="size(currencies)"
  >
    <template #footer-actions v-if="meta.hasActions">
      <ColorModeToggle />
      <!-- No test key here: each switcher is a Combobox that overwrites
           fallthrough attrs on its own input, so a key set from outside never
           reaches the DOM. They carry their own — language-selector-value and
           currency-selector-trigger. -->
      <UpmLocale v-if="meta.showLocale && localeMeta.isAvailable" />
      <UpmCurrency v-if="meta.showCurrency" />
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
import { Markdown } from "@upmind/ui";
import UpmLocale from "../../components/LocaleSwitcher.vue";
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import ColorModeToggle from "./ColorModeToggle.vue";
import Content from "./components/Content.vue";
import Copyright from "./components/Copyright.vue";
import { useFooter } from "./useFooter";
import { size } from "lodash-es";

// --- components

// -----------------------------------------------------------------------------

const { meta, layout } = useFooter();
const { meta: localeMeta, supportedLanguages } = useLocale();
const { currencies } = useBasketCurrency();
const { brandId } = useBrand();
const { data: footerTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.FOOTER,
  objectId: brandId.value
});
</script>
