<template>
  <!-- e.g. "Renews every month." or "One-time payment." -->
  <p v-if="!isNil(props.cycle)" :class="styles.product.summary.renew.renews">
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
    :class="styles.product.summary.renew.usually"
  >
    {{ t("term.renews_usually_msg", { price: props.regularPrice }) }}.
  </p>

  <!-- Free trial — e.g. "Usually $9.99." (post-trial renewal price) -->
  <p
    v-else-if="props.freeTrial && !props.oneoff && props.renewalPrice"
    :class="styles.product.summary.renew.usually"
  >
    {{ t("term.renews_usually_msg", { price: props.renewalPrice }) }}.
  </p>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import { parseBillingCycle } from "@upmind-automation/headless";
import config from "../basketProduct.config";

// --- types
import type { RenewDescriptionProps } from "./types";
import { isNil } from "lodash-es";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<RenewDescriptionProps>();

const styles = useStyles(["product.summary.renew"], {}, config);
</script>
