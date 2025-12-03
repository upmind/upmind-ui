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
      <ClientEmails />
      <ClientPhones />
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
import { useRoutingEngine, useSession } from "@upmind-automation/headless";

// --- components
import { Layout } from "@upmind-automation/client-vue";
import ClientProfile from "./ClientProfile.vue";
import ClientEmails from "./ClientEmails.vue";
import ClientPhones from "./ClientPhones.vue";

// --- types
import { ROUTE } from "../../../router/types";

// -----------------------------------------------------------------------------

const { currentRoute, meta } = useRoutingEngine();

const { isAuthenticated } = useSession();
await isAuthenticated();

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});
</script>
