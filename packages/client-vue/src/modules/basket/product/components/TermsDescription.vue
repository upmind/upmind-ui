<template>
  <Description v-if="has(props, 'cycle')">
    {{
      t("term.renews_msg", {
        cycle: parseBillingCycle(props.cycle!).descriptive
      })
    }}.

    <template v-if="props.meta?.discounted && cycle !== 0"
      >{{ t("term.renews_usually_msg", { price: props.price.regularPrice }) }}.
    </template>
    <template v-if="props.meta?.includesTax"
      >{{ t("text.price_include_taxes") }}.</template
    >
    <template v-else>{{ t("text.price_exclude_taxes") }}.</template>
  </Description>
</template>

<script lang="ts" setup>
// components
import Description from "../../../../components/content/Description.vue";

// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- utils
import { has } from "lodash-es";
// --- types
import type { TermDetails } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<TermDetails>();
</script>
