<template>
  <UpmLayout>
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
  </UpmLayout>
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
import {
  UpmManage,
  UpmSection,
  UpmLayout
} from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
