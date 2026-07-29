<template>
  <Section
    id="basket-summary"
    :label="t('cart.basket_section')"
    icon="shopping-bag-02"
    :class="styles.basket.aside"
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
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useConfig } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../basket.config";

// --- components
import Summary from "./Summary.vue";
import Section from "../../../components/section/Section.vue";

// --- types
import { BASKET_TEMPLATE } from "../types";
import BasketCheckout from "./BasketCheckout.vue";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    layout?: BASKET_TEMPLATE;
    disabled?: boolean;
    loading?: boolean;
    showCheckout?: boolean;
    showTotal?: boolean;
  }>(),
  {
    layout: BASKET_TEMPLATE.FULL,
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

const styles = useStyles(["basket.aside"], { variant: props.layout }, config);

function doResolve() {
  emit("resolve");
}
</script>
