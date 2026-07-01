<template>
  <Tabs :tabs="tabs" :border="false" force />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Tabs } from "@upmind-automation/upmind-ui";
import type { TabItem } from "@upmind-automation/upmind-ui";

const { t } = useI18n();

const tabs = computed((): TabItem[] => [
  { label: t("text.search_results"), value: "0" }
]);
</script>
