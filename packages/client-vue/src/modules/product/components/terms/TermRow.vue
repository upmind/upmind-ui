<template>
  <span class="flex w-full items-center justify-between gap-3">
    <span class="flex items-center gap-2">
      <span>{{ termLabel }}</span>
      <Tooltip v-if="showCustomBadge">
        <Badge size="sm" appearance="muted" variant="warning">
          {{ t("text.custom_price") }}
        </Badge>
        <template #content>{{
          t("text.price_manually_adjusted_msg")
        }}</template>
      </Tooltip>

      <Promotion
        v-for="promotion in promotions"
        :key="promotion.code.toString()"
        v-bind="promotion"
        size="sm"
      />
    </span>

    <span
      v-if="!props.overridden && props.price"
      class="flex items-center gap-2"
    >
      <Pricing
        :regular-price="props.price.regularPrice"
        :monthly-from-regular-price="props.price.monthlyFromRegularPrice ?? ''"
        :current-price="props.price.currentPrice"
        :monthly-from-current-price="props.price.monthlyFromCurrentPrice ?? ''"
        :discounted="props.meta?.discounted ?? false"
        :custom="props.meta?.custom"
        :free="props.meta?.free ?? false"
        :use-monthly-from-price="useMonthlyFromPrice"
        :ui-config="{ pricing: { current: ['text-sm font-medium text-body'] } }"
      />
      <small v-if="showSummary" class="text-muted">
        <PayToday :price="props.price" />
      </small>
    </span>
  </span>
</template>

<script setup lang="ts">
import { Badge } from "@upmind/ui";
import { Tooltip } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  parseBillingCycle,
  PriceDisplayTypes
} from "@upmind-automation/headless";
import Promotion from "../../../basket-product/components/card/components/Promotion.vue";
import PayToday from "../pricing/PayToday.vue";
import Pricing from "../pricing/Pricing.vue";
import type { TermCardProps } from "./types";

// -----------------------------------------------------------------------------
// The CardTerm content for a Select dropdown row: parsed-cycle label + price /
// custom badge. Same data as TermTile, laid out as a flat row for SelectItem.

// Spread TermDetails carries undeclared fields; keep them off the root span.
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TermCardProps>(), {
  summary: false
});

const { t } = useI18n();

const termLabel = computed(() => {
  const numeric = parseBillingCycle(props.cycle!).numeric;
  if ((props.cycle ?? 0) > 0) return `${numeric} ${t("text.term")}`;
  return numeric;
});

const useMonthlyFromPrice = computed(() => {
  if (props.type) return props.type !== PriceDisplayTypes.CYCLE;
  return props.meta?.useMonthlyFromPrice;
});

const showCustomBadge = computed(
  () => props.meta?.custom && !(props.meta?.free && props.meta?.freeTrial)
);
const showSummary = computed(() => props.summary && useMonthlyFromPrice.value);
const promotions = computed(() => {
  if (props.overridden || props.meta?.custom) return [];
  return props.promotions ?? [];
});
</script>
