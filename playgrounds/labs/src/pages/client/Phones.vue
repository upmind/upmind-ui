<template>
  <UpmLayout>
    <UpmSection class="max-w-app mx-auto" label="Phones">
      <UpmManage
        v-if="meta.isAuthenticated"
        i18n-key="client.phone"
        :manage="{
          useList: useClientPhones,
          useMutate: useClientPhoneManager
        }"
      />
    </UpmSection>
  </UpmLayout>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import {
  useClientPhones,
  useClientPhoneManager,
  useSession
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
