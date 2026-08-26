<template>
  <!-- A single, page-level "Search results" heading styled as an underline tab -->
  <Tabs
    force
    variant="underline"
    :border="false"
    default-value="0"
    :tabs="[{ value: '0', label: t('text.search_results') }]"
  >
    <template #[`tab.0`]>
      <span class="text-lg">{{ t("text.search_results") }}</span>
    </template>
  </Tabs>
</template>

<script setup lang="ts">
import { Tabs } from "@upmind/ui";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>
