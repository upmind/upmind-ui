<template>
  <article :class="styles.product.option.root">
    <div :class="styles.product.option.row">
      <h5 :class="styles.product.summary.category.text">
        {{ summary.category }}
      </h5>

      <ExPrice
        :regular-price="summary.price.regularPrice"
        :monthly-from-regular-price="
          summary.price.monthlyFromRegularPrice ?? ''
        "
        :discounted="summary.meta.discounted ?? false"
        :overridden="summary.meta.overridden"
        :ui-config="{ pricing: { ex: [styles.product.pricing.ex] } }"
      />
    </div>

    <div :class="styles.product.option.row">
      <div :class="styles.product.option.content">
        <Switch
          v-if="props.upsell && summary.meta.toggle"
          :id="`option-${summary.meta.toggle.categoryId}-${summary.meta.toggle.valueId}`"
          :checked="summary.meta.toggle?.selected ?? false"
          :disabled="error || processing"
          size="sm"
          @update:checked="doToggle"
        />

        <h3 :class="styles.product.summary.title.text">
          {{ summary.title }}
        </h3>

        <Promotion
          v-for="(promotion, index) in summary.promotions"
          :key="index"
          v-bind="promotion"
        />
      </div>

      <CurrentPrice
        :current-price="summary.price.currentPrice"
        :monthly-from-current-price="
          summary.price.monthlyFromCurrentPrice ?? ''
        "
        :free="summary.meta.free ?? false"
        :ui-config="{
          pricing: { current: [styles.product.pricing.current] }
        }"
      >
        <template v-if="summary.meta.toggle?.selected === false" #prefix
          >+
        </template>
        <template v-if="summary.quantity && summary.quantity > 1" #suffix>
          (x{{ summary.quantity }})
        </template>
      </CurrentPrice>
    </div>

    <TermsDescription v-bind="summary" />
  </article>
</template>

<script lang="ts" setup>
// --- components
import { Switch } from "@upmind-automation/upmind-ui";
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import ExPrice from "../../../product/components/pricing/ExPrice.vue";
import TermsDescription from "./components/TermsDescription.vue";
import Promotion from "./components/Promotion.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";

// --- types
import {
  type BasketProductOptionSummaryProps,
  type OptionTogglePayload
} from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<BasketProductOptionSummaryProps>();

const emits = defineEmits(["update:quantity", "toggle:option", "remove"]);

const options = defineModel<OptionTogglePayload>("options");

const styles = useStyles(
  [
    "product.summary",
    "product.summary.category",
    "product.summary.title",
    "product.option",
    "product.pricing"
  ],
  props,
  config
);

// --- methods

function doToggle(enabled: boolean) {
  const toggle = props.summary.meta.toggle;
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
