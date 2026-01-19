<template>
  <UpmLayout :variant="layout">
    <template #content-header>
      <h1>{{ t("text.billing") }}</h1>
    </template>

    <template #default>
      <ClientBillingAddresses :skip-auth="true" />
    </template>

    <template #aside>
      <pre>{{ { route } }}</pre>
    </template>
  </UpmLayout>
</template>
<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useSession } from "@upmind-automation/headless";

// --- components
import { UpmLayout, LAYOUT_VARIANTS } from "@upmind-automation/client-vue";
import ClientBillingAddresses from "../components/ClientBillingAddresses.vue";

// --- types
import { useRoute } from "vue-router";

// -----------------------------------------------------------------------------
const route = useRoute();
const { isAuthenticated } = useSession();

const { t } = useI18n();

const layout = computed((): LAYOUT_VARIANTS => {
  return (route?.meta?.template as LAYOUT_VARIANTS) ?? LAYOUT_VARIANTS.FULL;
});
</script>
