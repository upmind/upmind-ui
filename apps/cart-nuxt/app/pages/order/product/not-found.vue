<template>
  <UpmProductNotFound :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
// --- components
import { UpmProductNotFound } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.PRODUCT_NOT_FOUND
});
</script>
