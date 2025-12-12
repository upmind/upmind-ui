<template>
  <Tabs :tabs="tabs" :border="false" force />
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// --- components
import { Tabs } from "@upmind-automation/upmind-ui";

// --- types
import type { TabItem } from "@upmind-automation/upmind-ui";

const { t } = useI18n();

const tabs = computed((): TabItem[] => [
  { label: t("text.search_results"), value: "0" }
]);
</script>
