<template>
  <UpmLayout :variant="layout">
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
      <pre>{{ { route } }}</pre>
    </template>
  </UpmLayout>
</template>
<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import { UpmLayout, LAYOUT_VARIANTS } from "@upmind-automation/client-vue";
import ClientProfile from "./components/ClientProfile.vue";
import ClientEmails from "./components/ClientEmails.vue";
import ClientPhones from "./components/ClientPhones.vue";

// --- types
import { useRoute } from "vue-router";

// -----------------------------------------------------------------------------

const route = useRoute();
const { isAuthenticated } = useSession();

const layout = computed((): LAYOUT_VARIANTS => {
  return (route?.meta?.template as LAYOUT_VARIANTS) ?? LAYOUT_VARIANTS.FULL;
});
</script>
