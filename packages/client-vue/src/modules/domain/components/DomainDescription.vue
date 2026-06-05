<template>
  <template v-if="meta.isUnavailable">
    {{ t("text.domain_not_available_msg") }}
  </template>
  <template v-else-if="!meta.isAvailable">
    <!--
      Transfer-only row: the footer in `DomainCard.vue` carries the
      full "transfer today / FREE + renewal price" messaging, so the
      inline description here intentionally renders nothing. Keep the
      `v-else-if` so transfer rows still short-circuit out of the
      `!meta.isOwned` registration-renewal fallback below.
    -->
  </template>

  <template v-else-if="meta.isOwned">{{
    t("confirm.domain_owned_msg")
  }}</template>

  <template v-else-if="meta.isAdded">
    {{ t("confirm.domain_in_basket_msg") }}
  </template>

  <template v-else-if="!meta.isOwned">
    <template v-if="meta.isDiscounted">
      {{
        t("text.price_change_desc", {
          regularPrice: price.regularPrice,
          currentPrice: price.currentPrice,
          count: Math.floor((props.cycle ?? 0) / 12)
        })
      }}
    </template>
    <template v-else>
      {{ renewalDescription }}
    </template>
  </template>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- types
import type { DomainSummaryProps } from "../types";

const props = defineProps<DomainSummaryProps>();

const { t } = useI18n();

const renewalDescription = computed(() => {
  const cycle = props.cycle ?? 0;
  const years = Math.floor(cycle / 12);

  if (years >= 1) {
    // Year-based: use the existing plural translation
    return t("domain.price_renewal_desc", {
      regularPrice: props.price.regularPrice,
      currentPrice: props.price.currentPrice,
      count: years
    });
  }

  if (cycle === 0) {
    return t("domain.price_renewal_desc", {
      regularPrice: props.price.regularPrice,
      currentPrice: props.price.currentPrice,
      count: 0
    });
  }

  // Sub-year cycles: use adverbial for standard periods (monthly, quarterly, semiannually)
  // and "every X months" for non-standard periods (2mo, 4mo, 5mo, etc.)
  const billing = parseBillingCycle(cycle);
  const hasAdverbial = [1, 3, 6].includes(cycle);
  return hasAdverbial
    ? `Renews ${billing.adverbial.toLowerCase()} for ${props.price.regularPrice}.`
    : `Renews every ${billing.descriptive.toLowerCase()} for ${props.price.regularPrice}.`;
});
</script>
