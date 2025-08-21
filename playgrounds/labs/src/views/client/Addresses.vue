<template>
  <UpmContentSection class="max-w-app mx-auto" title="Addresses">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="client.address"
      :manage="{
        useList: useClientAddresses,
        useMutate: useClientAddress
      }"
    />
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import {
  useSession,
  useClientAddresses,
  useClientAddress
} from "@upmind-automation/headless";

// --- components
import { UpmManage, UpmContentSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
