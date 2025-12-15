<template>
  <p>Delegate</p>
  <!-- <UpmLayout :variant="variant">
    <template #navigation></template>

    <template #default>
      <p>Account</p>
    </template>

    <template #aside></template>
  </UpmLayout> -->
</template>
<script lang="ts" setup>
// --- external
// import { ref, computed } from "vue";
// import { useI18n } from "vue-i18n";
// import { useRoute } from "vue-router";
// --- internal
// import {
// useBasket,
// useBasketFields,
// useDataLayer,
// useBrand,
// ROUTE,
//   useRoutingEngine
// } from "@upmind-automation/headless";
// import { useStyles } from "@upmind-automation/upmind-ui";
// import config from "./basket.config";

// --- components
import { UpmLayout } from "@upmind-automation/client-vue";

// import Hero from "../../components/hero/Hero.vue";
// import Summary from "./components/Summary.vue";
// import ProductCards from "./product/BasketProductCards.vue";
// import Form from "../../components/form/Form.vue";
// import Back from "../../components/navigation/Back.vue";
// import Section from "../../components/section/Section.vue";
// import BasketErrors from "./components/BasketErrors.vue";

// --- types
// import { type ComputedRef } from "vue";

// -----------------------------------------------------------------------------

// const { t } = useI18n();
// const { meta, isReady, count, summary } = useBasket();
// const { storefrontRoute } = useBrand();
// const { currentRoute } = useRoutingEngine();
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

// const layout = computed(() => {
//   return currentRoute.value?.meta?.template;
// });

const variant = "enclosed";

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
