<template>
  <UpmSection :label="t('text.personal_details')">
    <i18n-t keypath="text.personal_details_msg" tag="h1" />
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal

// --- components
import { UpmSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
</script>
