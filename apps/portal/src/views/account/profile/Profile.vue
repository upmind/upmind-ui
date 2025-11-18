<template>
  <Layout :variant="layout">
    <template #actions></template>

    <template #content-header>
      <h1>
        <i18n-t keypath="text.profile" tag="span" scope="global" />
      </h1>
    </template>

    <template #default>
      <ClientProfile />
    </template>

    <template #aside>
      <pre>{{ { meta, currentRoute } }}</pre>
    </template>
  </Layout>
</template>
<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import { Layout } from "@upmind-automation/client-vue";
import ClientProfile from "../../../components/account/ClientProfile.vue";

// --- types
import { ROUTE } from "../../../router/types";

// -----------------------------------------------------------------------------

const { currentRoute, isResolved, meta } = useRoutingEngine();

await isResolved(ROUTE.ACCOUNT_PROFILE);

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});
</script>
