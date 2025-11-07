<template>
  <Layout :variant="layout">
    <template #navigation>ss</template>

    <template #default>
      <pre>{{ currentRoute }}</pre>
      <p>Profile</p>
    </template>

    <template #aside>ss</template>
  </Layout>
</template>
<script lang="ts" setup>
// --- external
import {
  // ref,
  computed
} from "vue";
// import { useI18n } from "vue-i18n";
// import { useRoute } from "vue-router";
import { ROUTE } from "../../../router/types";
// --- internal
import {
  // useBasket,
  // useBasketFields,
  // useDataLayer,
  // useBrand,
  useRoutingEngine
} from "@upmind-automation/headless";
// import { useStyles } from "@upmind-automation/upmind-ui";
// import config from "./basket.config";

// --- components
import { Layout } from "@upmind-automation/client-vue";

// --- types
// import { type ComputedRef } from "vue";

// -----------------------------------------------------------------------------

// const { t } = useI18n();
// const { meta, isReady, count, summary } = useBasket();
// const { storefrontRoute } = useBrand();
const { currentRoute, isReady, isResolved } = useRoutingEngine();
// const route = useRoute();

// const {
//   errors: fieldsErrors,
//   meta: fieldsMeta,
//   model: fieldsModel,
//   schema: fieldsSchema,
//   uischema: fieldsUischema,
//   clear: fieldsClear,
//   update: fieldsUpdate
// } = useBasketFields();

// const open = ref(false);

// await isReady();
await isReady();
await isResolved(ROUTE.ACCOUNT_PROFILE);

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});

console.log("layout", currentRoute.value);

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
