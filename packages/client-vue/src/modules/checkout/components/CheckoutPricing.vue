<template>
  <Section
    id="basket-summary"
    :label="t('text.summary')"
    value="summary"
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
import { useI18n } from "vue-i18n";
import { useBasket } from "@upmind-automation/headless";
import Section from "../../../components/section/Section.vue";
import Summary from "../../basket/components/Summary.vue";

const { t } = useI18n();
const { uischema } = useBasket();
</script>
