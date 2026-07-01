<template>
  <UpmLayout>
    <UpmSection class="max-w-app mx-auto" label="Addresses">
      <UpmManage
        v-if="isAuthenticated"
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
import {
  UpmManage,
  UpmSection,
  UpmLayout
} from "@upmind-automation/client-vue";
import {
  useActiveSession,
  useClientAddresses,
  useClientAddressManager
} from "@upmind-automation/headless";

// --- components

// -----------------------------------------------------------------------------

const { isAuthenticated } = useActiveSession().useMeta();
</script>
