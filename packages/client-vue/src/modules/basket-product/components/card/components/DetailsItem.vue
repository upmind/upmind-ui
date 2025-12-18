<template>
  <div class="flex flex-wrap justify-between text-sm">
    <dt>
      <template v-if="props.name === 'term'">
        {{
          t("text.term_duration", {
            duration: parseBillingCycle(props.cycle!).numeric
          })
        }}
      </template>
      <template v-else>{{ title }}</template>

      <template v-if="quantity && quantity > 1">
        (x{{ quantity
        }}<template v-if="unitPrice && unitPrice > 1">
          @ {{ unitPriceFormatted }}</template
        >)
      </template>
    </dt>

    <dd v-if="hasPricing" class="flex items-center gap-x-1">
      <template v-if="props.name !== 'term'">
        <span v-if="showPlusIcon">
          <Icon icon="plus" size="3xs" />
        </span>
      </template>

      <p v-if="!props.meta?.free" class="whitespace-nowrap">
        {{ safePrice }}

        <template v-if="showTermLabel">
          / {{ parseBillingCycle(props.cycle!).descriptive }}
        </template>
      </p>
    </dd>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- components
import { Icon, Tooltip } from "@upmind-automation/upmind-ui";

import { isEmpty } from "lodash-es";

// --- types
import type {
  ProductSummaryDetailWithPrice,
  ProductSummaryDetail
} from "@upmind-automation/headless";
import { has } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<
  ProductSummaryDetail | ProductSummaryDetailWithPrice
>();

const { t } = useI18n();

const showPlusIcon = computed(
  () =>
    !props.meta?.overrides &&
    "price" in props &&
    props?.price?.currentAmount > 0
);

const hasPricing = computed(() => "price" in props);

const safePrice = computed(() => {
  return "price" in props ? props.price?.configuration?.totalFormatted : "";
});

const showTermLabel = computed(
  () => has(props, "cycle") && props.cycle! > 0 && !isEmpty(safePrice.value)
);

const unitPrice = computed(() => {
  return "price" in props ? props.price?.unit?.total : "";
});

const unitPriceFormatted = computed(() => {
  return "price" in props ? props.price?.unit?.totalFormatted : "";
});
</script>
