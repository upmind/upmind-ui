<template>
  <div>
    <p :class="styles.product.summary.renew.renews">
      {{
        t("term.renews_msg", {
          n: props.cycle,
          cycle: parseBillingCycle(props.cycle!).descriptive
        })
      }}.
    </p>

    <p
      v-if="props.discounted && !props.oneoff && !props.freeTrial"
      :class="styles.product.summary.renew.usually"
    >
      {{ t("term.renews_usually_msg", { price: props.regularPrice }) }}.
    </p>

    <p
      v-else-if="props.freeTrial && !props.oneoff && props.renewalPrice"
      :class="styles.product.summary.renew.usually"
    >
      {{ t("term.renews_usually_msg", { price: props.renewalPrice }) }}.
    </p>
  </div>
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

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<RenewDescriptionProps>();

const styles = useStyles(["product.summary.renew"], {}, config);
</script>
