<template>
  <!-- the carded presentation is owned by the active template's section store -->
  <Section
    id="basket-summary"
    :label="t('text.summary')"
    value="summary"
    icon="shopping-bag-02"
  >
    <!-- with details, the summary lists per-product config lines, bound to the
         saved basket, with products linking back to configuration -->
    <Summary
      :show-breakdown="ui.basketSummaryDetails.isVisible"
      :edit-route="props.editRoute"
      show-products
      :show-promotions="uischema.showPromotionsOnCheckout"
      :show-button="!ui.basketSummaryDetails.isVisible"
    />
  </Section>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBasket, useConfig } from "@upmind-automation/headless";
import Section from "../../../components/section/Section.vue";
import Summary from "../../basket/components/Summary.vue";
import type { CheckoutPricingProps } from "../types";

const props = defineProps<CheckoutPricingProps>();

const { t } = useI18n();
const { ui } = useConfig();
// the checkout promotion field stays on the legacy brand setting, so brands that
// hid it keep it hidden; basketPromotionCode owns the basket only
const { uischema } = useBasket();
</script>
