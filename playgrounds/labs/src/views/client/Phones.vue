<template>
  <UpmContentSection class="mx-auto max-w-app" title="Phones">
    <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="client.phone"
      :manage="{
        useList: useClientPhones,
        useMutate: useClientPhone
      }"
    />
  </UpmContentSection>
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
import { UpmManage, UpmContentSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { meta } = useSession();
</script>
