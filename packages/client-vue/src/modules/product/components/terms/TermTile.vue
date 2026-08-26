<template>
  <OptionTile
    :value="String(props.cycle)"
    :data-attrs="{ 'data-test-key': `option-tile-${props.cycle}` }"
    :label="termLabel"
  >
    <!-- Term name + its tags share the title line (the old card header). The
         promo was getting lost crammed into the trailing alongside the price. -->
    <template #label>
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
    </template>

    <!-- Price stacked below the title — the old card put its price footer
         beneath the header, not beside it. -->
    <template v-if="!props.overridden && props.price" #description>
      <span class="mt-1 flex flex-col">
        <Pricing
          :regular-price="props.price.regularPrice"
          :monthly-from-regular-price="
            props.price.monthlyFromRegularPrice ?? ''
          "
          :current-price="props.price.currentPrice"
          :monthly-from-current-price="
            props.price.monthlyFromCurrentPrice ?? ''
          "
          :discounted="props.meta?.discounted ?? false"
          :custom="props.meta?.custom"
          :free="props.meta?.free ?? false"
          :use-monthly-from-price="useMonthlyFromPrice"
          :ui-config="{
            pricing: { current: ['text-3xl font-medium text-body'] }
          }"
        />
        <small v-if="showSummary" class="text-muted text-sm">
          <PayToday :price="props.price" />
        </small>
      </span>
    </template>
  </OptionTile>
</template>

<script setup lang="ts">
import { Badge } from "@upmind/ui";
import { OptionTile } from "@upmind/ui";
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
// One billing term as an OptionTile — cycle as the label, price/promo/custom
// badge as trailing affixes. OptionTile owns the layout; this only feeds it
// data + fills its trailing region (the CardTerm content, no whole-card slot).

// v-bind="term" spreads TermDetails fields the type doesn't declare (label,
// title, id…); without this they fall through onto OptionTile and override the
// explicit :label. Only the bindings below should reach the tile.
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TermCardProps>(), {
  summary: true
});

const { t } = useI18n();

// Matches the old CardTerm title: the parsed cycle (e.g. "1-month") + "term".
// (TermDetails.title/label hold the adverb form "Monthly" — not what the card
// showed.) Named to avoid colliding with the spread `label` prop.
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
