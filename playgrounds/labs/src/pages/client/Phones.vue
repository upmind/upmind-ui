<template>
  <UpmLayout>
    <UpmSection class="max-w-app mx-auto" label="Phones">
      <UpmManage
        v-if="isAuthenticated"
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
import {
  UpmManage,
  UpmSection,
  UpmLayout,
  useActiveSession
} from "@upmind-automation/client-vue";
import {
  useClientPhones,
  useClientPhoneManager
} from "@upmind-automation/headless";

// --- components

// -----------------------------------------------------------------------------

const { isAuthenticated } = useActiveSession().useMeta();
</script>
