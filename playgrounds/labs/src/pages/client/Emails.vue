<template>
  <UpmLayout>
    <UpmSection class="max-w-app mx-auto" label="Emails">
      <UpmManage
        v-if="isAuthenticated"
        i18n-key="client.email"
        :manage="{
          useList: useClientEmails,
          useMutate: useClientEmailManager
        }"
      />
    </UpmSection>
  </UpmLayout>
</template>

<script lang="ts" setup>
import {
  useActiveSession,
  useClientEmailManager,
  useClientEmails,
  UpmManage,
  UpmSection,
  UpmLayout
} from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { isAuthenticated } = useActiveSession().useMeta();
</script>
