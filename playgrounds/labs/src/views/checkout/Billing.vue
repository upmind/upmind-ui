<template>
  <UpmContentSection class="mx-auto max-w-app" title="Addresses">
    <Alert
      v-if="!meta.isAvailable && !meta.isLoading"
      color="error"
      title="Please log in to use billing"
    />

    <UpmBilling />
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { useBasketBilling } from "@upmind-automation/headless";

// --- components
import { Alert } from "@upmind-automation/upmind-ui";
import { UpmBilling, UpmContentSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useBasketBilling();
</script>
