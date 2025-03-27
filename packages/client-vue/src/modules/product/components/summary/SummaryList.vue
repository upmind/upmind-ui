<template>
  <ul :class="styles.summary.list.root">
    <SummaryItem
      v-if="termSummary"
      :category="termSummary.category"
      :title="
        te(`product.terms.cycle.${termSummary.cycle}`)
          ? t(`product.terms.cycle.${termSummary.cycle}`)
          : termSummary.title
      "
      :quantity="termSummary.quantity"
      icon="configuration"
    />

    <template v-for="item in summaryItems" :key="item.title">
      <SummaryItem v-bind="item" />
    </template>
  </ul>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./summary.config";

// --- components
import SummaryItem from "./SummaryItem.vue";

// --- utils
import { find, omitBy, isEmpty } from "lodash-es";

// --- types
import type { SummaryListProps } from "./types";
import type { ComputedRef } from "vue";

// --- props
const props = defineProps<SummaryListProps>();

const { t, te } = useI18n();

const styles = useStyles("summary.list", {}, config) as ComputedRef<{
  summary: {
    list: {
      root: string;
    };
  };
}>;

const termSummary = computed(() => {
  return find(props.summary?.details, detail => detail.key === "term");
});

const hasSummaryDetails = computed(() => {
  return !isEmpty(termSummary.value) || !isEmpty(summaryItems.value);
});

const summaryItems = computed(() => {
  return omitBy(props.summary?.details, detail =>
    ["term", "category", "provision_field.sld"].includes(detail.key)
  );
});
</script>
