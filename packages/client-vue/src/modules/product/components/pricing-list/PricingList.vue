<template>
  <template v-if="!loading">
    <DescriptionList :items="summary" class="font-normal" emphasis>
      <PricingTotal v-if="props.total" :pricing="pricing" />
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

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";
import config from "./pricing.config";

// --- components
import { Skeleton, DescriptionList } from "@upmind-automation/upmind-ui";
import PricingTotal from "./PricingTotal.vue";

// --- utils
import { omitBy, map, find } from "lodash-es";

// --- types
import type { PricingListProps } from "./types";
import { useI18n } from "vue-i18n";
import type { DescriptionItem } from "@upmind-automation/upmind-ui";
import type {
  ProductSummaryDetail,
  ProductSummaryDetailWithPrice
} from "@upmind-automation/headless";

const { t } = useI18n();

const props = defineProps<PricingListProps>();

const styles = useStyles(["summary.pricing", "summary.skeleton"], {}, config);

const summary = computed<DescriptionItem[]>(() => {
  const details = omitBy(props.details, (detail: ProductSummaryDetail) =>
    ["category", "provision_field.sld", "term"].includes(detail.name)
  ) as (ProductSummaryDetail | ProductSummaryDetailWithPrice)[];

  const summary = map(details, detail => ({
    term: detail.category,
    description: detail.title || "-"
  })) as DescriptionItem[];

  const term = find(props.details, d => d.name === "term");

  if (term && term.cycle && term.cycle > 0 && term.category) {
    summary.push({
      term: term.category,
      description: parseBillingCycle(term.cycle!).numeric
    });
  }

  return summary;
});
</script>
