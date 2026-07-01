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

      <template v-if="(quantity || 0) > 1">
        (x{{ quantity
        }}<template v-if="(unitPrice || 0) > 1">
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
          / {{ parseBillingCycle(props.cycle!).suffix }}
        </template>
      </p>
    </dd>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  parseBillingCycle,
  useMoney,
  useConfig
} from "@upmind-automation/headless";
import { Icon } from "@upmind-automation/upmind-ui";
import { isEmpty } from "lodash-es";
import { has } from "lodash-es";
import type { DetailsItemProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<DetailsItemProps>();

const { t } = useI18n();
const { ui, data } = useConfig();
const { formatPrice } = useMoney();

const showPlusIcon = computed(
  () => !props.meta?.overrides && (props?.price?.currentAmount ?? 0) > 0
);

const hasPricing = computed(() => has(props, "price"));

const safePrice = computed(() => {
  return has(props, "price")
    ? formatPrice(props.price?.configuration?.totalFormatted, {
        zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
        trimTrailingZeroes: data.trimTrailingZeroes
      })
    : "";
});

const showTermLabel = computed(
  () => has(props, "cycle") && props.cycle! > 0 && !isEmpty(safePrice.value)
);

const unitPrice = computed(() => {
  return has(props, "price") ? props.price?.unit?.total : "";
});

const unitPriceFormatted = computed(() => {
  return has(props, "price")
    ? formatPrice(props.price?.unit?.totalFormatted, {
        zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
        trimTrailingZeroes: data.trimTrailingZeroes
      })
    : "";
});
</script>
