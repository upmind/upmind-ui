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
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useActiveSession } from "@upmind-automation/headless";
import { UpmLayout } from "../layout";
import { LAYOUT_VARIANTS } from "../layout/types";
import EmailOverview from "./EmailOverview.vue";

// --- types

// -----------------------------------------------------------------------------

const _props = defineProps<{ emailId: string }>();

// -----------------------------------------------------------------------------

const route = useRoute();
const { isReady } = useActiveSession().useActions();
await isReady();

const layout = computed((): LAYOUT_VARIANTS => {
  return (route?.meta?.template as LAYOUT_VARIANTS) ?? LAYOUT_VARIANTS.FULL;
});
</script>
