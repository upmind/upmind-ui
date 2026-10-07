<template>
  <Section
    id="basket-summary"
    :label="t('cart.basket_section')"
    value="basket-summary"
    icon="shopping-bag-02"
    :class="basketAsideVariants()"
  >
    <!-- itemized per-product breakdown when the brand asks for it (priced from
         the saved server basket), otherwise a plain totals summary -->
    <Summary
      :show-breakdown="ui.basketSummaryDetails.isVisible"
      :show-total="props.showTotal"
      :show-promotions="ui.basketPromotionCode.isVisible"
    />

    <footer v-if="props.showCheckout" class="w-full">
      <BasketCheckout
        @resolve="doResolve"
        :disabled="props.disabled"
        :loading="props.loading"
      />
    </footer>
  </Section>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Section } from "@upmind-automation/foundation";
import { useConfig } from "@upmind-automation/headless";
import { basketAsideVariants } from "../variants";
import BasketCheckout from "./BasketCheckout.vue";
import Summary from "./Summary.vue";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    loading?: boolean;
    showCheckout?: boolean;
    showTotal?: boolean;
  }>(),
  {
    showCheckout: true,
    showTotal: true
  }
);

const emit = defineEmits<{
  (e: "resolve"): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { ui } = useConfig();

function doResolve() {
  emit("resolve");
}
</script>
