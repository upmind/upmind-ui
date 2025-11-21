<template>
  <Layout :variant="layout">
    <template #actions></template>

    <template #content-header>
      <h1>
        <i18n-t keypath="text.profile" tag="span" scope="global" />
      </h1>
    </template>

    <template #default>
      <ClientProfileFieldsEdit :fields="props.fields" />
    </template>

    <template #aside>
      <!-- <pre>{{ { meta, currentRoute } }}</pre> -->
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
import ClientProfileFieldsEdit from "../../../components/account/ClientProfileFieldsEdit.vue";

// --- types
import { ROUTE } from "../../../router/types";

// -----------------------------------------------------------------------------

const props = defineProps<{ fields: string[] }>();

const { currentRoute, isResolved, meta } = useRoutingEngine();

await isResolved(ROUTE.ACCOUNT_PROFILE);

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});
</script>
