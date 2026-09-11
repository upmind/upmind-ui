<template>
  <!-- A single, page-level "Search results" heading styled as an underline tab.
       It carries no panel, so the content region's mt-4 would only hold the
       underline off the ribbon's bottom border. -->
  <Tabs
    force
    variant="underline"
    :border="false"
    default-value="0"
    :tabs="[{ value: '0', label: t('text.search_results') }]"
    :ui="{ content: 'mt-0' }"
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
