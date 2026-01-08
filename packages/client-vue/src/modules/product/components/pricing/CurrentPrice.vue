<template>
  <component :is="props.is" :class="styles.pricing.current">
    <template v-if="priceMeta.isFree">
      {{ t("text.free") }}
    </template>
    <template v-else>
      {{
        priceMeta.useMonthlyFromPrice
          ? props.monthlyFromCurrentPrice
          : props.currentPrice
      }}
      <small
        v-if="priceMeta.useMonthlyFromPrice"
        :class="styles.pricing.term"
        >{{ t("text.product_cycle_per_month") }}</small
      >
    </template>
  </component>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./pricing.config";

// --- types
import type { CurrentPriceProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<CurrentPriceProps>(), {
  is: "span"
});

const { t } = useI18n();

const priceMeta = computed(() => ({
  useMonthlyFromPrice: props.useMonthlyFromPrice,
  isFree: props.free
}));

const styles = useStyles(["pricing"], priceMeta, config, props.uiConfig ?? {});
</script>
