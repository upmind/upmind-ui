<template>
  <template v-if="!meta.isLoading">
    <div v-auto-animate>
      <div
        :class="styles.summary.pricing.root"
        v-for="(item, index) in summary?.pricing"
        :key="`pricing-${index}`"
      >
        <span>{{ t("product.total") }}</span>
        <span>
          <span
            v-if="item.meta?.discounted"
            :class="styles.summary.pricing.regularPrice"
          >
            <span>
              {{ item.regularPrice }}
            </span>
          </span>
          <span
            :class="[
              styles.summary?.pricing?.currentPrice,
              {
                'opacity-0': meta.isLoading || meta.isCalculating,
              },
            ]"
          >
            {{ item.meta?.free ? t("product.free") : item.currentPrice }}
          </span>
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
import { Skeleton } from "@upmind-automation/upmind-ui";

// --- types
import type { SummaryPricingProps } from "./types";
import type { ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

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
