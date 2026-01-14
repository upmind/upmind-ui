<template>
  <UpmCatalogue
    :layout="layout"
    :category-route="{ name: ROUTE.CATALOGUE }"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- components
import { UpmCatalogue, LAYOUT_VARIANTS } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

const route = useRoute();

// TODO: Catalogue needs to be refactored to use the new templates system
// We're mapping to layouts for now
const layout = computed(() => {
  return route?.meta?.template as LAYOUT_VARIANTS;
});

definePageMeta({
  name: ROUTE.CATALOGUE
});
</script>
