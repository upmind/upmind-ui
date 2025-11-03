<template>
  <UpmSection class="max-w-app mx-auto" title="Phones">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="client.phone"
      :manage="{
        useList: useClientPhones,
        useMutate: useClientPhone
      }"
    />
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import {
  useClientPhones,
  useClientPhone,
  useSession
} from "@upmind-automation/headless";

// --- components
import { UpmManage, UpmSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
