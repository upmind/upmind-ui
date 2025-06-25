<template>
  <UpmContentSection class="mx-auto max-w-app" title="Emails">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="client.email"
      :manage="{
        useList: useClientEmails,
        useMutate: useClientEmail,
      }"
    />
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import {
  useSession,
  useClientEmail,
  useClientEmails,
} from "@upmind-automation/client-vue";

// --- components
import { UpmManage, UpmContentSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
