<template>
  <UpmSection :label="t('text.personal_details')">
    <i18n-t keypath="text.personal_details_msg" tag="h1" />

    <!-- <h1 class="mt-0">

      This is a playground for Upmind components and utilities.
    </h1> -->

    <!-- <UpmManage
      v-if="meta.isAuthenticated"
      i18n-key="form.address"
      :manage="{
        useList: useClientAddresses,
        useMutate: useClientAddress
      }"
    /> -->
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
// import {
//   useSession,
// } from "@upmind-automation/headless";

// --- components
import { UpmSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
// const { meta } = useSession();
</script>
