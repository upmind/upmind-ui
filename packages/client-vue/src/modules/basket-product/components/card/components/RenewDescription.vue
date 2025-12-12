<template>
  {{
    t("term.renews_msg", {
      n: props.cycle,
      cycle: parseBillingCycle(props.cycle!).descriptive
    })
  }}.

  <template v-if="props.meta?.discounted && cycle !== 0"
    >{{
      t("term.renews_usually_msg", { price: props.price.regularPrice })
    }}.</template
  >
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- types
import type { TermDetails } from "@upmind-automation/headless";

const { t } = useI18n();

const props = defineProps<TermDetails>();
</script>
