<template>
  <article :class="styles.product.option.root">
    <div :class="styles.product.option.details">
      <h5 :class="styles.product.summary.category.text">
        {{ summary.category }}
      </h5>

      <div :class="styles.product.option.title">
        <h3 :class="styles.product.summary.title.text">
          {{ summary.title }}
        </h3>

        <Promotion
          v-if="!isMobile"
          v-for="(promotion, index) in summary.promotions"
          :key="index"
          v-bind="promotion"
        />
      </div>

      <p v-if="!summary.meta?.free" :class="styles.product.option.description">
        +{{
          summary.cycle && summary.cycle > 0
            ? t("text.price_per_cycle", {
                price: summary.price.currentPrice,
                cycle: parseBillingCycle(summary.cycle).descriptive
              })
            : t("text.price_one_time", { price: summary.price.currentPrice })
        }}.
        <span v-if="summary.meta?.discounted" class="text-muted line-through">
          {{
            t("term.renews_usually_msg", { price: summary.price.regularPrice })
          }}
        </span>
      </p>
    </div>

    <Button
      v-if="!summary.toggle?.selected"
      :label="t('action.add_option')"
      icon="plus"
      variant="outline"
      color="neutral"
      size="md"
      :class="styles.product.option.action"
      :disabled="error || processing"
      @click="doToggle(true)"
    />

    <Button
      v-else-if="!summary.meta?.quantifiable"
      :label="t('action.added_to_basket')"
      icon="check-circle-broken"
      variant="solid"
      color="secondary"
      size="md"
      :class="styles.product.option.action"
      :disabled="error || processing"
      @click="doToggle(false)"
    />

    <BasketQuantityField
      v-else
      :id="`option-qty-${summary.toggle?.categoryId}-${summary.toggle?.valueId}`"
      :class="styles.product.option.action"
      quantifiable
      :quantity="summary.quantity"
      :min="summary.min"
      :max="summary.max"
      :step="summary.step"
      :disabled="error || processing"
      @update:quantity="value => emits('update:quantity', value)"
      @remove="doToggle(false)"
    />
  </article>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { Button } from "@upmind-automation/upmind-ui";
import Promotion from "./components/Promotion.vue";
import BasketQuantityField from "./components/BasketQuantityField.vue";

// --- internal
import { useStyles, isMobile } from "@upmind-automation/upmind-ui";
import { parseBillingCycle } from "@upmind-automation/headless";
import config from "./basketProduct.config";

// --- types
import {
  type BasketProductOptionSummaryProps,
  type OptionTogglePayload
} from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<BasketProductOptionSummaryProps>();

const emits = defineEmits(["update:quantity", "toggle:option", "remove"]);

const { t } = useI18n();

const options = defineModel<OptionTogglePayload>("options");

const meta = computed(() => ({
  selected: !!props.summary.toggle?.selected,
  quantifiable: !!props.summary.meta?.quantifiable
}));

const styles = useStyles(
  [
    "product.summary",
    "product.summary.category",
    "product.summary.title",
    "product.option",
    "product.pricing"
  ],
  meta,
  config
);

// --- methods

function doToggle(enabled: boolean) {
  const toggle = props.summary.toggle;
  if (!toggle) return;

  const option = props.configOptions?.find(o => o.id === toggle.categoryId);
  if (option) {
    options.value = { option, value: { id: toggle.valueId }, enabled };
  } else {
    emits("toggle:option", {
      categoryId: toggle.categoryId,
      valueId: toggle.valueId,
      enabled,
      cycle: toggle.cycle
    });
  }
}
</script>
