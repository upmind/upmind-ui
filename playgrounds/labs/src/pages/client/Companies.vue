<template>
  <UpmSection class="max-w-app mx-auto" label="Companies">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="form.company"
      :manage="{
        useList: useClientCompanies,
        useMutate: useClientCompanyManager
      }"
    />
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import {
  useSession,
  useClientCompanies,
  useClientCompanyManager
} from "@upmind-automation/headless";

// --- components
import { UpmManage, UpmSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
