<template>
  <div :class="summaryItemRootVariants()">
    <dt :class="summaryItemTermVariants()">
      {{ t("text.basket_total") }}
    </dt>
    <dd :class="summaryItemDescriptionVariants()">
      <Skeleton
        v-if="meta.isPricesCalculating"
        :class="summaryItemSkeletonVariants()"
      />
      <template v-else>
        {{
          formatPrice(summary?.total, {
            zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
            trimTrailingZeroes: data.trimTrailingZeroes
          })
        }}
      </template>
    </dd>
  </div>
</template>

<script lang="ts" setup>
import { Skeleton } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { useBasket, useConfig } from "@upmind-automation/headless";
import { useMoney } from "@upmind-automation/headless";
import {
  summaryItemRootVariants,
  summaryItemTermVariants,
  summaryItemDescriptionVariants,
  summaryItemSkeletonVariants
} from "./summary.variants";

// --- types

// `footer` is set by Basket.vue but is purely a marker prop (was useStyles meta
// only, never a real variant); kept to accept the attr without a fallthrough.
withDefaults(
  defineProps<{
    footer?: boolean;
  }>(),
  {
    footer: false
  }
);

const { t } = useI18n();
const { summary, meta } = useBasket();
const { ui, data } = useConfig();
const { formatPrice } = useMoney();
</script>
