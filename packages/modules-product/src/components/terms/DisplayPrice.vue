<template>
  <p v-if="has(props, 'cycle')">
    <template v-if="meta?.free">
      {{ t("text.free") }}
    </template>
    <template v-else>
      {{
        t("term.price_msg", {
          n: calculatedN,
          price: formatPrice(
            meta?.oneoff || !meta?.useMonthlyFromPrice
              ? price?.currentPrice
              : price?.monthlyFromCurrentPrice,
            {
              trimTrailingZeroes: data.trimTrailingZeroes
            }
          ),
          period: parseBillingCycle(props.cycle!).descriptive
        })
      }}
    </template>

    <del v-if="meta?.discounted && !meta?.free" class="text-muted ml-1">
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
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  parseBillingCycle,
  useMoney,
  useConfig
} from "@upmind-automation/headless";
import { has } from "lodash-es";
import type { TermDetails } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { formatPrice } = useMoney();
const { ui: _ui, data } = useConfig();

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
