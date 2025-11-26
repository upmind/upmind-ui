<template>
  <UpmSection class="max-w-app mx-auto" label="Addresses">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="form.address"
      :manage="{
        useList: useClientAddresses,
        useMutate: useClientAddressManager
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
  useClientAddressManager
} from "@upmind-automation/headless";

// --- components
import { UpmManage, UpmSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
