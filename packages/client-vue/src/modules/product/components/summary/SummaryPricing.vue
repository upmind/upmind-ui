<template>
  <template v-if="!props.loading">
    <DescriptionList :items="summary" class="font-normal" emphasis>
      <template
        v-for="(item, index) in props.pricing"
        :key="`pricing-${index}`"
      >
        <div :class="styles.summary.pricing.price">
          <dt :class="styles.summary.pricing.total">
            {{ t("text.total") }}
          </dt>

          <CurrentPrice
            is="dd"
            :class="styles.summary.pricing.currentPrice"
            :current-price="item.price.currentPrice"
            :monthly-from-current-price="
              item.price.monthlyFromCurrentPrice ?? ''
            "
            :free="item.meta.free ?? false"
            data-testid="total-price"
          />
        </div>
      </template>
    </DescriptionList>
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
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import config from "./summary.config";

// --- components
import { Skeleton, DescriptionList } from "@upmind-automation/upmind-ui";

// --- utils
import { omitBy, map, find } from "lodash-es";

// --- types
import type { SummaryPricingProps } from "./types";
import type { ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import CurrentPrice from "../pricing/CurrentPrice.vue";
import type { DescriptionItem } from "@upmind-automation/upmind-ui";
import type {
  ProductSummaryDetail,
  ProductSummaryDetailWithPrice
} from "@upmind-automation/headless";

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
      total: string;
      price: string;
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

const summary = computed<DescriptionItem[]>(() => {
  const details = omitBy(props.details, (detail: ProductSummaryDetail) =>
    ["category", "provision_field.sld", "term"].includes(detail.name)
  ) as (ProductSummaryDetail | ProductSummaryDetailWithPrice)[];

  const summary = map(details, detail => ({
    term: detail.category,
    description: detail.title || "-"
  })) as DescriptionItem[];

  const term = find(props.details, d => d.name === "term");

  if (term && term.category) {
    summary.push({
      term: term.category,
      description: t(`term.cycle_${term.cycle}`)
    });
  }

  return summary;
});
</script>
