<template>
  <Layout :variant="layout">
    <template #content-header>
      <h1>{{ t("text.billing") }}</h1>
    </template>

    <template #default>
      <ClientBillingAddresses />
    </template>

    <template #aside>
      <pre>{{ { meta, currentRoute } }}</pre>
    </template>
  </Layout>
</template>
<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import { Layout } from "@upmind-automation/client-vue";
import ClientBillingAddresses from "./ClientBillingAddresses.vue";

// --- types
import { ROUTE } from "../../router/types";

// -----------------------------------------------------------------------------
const { currentRoute, isResolved, meta } = useRoutingEngine();
const { t } = useI18n();

await isResolved(ROUTE.ACCOUNT_BILLING);

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});
</script>
