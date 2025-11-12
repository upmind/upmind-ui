<template>
  <Layout :variant="layout">
    <!-- <template #navigation></template> -->

    <!-- <template #controls></template> -->

    <!-- <template #actions></template> -->

    <template #content-header>
      <h1>
        {{ t("text.billing") }}
      </h1>
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
import ClientBillingAddresses from "../../../components/account/ClientBillingAddresses.vue";

// --- types
import { ROUTE } from "../../../router/types";
// -----------------------------------------------------------------------------
const { currentRoute, isResolved, meta } = useRoutingEngine();
const { t } = useI18n();

await isResolved(ROUTE.ACCOUNT_BILLING);

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});

// const variant = "enclosed";

// const styles = useStyles(
//   ["basket.expand", "basket.items", "basket.customFields", "basket.aside"],
//   { variant: layout.value },
//   config
// ) as ComputedRef<{
//   basket: {
//     aside: string;
//     expand: string;
//     items: {
//       root: string;
//       content: string;
//     };
//     customFields: {
//       root: string;
//     };
//   };
// }>;

// const { dataLayer } = useDataLayer();

// dataLayer({ event: "view_cart" }).withEcommerce().push();
</script>
