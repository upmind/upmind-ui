<template>
  <article :class="styles.product.option.root">
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
      :label="t('action.add_option')"
      icon="plus"
      variant="outline"
      color="neutral"
      size="md"
      :class="styles.product.option.action"
      :disabled="processing"
      @click="$emit('toggle', true)"
    />

    <Button
      v-else-if="!summary.meta?.quantifiable"
      :label="t('action.added_to_basket')"
      icon="check-circle-broken"
      variant="solid"
      color="secondary"
      size="md"
      :class="styles.product.option.action"
      :disabled="processing"
      @click="$emit('toggle', false)"
    />

    <BasketQuantityField
      v-else
      :id="`option-qty-${summary.toggle.categoryId}-${summary.toggle.valueId}`"
      :class="styles.product.option.action"
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
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Button } from "@upmind-automation/upmind-ui";
import BasketProductSummary from "./components/BasketProductSummary.vue";
import BasketQuantityField from "./components/BasketQuantityField.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import { parseBillingCycle } from "@upmind-automation/headless";
import config from "./basketProduct.config";

// --- types
import type { BasketProductUpsellProps } from "./types";
// -----------------------------------------------------------------------------

defineProps<BasketProductUpsellProps>();

defineEmits(["update:quantity", "toggle"]);

const { t } = useI18n();

const styles = useStyles(["product.option"], {}, config);
</script>
