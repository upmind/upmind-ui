<template>
  <template v-if="!loading">
    <DescriptionListRoot
      align="between"
      class="gap-y-2 font-normal"
      data-test-key="description-list"
    >
      <DescriptionItem
        v-for="(item, index) in summary"
        :key="index"
        :term="item.term"
        v-bind="item.dataAttrs"
      >
        {{ item.description }}
      </DescriptionItem>
      <PricingTotal v-if="props.total" class="col-span-2" :pricing="pricing" />
    </DescriptionListRoot>
  </template>

  <template v-else>
    <div :class="summarySkeletonRootVariants()">
      <Skeleton :class="summarySkeletonItemLongVariants()" />
      <Skeleton :class="summarySkeletonItemShortVariants()" />
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { parseBillingCycle } from "@upmind-automation/headless";
import { DescriptionListRoot, DescriptionItem } from "@upmind/ui";
import { Skeleton } from "@upmind/ui";
import PricingTotal from "./PricingTotal.vue";
import {
  summarySkeletonRootVariants,
  summarySkeletonItemLongVariants,
  summarySkeletonItemShortVariants
} from "./variants";
import { omitBy, map, find, filter } from "lodash-es";
import type { PricingListProps } from "./types";
import type {
  ProductSummaryDetail,
  ProductSummaryDetailWithPrice
} from "@upmind-automation/headless";

// New DescriptionList is compositional, so the row data is plain shape — the
// old lib's DescriptionItem type (now a component name) no longer applies.
interface SummaryItem {
  term?: string;
  description: string;
  dataAttrs?: Record<string, string>;
}

const { t: _t } = useI18n();

const props = withDefaults(defineProps<PricingListProps>(), {
  options: true,
  fields: true
});

const summary = computed<SummaryItem[]>(() => {
  let details = omitBy(props.details, (detail: ProductSummaryDetail) =>
    ["category", "provision_field.sld", "term"].includes(detail.name)
  ) as (ProductSummaryDetail | ProductSummaryDetailWithPrice)[];

  if (!props.options) {
    details = filter(details, detail => detail.name === "product");
  }

  if (!props.fields) {
    details = filter(
      details,
      detail => !detail.name.includes("provision_field")
    );
  }

  const summary: SummaryItem[] = map(details, detail => ({
    term: detail.category,
    description:
      detail.name === "product" && props.title
        ? props.title
        : detail.title || "-",
    dataAttrs: {
      "data-test-key": "description-list-item",
      "data-test-value": detail.name
    }
  }));

  const term = find(props.details, d => d.name === "term");

  if (term && term.cycle && term.cycle > 0 && term.category) {
    summary.push({
      term: term.category,
      description: parseBillingCycle(term.cycle!).numeric,
      dataAttrs: {
        "data-test-key": "description-list-item",
        "data-test-value": term.name
      }
    });
  }

  return summary;
});
</script>
