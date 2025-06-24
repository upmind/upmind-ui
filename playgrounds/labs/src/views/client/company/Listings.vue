<template>
  <UpmContentSection class="mx-auto max-w-app" title="Companies">
    <Alert
      v-if="!meta.isAvailable && !meta.isLoading"
      color="error"
      title="Please log in to use client companies"
    />

    <UpmClientCompanies
      v-if="meta.isAuthenticated && userId"
      :clientId="userId"
    />
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import { Alert } from "@upmind-automation/upmind-ui";
import {
  UpmClientCompanies,
  UpmContentSection,
} from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta, userId } = useSession();
</script>
