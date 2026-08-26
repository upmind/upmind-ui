<template>
  <!-- e.g. "Renews every month." or "One-time payment." -->
  <p
    v-if="!isNil(props.cycle)"
    v-bind="renewalTermTestAttrs(props.cycle)"
    :class="productSummaryRenewRenewsVariants()"
  >
    {{
      t("term.renews_msg", {
        n: props.cycle,
        cycle: parseBillingCycle(props.cycle).descriptive
      })
    }}.
  </p>

  <!-- Discounted term — e.g. "Usually $14.99." -->
  <p
    v-if="props.discounted && !props.oneoff && !props.freeTrial"
    :class="productSummaryRenewUsuallyVariants()"
  >
    {{ t("term.renews_usually_msg", { price: props.regularPrice }) }}.
  </p>

  <!-- Free trial — e.g. "Usually $9.99." (post-trial renewal price) -->
  <p
    v-else-if="props.freeTrial && !props.oneoff && props.renewalPrice"
    v-bind="trialRenewalPriceTestAttrs(props.renewalPrice)"
    :class="productSummaryRenewUsuallyVariants()"
  >
    {{ t("term.renews_usually_msg", { price: props.renewalPrice }) }}.
  </p>
</template>

<script lang="ts" setup>
import { useTestAttrs } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { parseBillingCycle } from "@upmind-automation/headless";
import {
  productSummaryRenewRenewsVariants,
  productSummaryRenewUsuallyVariants
} from "../basketProduct.variants";
import { isNil } from "lodash-es";
import type { RenewDescriptionProps } from "./types";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<RenewDescriptionProps>();
// NB: value is stringified because useTestAttrs discards non-string values
const renewalTermTestAttrs = (cycle?: number) =>
  useTestAttrs({ key: "renewal-term-label", value: String(cycle) });
const trialRenewalPriceTestAttrs = (price?: string) =>
  useTestAttrs({ key: "trial-renewal-price", value: price });
</script>
