<template>
  <template v-if="props.meta?.includesTax"
    >{{ t("text.price_include_taxes") }}.</template
  >
  <template v-else>{{ t("text.price_exclude_taxes") }}.</template>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- types
import type { TermDetails } from "@upmind-automation/headless";

const { t } = useI18n();

const props = defineProps<TermDetails>();
</script>
