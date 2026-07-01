<template>
  <UpmLayout>
    <UpmSection class="max-w-app mx-auto" label="Companies">
      <UpmManage
        v-if="isAuthenticated"
        i18n-key="form.company"
        :manage="{
          useList: useClientCompanies,
          useMutate: useClientCompanyManager
        }"
      />
    </UpmSection>
  </UpmLayout>
</template>

<script lang="ts" setup>
import {
  UpmManage,
  UpmSection,
  UpmLayout
} from "@upmind-automation/client-vue";
import {
  useActiveSession,
  useClientCompanies,
  useClientCompanyManager
} from "@upmind-automation/headless";

// --- components

// -----------------------------------------------------------------------------

const { isAuthenticated } = useActiveSession().useMeta();
</script>
