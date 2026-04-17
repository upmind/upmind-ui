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

        <component
          :is="meta.isToggleable ? Link : 'h3'"
          as="h3"
          :class="styles.product.summary.title.text"
          @click="
            meta.isToggleable &&
            doToggle(!(summary.meta?.toggle?.selected ?? false))
          "
        >
          {{ summary.title }}
        </component>

        <Promotion
          v-if="!isMobile"
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
        <template v-if="!summary.meta.free" #prefix>+</template>
        <template v-if="summary.quantity && summary.quantity > 1" #suffix>
          (x{{ summary.quantity }})
        </template>
      </CurrentPrice>
    </div>

    <p
      v-if="!summary.meta?.free && summary.cycle != null"
      class="text-muted text-sm"
    >
      <template v-if="summary.meta?.oneoff || summary.cycle === 0">
        {{ t("term.renews_msg", { n: 0, cycle: "" }) }}.
      </template>
      <template v-else>
        +{{
          t("text.price_per_cycle", {
            price: summary.price.currentPrice,
            cycle: parseBillingCycle(summary.cycle).descriptive
          })
        }}.
        <span v-if="summary.meta?.discounted" class="text-muted line-through">
          {{
            t("term.renews_usually_msg", { price: summary.price.regularPrice })
          }}
        </span>
      </template>
    </p>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { Link, Switch } from "@upmind-automation/upmind-ui";
import CurrentPrice from "../../../product/components/pricing/CurrentPrice.vue";
import ExPrice from "../../../product/components/pricing/ExPrice.vue";
import Promotion from "./components/Promotion.vue";

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

const meta = computed(() => {
  return {
    isToggleable: props.upsell && props.summary.meta.toggle
  };
});

const styles = useStyles(
  [
    "product.summary",
    "product.summary.category",
    "product.summary.title",
    "product.option",
    "product.pricing"
  ],
  props,
  config,
  meta
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
