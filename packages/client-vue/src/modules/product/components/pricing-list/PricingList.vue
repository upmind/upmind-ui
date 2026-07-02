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
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { parseBillingCycle } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Skeleton, DescriptionList } from "@upmind-automation/upmind-ui";
import config from "./pricing.config";
import PricingTotal from "./PricingTotal.vue";
import { omitBy, map, find, filter } from "lodash-es";
import type { PricingListProps } from "./types";
import type {
  ProductSummaryDetail,
  ProductSummaryDetailWithPrice
} from "@upmind-automation/headless";
import type { DescriptionItem } from "@upmind-automation/upmind-ui";

const { t: _t } = useI18n();

const props = withDefaults(defineProps<PricingListProps>(), {
  options: true,
  fields: true
});

const styles = useStyles(["summary.pricing", "summary.skeleton"], {}, config);

const summary = computed<DescriptionItem[]>(() => {
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

  const summary = map(details, detail => ({
    term: detail.category,
    description:
      detail.name === "product" && props.title
        ? props.title
        : detail.title || "-",
    dataAttrs: { "data-test-key": `description-list-item-${detail.name}` }
  })) as DescriptionItem[];

  const term = find(props.details, d => d.name === "term");

  if (term && term.cycle && term.cycle > 0 && term.category) {
    summary.push({
      term: term.category,
      description: parseBillingCycle(term.cycle!).numeric,
      dataAttrs: { "data-test-key": `description-list-item-${term.name}` }
    });
  }

  return summary;
});
</script>
