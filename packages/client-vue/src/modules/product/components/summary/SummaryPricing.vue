<template>
  <template v-if="!props.loading">
    <div v-auto-animate>
      <div
        :class="styles.summary.pricing.root"
        v-for="(item, index) in props.pricing"
        :key="`pricing-${index}`"
      >
        <span>{{ t("product.total") }}</span>

        <span class="flex items-center gap-2">
          <CurrentPrice
            :class="[
              {
                'text-emphasis-disabled': props.loading || props.processing,
              },
            ]"
            :current-price="item.price.currentPrice"
            :meta="item.meta"
            :cycle="item.cycle"
            data-testid="total-price"
          />
          <!-- <Spinner v-if="props.loading || props.processing" size="xs" /> -->
        </span>
      </div>
    </div>
  </template>

  <template v-else>
    <div :class="styles.summary.skeleton.root">
      <Skeleton :class="styles.summary.skeleton.itemLong" />
      <Skeleton :class="styles.summary.skeleton.itemShort" />
    </div>
  </template>
</template>

<script setup lang="ts">
// --- external
import { useStyles } from "@upmind-automation/upmind-ui";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import config from "./summary.config";

// --- components
import { Skeleton, Spinner } from "@upmind-automation/upmind-ui";

// --- types
import type { SummaryPricingProps } from "./types";
import type { ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import CurrentPrice from "../pricing/CurrentPrice.vue";

const { t } = useI18n();

const props = defineProps<SummaryPricingProps>();

const styles = useStyles(
  ["summary.pricing", "summary.skeleton"],
  {},
  config
) as ComputedRef<{
  summary: {
    pricing: {
      root: string;
      regularPrice: string;
      currentPrice: string;
    };
    skeleton: {
      root: string;
      itemLong: string;
      itemShort: string;
    };
  };
}>;
</script>
