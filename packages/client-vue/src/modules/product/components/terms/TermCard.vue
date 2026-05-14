<template>
  <div :class="styles.terms.radio.item.root">
    <header :class="styles.terms.radio.item.header">
      <strong :class="styles.terms.radio.item.title" v-if="has(props, 'cycle')">
        {{ parseBillingCycle(props.cycle!).numeric }}
        <template v-if="props.cycle! > 0">
          {{ t("text.term") }}
        </template>
      </strong>

      <Tooltip
        v-if="
          props.meta?.custom && !(props.meta?.free && props.meta?.freeTrial)
        "
        :label="t('text.price_manually_adjusted_msg')"
      >
        <Badge
          :label="t('text.custom_price')"
          size="sm"
          variant="muted"
          color="warning"
        />
      </Tooltip>

      <Promotion
        v-if="!props.overridden && !props.meta?.custom"
        v-for="promotion in props.promotions"
        :key="promotion.code.toString()"
        v-bind="promotion"
        size="sm"
      />
    </header>

    <footer
      v-if="!props.overridden"
      :class="styles.terms.radio.item.footer"
      class="pricing"
    >
      <Pricing
        class="pricing"
        :regular-price="props.price.regularPrice"
        :monthly-from-regular-price="props.price.monthlyFromRegularPrice ?? ''"
        :current-price="props.price.currentPrice"
        :monthly-from-current-price="props.price.monthlyFromCurrentPrice ?? ''"
        :discounted="props.meta?.discounted ?? false"
        :custom="props.meta?.custom"
        :free="props.meta?.free ?? false"
        :use-monthly-from-price="useMonthlyFromPrice"
        :ui-config="{
          pricing: {
            current: [styles.terms.radio.item.total],
            ex: [styles.terms.radio.item.ex]
          }
        }"
      />

      <small v-if="meta.showSummary" :class="styles.terms.radio.item.text">
        <PayToday :price="props.price" />
      </small>
    </footer>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  parseBillingCycle,
  PriceDisplayTypes
} from "@upmind-automation/headless";
import { useStyles, Badge, Tooltip } from "@upmind-automation/upmind-ui";
import config from "./terms.config";

// --- components
import PayToday from "../pricing/PayToday.vue";
import Pricing from "../pricing/Pricing.vue";
import Promotion from "../../../basket-product/components/card/components/Promotion.vue";

// --- utils
import { isEmpty, has } from "lodash-es";

import type { TermCardProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TermCardProps>(), {
  summary: true,
  layout: "stacked"
});

const { t } = useI18n();

const useMonthlyFromPrice = computed(() =>
  props.type
    ? props.type !== PriceDisplayTypes.CYCLE
    : props.meta?.useMonthlyFromPrice
);

const meta = computed(() => ({
  layout: props.layout,
  hasPromotions: !isEmpty(props.promotions) || props.meta?.mixed,
  showStacked: !props.summary,
  showSummary: props.summary && useMonthlyFromPrice.value
}));

const styles = useStyles(["terms.radio", "terms.radio.item"], meta, config);
</script>
