<template>
  <ul :class="styles.summary.list.root">
    <SummaryItem
      v-if="term"
      v-bind="term"
      :title="
        te(`product.terms.cycle.${term.cycle}`)
          ? t(`product.terms.cycle.${term.cycle}`)
          : term.title
      "
      icon="configuration"
    />

    <template v-for="item in summary" :key="item.title">
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
import type {
  Product,
  ProductSummaryDetail,
  ProductSummaryDetailWithPrice,
} from "@upmind-automation/headless-vue";
import type { ComputedRef } from "vue";

// --- props
const props = defineProps<Product>();

const { t, te } = useI18n();

const styles = useStyles("summary.list", {}, config) as ComputedRef<{
  summary: {
    list: {
      root: string;
    };
  };
}>;

const term = computed(() => {
  return find(props.details, detail => detail.name === "term");
});

const summary = computed<
  (ProductSummaryDetail | ProductSummaryDetailWithPrice)[]
>(() => {
  return omitBy(props.details, detail =>
    ["term", "category", "provision_field.sld"].includes(detail.name)
  ) as (ProductSummaryDetail | ProductSummaryDetailWithPrice)[];
});
</script>
