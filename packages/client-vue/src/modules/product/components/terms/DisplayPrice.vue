<template>
  <p>
    {{
      t("term.price_msg", {
        n: calculatedN,
        price:
          meta?.oneoff || !meta?.useMonthlyFromPrice
            ? price?.currentPrice
            : price?.monthlyFromCurrentPrice,
        period: props.cycleFormatted?.descriptive
      })
    }}

    <del v-if="meta?.discounted" class="text-emphasis-medium">
      {{
        t("text.price_was", {
          price:
            meta?.oneoff || !meta?.useMonthlyFromPrice
              ? price?.regularPrice
              : price?.monthlyFromRegularPrice
        })
      }}
    </del>
  </p>
</template>

<script setup lang="ts">
import type {
  Price,
  ProductDetails,
  ProductSummaryMeta,
  TermDetails
} from "@upmind-automation/headless";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<Omit<TermDetails, "name">>();

const calculatedN = computed(() => {
  // One-off
  if (props.meta?.oneoff) return 0;

  // Monthly or single cycle
  if (props.meta?.useMonthlyFromPrice || props.cycle === 1) return 1;

  // Multiple months or yearly
  return 2;
});
</script>
