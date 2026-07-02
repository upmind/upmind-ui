<template>
  <del
    v-if="priceMeta.isDiscounted || priceMeta.isCustom"
    :class="styles.pricing.ex"
    data-test-key="ex-price"
    :data-test-value="formattedPrice"
  >
    <Skeleton v-if="props.loading" :class="styles.pricing.exSkeleton" />
    <template v-else> <slot name="prefix" />{{ formattedPrice }} </template>
  </del>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMoney, useConfig } from "@upmind-automation/headless";
import { useStyles, Skeleton } from "@upmind-automation/upmind-ui";
import config from "./pricing.config";
import type { ExPriceProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ExPriceProps>();

const { t: _t } = useI18n();
const { ui: _ui, data } = useConfig();

const { formatPrice } = useMoney();

const priceMeta = computed(() => ({
  useMonthlyFromPrice: props.useMonthlyFromPrice,
  isDiscounted: props.discounted,
  isCustom: props.custom
}));

const formattedPrice = computed(() =>
  formatPrice(
    priceMeta.value.useMonthlyFromPrice
      ? props.monthlyFromRegularPrice
      : props.regularPrice,
    {
      trimTrailingZeroes: data.trimTrailingZeroes
    }
  )
);

const styles = useStyles(["pricing"], priceMeta, config, props.uiConfig ?? {});
</script>
