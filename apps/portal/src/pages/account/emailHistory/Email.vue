<template>
  <UpmLayout :variant="layout">
    <template #actions></template>

    <template #content-header>
      <h1>
        <i18n-t keypath="action.view_email" tag="span" scope="global" />
      </h1>
    </template>

    <template #default>
      <EmailOverview :email-id="emailId" />
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
import EmailOverview from "./EmailOverview.vue";

// --- types
import { useRoute } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<{ emailId: string }>();

// -----------------------------------------------------------------------------

const route = useRoute();
const { isAuthenticated } = useSession();
await isAuthenticated();

const layout = computed((): LAYOUT_VARIANTS => {
  return (route?.meta?.template as LAYOUT_VARIANTS) ?? LAYOUT_VARIANTS.FULL;
});
</script>
