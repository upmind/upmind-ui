<template>
  <component :is="props.is" :class="styles.pricing.current">
    <template v-if="priceMeta.isFree">
      {{ t("product.free") }}
    </template>
    <template v-else>
      {{
        priceMeta.canShowCycle && te("product.cycle")
          ? t("product.cycle", { value: monthlyFromCurrentPrice })
          : currentPrice
      }}
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
import { type ComputedRef } from "vue";
import { type CurrentPriceProps } from "./types";

const props = withDefaults(defineProps<CurrentPriceProps>(), {
  is: "span"
});

const { t, te } = useI18n();

const priceMeta = computed(() => ({
  canShowCycle: props.showCycle && props.cycle,
  isFree: props.meta?.free
}));

const styles = useStyles(
  ["pricing"],
  priceMeta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  pricing: {
    current: string;
  };
}>;
</script>
