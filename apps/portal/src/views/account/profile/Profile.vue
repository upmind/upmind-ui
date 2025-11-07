<template>
  <Layout :variant="layout">
    <template #navigation> ss </template>

    <template #controls></template>

    <template #actions></template>

    <template #content-header>
      <h1>Profile</h1>
    </template>

    <template #default>
      <p>
        Ex irure pariatur tempor ullamco dolore consequat. Dolore nostrud dolor
        mollit ea consequat in cupidatat nostrud amet amet reprehenderit
        consectetur cupidatat nostrud. Aliqua non et cillum mollit voluptate.
        Esse cupidatat exercitation consectetur fugiat exercitation consequat
        commodo proident enim tempor. Occaecat exercitation aute sunt ad do duis
        qui quis velit aute. Duis eiusmod proident aute non est. Officia
        consequat sit laborum tempor.
      </p>
    </template>

    <template #aside>
      <pre>{{ { meta, currentRoute } }}</pre>
    </template>
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
import { useRoutingEngine } from "@upmind-automation/headless";
// import { useStyles } from "@upmind-automation/upmind-ui";
// import config from "./basket.config";

// --- components
import { Layout } from "@upmind-automation/client-vue";

// --- types
// import { type ComputedRef } from "vue";

// -----------------------------------------------------------------------------

// const { t } = useI18n();
const { currentRoute, isReady, isResolved, meta } = useRoutingEngine();

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
