<template>
  <UpmSection class="max-w-app mx-auto" label="Emails">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="client.email"
      :manage="{
        useList: useClientEmails,
        useMutate: useClientEmailManager
      }"
    />
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import {
  useSession,
  useClientEmailManager,
  useClientEmails
} from "@upmind-automation/client-vue";

// --- components
import { UpmManage, UpmSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
