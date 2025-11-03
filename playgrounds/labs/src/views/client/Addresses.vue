<template>
  <UpmSection class="max-w-app mx-auto" title="Addresses">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="form.address"
      :manage="{
        useList: useClientAddresses,
        useMutate: useClientAddress
      }"
    />
  </UpmSection>
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
import { UpmManage, UpmSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
