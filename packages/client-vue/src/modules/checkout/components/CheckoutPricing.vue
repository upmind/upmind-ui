<template>
  <Section
    id="basket-summary"
    :label="t('text.summary')"
    icon="shopping-bag-02"
  >
    <Summary
      no-actions
      :show-promotions="uischema.showPromotionsOnCheckout"
      show-products
    />
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket } from "@upmind-automation/headless";

// --- components
import Section from "../../../components/section/Section.vue";
import Summary from "../../basket/components/Summary.vue";

const { t } = useI18n();
const { uischema } = useBasket();
</script>
