<template>
  <UpmContentSection class="mx-auto max-w-app" title="Addresses">
    <Alert
      v-if="!meta.isAuthenticated && !meta.isLoading"
      color="error"
      title="Please log in to use billing"
    />

    <UpmBilling />
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import { UpmBilling, UpmContentSection } from "@upmind-automation/client-vue";
import { Alert } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { meta, userId } = useSession();
</script>
