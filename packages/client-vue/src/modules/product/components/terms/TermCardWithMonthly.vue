<template>
  <div :class="styles.product.config.grid.item.root">
    <div :class="styles.product.config.grid.item.header">
      <strong :class="styles.product.config.grid.item.title">
        {{ props.cycleFormatted?.numeric }}
        <template v-if="props.cycle && props.cycle > 0">
          {{ t("text.term") }}
        </template>
      </strong>

      <Promotion
        v-for="promotion in props.promotions"
        :key="promotion.code.toString()"
        v-bind="promotion"
        size="sm"
      />

      <span
        :class="styles.product.config.grid.item.text"
        v-if="
          props.price.monthlyFromCurrentAmount &&
          props?.cycle &&
          props.cycle > 1
        "
      >
        {{
          t("text.product_cycle_per_month", {
            value: props.price.monthlyFromCurrentPrice
          })
        }}
      </span>
    </div>

    <div :class="styles.product.config.grid.item.footer">
      <Pricing
        :regular-price="props.price.regularPrice"
        :monthly-from-regular-price="props.price.monthlyFromRegularPrice ?? ''"
        :current-price="props.price.currentPrice"
        :monthly-from-current-price="props.price.monthlyFromCurrentPrice ?? ''"
        :discounted="props.meta?.discounted ?? false"
        :free="props.meta?.free ?? false"
        :ui-config="{
          pricing: {
            current: [styles.product.config.grid.item.total]
          }
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../../product.config";

// --- components
import Pricing from "../pricing/Pricing.vue";
import Promotion from "../../../basket/product/components/Promotion.vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { TermDetails } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<TermDetails>();

// ---

const { t } = useI18n();

const meta = computed(() => ({
  hasPromotions: !isEmpty(props.promotions) || props.meta?.mixed
}));

const styles = useStyles(
  ["product.config.grid", "product.config.grid.item"],
  meta,
  config
) as ComputedRef<{
  product: {
    config: {
      grid: {
        item: {
          root: string;
          header: string;
          title: string;
          text: string;
          footer: string;
          total: string;
        };
      };
    };
  };
}>;
</script>
