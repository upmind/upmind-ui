<template>
  <UpmCatalogue
    :category-route="{ name: ROUTE.CATALOGUE }"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- components
import { UpmCatalogue } from "@upmind-automation/client-vue";

// --- types
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.CATALOGUE
});
</script>
