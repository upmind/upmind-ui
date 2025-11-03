<template>
  <UpmSection class="max-w-app mx-auto" title="Companies">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="form.company"
      :manage="{
        useList: useClientCompanies,
        useMutate: useClientCompany
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
  useClientCompany
} from "@upmind-automation/headless";

// --- components
import { UpmManage, UpmSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
