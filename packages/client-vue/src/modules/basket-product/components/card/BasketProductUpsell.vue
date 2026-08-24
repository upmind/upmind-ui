<template>
  <article :class="productOptionRootVariants()">
    <BasketProductSummary :summary="summary">
      <!-- e.g. "+$9.99 every month." or "+$9.99 one-time." -->
      +{{
        summary.cycle && summary.cycle > 0
          ? t("text.price_per_cycle", {
              price: summary.price.currentPrice,
              cycle: parseBillingCycle(summary.cycle).descriptive
            })
          : t("text.price_one_time", {
              price: summary.price.currentPrice
            })
      }}.
    </BasketProductSummary>

    <Button
      v-if="!summary.toggle.selected"
      :data-attrs="{ 'data-test-key': 'button-add-option' }"
      variant="outline"
      size="md"
      :class="productOptionActionVariants()"
      :disabled="processing"
      @click="$emit('toggle', true)"
    >
      <Icon icon="plus" />
      {{ t("action.add_option") }}
    </Button>

    <Button
      v-else-if="!summary.meta?.quantifiable"
      :data-attrs="{ 'data-test-key': 'button-added' }"
      variant="secondary"
      size="md"
      :class="productOptionActionVariants()"
      :disabled="processing"
      @click="$emit('toggle', false)"
    >
      <Icon icon="check-circle-broken" />
      {{ t("action.added_to_basket") }}
    </Button>

    <BasketQuantityField
      v-else
      :id="`option-qty-${summary.toggle.categoryId}-${summary.toggle.valueId}`"
      :class="productOptionActionVariants()"
      quantifiable
      :quantity="summary.quantity"
      :min="summary.min"
      :max="summary.max"
      :step="summary.step"
      :disabled="processing"
      @update:quantity="value => $emit('update:quantity', value)"
      @remove="$emit('toggle', false)"
    />
  </article>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { parseBillingCycle } from "@upmind-automation/headless";
import { Button } from "@upmind/ui";
import { Icon } from "../../../../components/icon";
import {
  productOptionRootVariants,
  productOptionActionVariants
} from "./basketProduct.variants";
import BasketProductSummary from "./components/BasketProductSummary.vue";
import BasketQuantityField from "./components/BasketQuantityField.vue";
import type { BasketProductUpsellProps } from "./types";
// -----------------------------------------------------------------------------

defineProps<BasketProductUpsellProps>();

defineEmits(["update:quantity", "toggle"]);

const { t } = useI18n();
</script>
