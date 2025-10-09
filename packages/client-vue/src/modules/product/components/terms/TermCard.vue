<template>
  <div :class="styles.product.config.grid.item.root">
    <div :class="styles.product.config.grid.item.header">
      <strong
        :class="styles.product.config.grid.item.title"
        v-if="has(props, 'cycle')"
      >
        {{ parseBillingCycle(props.cycle!).numeric }}
        <template v-if="props.cycle! > 0">
          {{ t("text.term") }}
        </template>
      </strong>

      <Promotion
        v-for="promotion in props.promotions"
        :key="promotion.code.toString()"
        v-bind="promotion"
        size="sm"
      />
    </div>

    <div :class="styles.product.config.grid.item.footer" class="pricing">
      <Pricing
        class="pricing"
        :regular-price="props.price.regularPrice"
        :monthly-from-regular-price="props.price.monthlyFromRegularPrice ?? ''"
        :current-price="props.price.currentPrice"
        :monthly-from-current-price="props.price.monthlyFromCurrentPrice ?? ''"
        :discounted="props.meta?.discounted ?? false"
        :free="props.meta?.free ?? false"
        :use-monthly-from-price="props.meta?.useMonthlyFromPrice"
        :ui-config="{
          pricing: {
            current: [styles.product.config.grid.item.total]
          }
        }"
      />

      <small
        v-if="meta.showSummary"
        :class="styles.product.config.grid.item.text"
      >
        <PayToday :price="props.price" />
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../../product.config";

// --- components
import PayToday from "../pricing/PayToday.vue";
import Pricing from "../pricing/Pricing.vue";
import Promotion from "../../../basket/product/components/Promotion.vue";

// --- utils
import { isEmpty, has } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { TermDetails } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    TermDetails & {
      noSummary?: boolean;
      layout?: "stacked" | "inline";
    }
  >(),
  {
    noSummary: false,
    layout: "stacked"
  }
);

const { t } = useI18n();

const meta = computed(() => ({
  layout: props.layout,
  hasPromotions: !isEmpty(props.promotions) || props.meta?.mixed,
  showStacked: !props.noSummary,
  showSummary: !props.noSummary && props.meta.useMonthlyFromPrice
}));

const styles = useStyles(
  ["product.config.grid", "product.config.grid.item"],
  meta,
  config
) as ComputedRef<{
  product: {
    config: {
      grid: {
        root: string;
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
