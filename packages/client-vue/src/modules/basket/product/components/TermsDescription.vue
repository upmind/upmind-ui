<template>
  <Description>
    {{ t(`product.terms.billing.${props.cycle}`, [props.price.currentPrice]) }}.
    <template v-if="props.meta?.discounted && cycle !== 0"
      >{{ t("product.terms.renews", [props.price.regularPrice]) }}.
    </template>
    <template v-if="props.meta?.includesTax"
      >{{ t("product.terms.taxes") }}.</template
    >
    <template v-else>{{ t("product.terms.taxesExcluded") }}.</template>
  </Description>
</template>

<script lang="ts" setup>
// components
import Description from "../../../../components/content/Description.vue";

// --- external
import { useI18n } from "vue-i18n";

// --- types
import type { TermDetails } from "@upmind-automation/headless-vue";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<TermDetails>();
</script>
