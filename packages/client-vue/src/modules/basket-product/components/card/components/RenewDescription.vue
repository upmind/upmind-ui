<template>
  {{
    t("term.renews_msg", {
      n: props.cycle,
      cycle: parseBillingCycle(props.cycle!).descriptive
    })
  }}.

  <template v-if="props.discounted && !props.oneoff && !props.freeTrial">
    {{ t("term.renews_usually_msg", { price: props.regularPrice }) }}.
  </template>

  <template v-else-if="props.freeTrial && !props.oneoff && props.renewalPrice">
    {{ t("term.renews_usually_msg", { price: props.renewalPrice }) }}.
  </template>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- types
import type { RenewDescriptionProps } from "./types";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<RenewDescriptionProps>();
</script>
