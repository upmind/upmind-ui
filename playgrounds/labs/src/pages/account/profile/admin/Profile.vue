<template>
  <UpmLayout :variant="layout">
    <template #actions></template>

    <template #content-header>
      <h1>
        <i18n-t keypath="text.profile" tag="span" scope="global" />
      </h1>
    </template>

    <template #default>
      <ClientProfile edit-route="admin.account.profile.edit" />
      <ClientEmails />
      <ClientPhones />
    </template>

    <template #aside>
      <pre>{{ { route } }}</pre>
    </template>
  </UpmLayout>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { UpmLayout, LAYOUT_VARIANTS } from "@upmind-automation/client-vue";
import ClientEmails from "../components/ClientEmails.vue";
import ClientPhones from "../components/ClientPhones.vue";
import ClientProfile from "../components/ClientProfile.vue";

// --- types

// -----------------------------------------------------------------------------

const route = useRoute();

const layout = computed((): LAYOUT_VARIANTS => {
  return (route?.meta?.template as LAYOUT_VARIANTS) ?? LAYOUT_VARIANTS.FULL;
});
</script>
