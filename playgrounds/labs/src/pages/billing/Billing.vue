<template>
  <UpmLayout :variant="layout">
    <template #content-header>
      <h1>{{ t("text.billing") }}</h1>
    </template>

    <template #default>
      <ClientBillingAddresses />
    </template>

    <template #aside>
      <pre>{{ { route } }}</pre>
    </template>
  </UpmLayout>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import {
  UpmLayout,
  LAYOUT_VARIANTS,
  useActiveSession
} from "@upmind-automation/client-vue";
import ClientBillingAddresses from "./components/ClientBillingAddresses.vue";

// --- types

// -----------------------------------------------------------------------------
const route = useRoute();
await useActiveSession().useActions().isAuthenticated();

const { t } = useI18n();

const layout = computed((): LAYOUT_VARIANTS => {
  return (route?.meta?.template as LAYOUT_VARIANTS) ?? LAYOUT_VARIANTS.FULL;
});
</script>
