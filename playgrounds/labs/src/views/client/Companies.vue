<template>
  <UpmContentSection class="max-w-app mx-auto" title="Companies">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="client.company"
      :manage="{
        useList: useClientCompanies,
        useMutate: useClientCompany
      }"
    />
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import {
  useSession,
  useClientCompanies,
  useClientCompany
} from "@upmind-automation/headless";

// --- components
import { UpmManage, UpmContentSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
