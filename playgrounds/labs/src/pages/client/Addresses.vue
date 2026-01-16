<template>
  <UpmLayout>
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
  </UpmLayout>
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
import {
  UpmManage,
  UpmSection,
  UpmLayout
} from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
