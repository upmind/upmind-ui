<template>
  <UpmProductRequiresAction :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
// --- components
import {
  UpmProductRequiresAction,
  useRoutingEngine
} from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION
});
</script>
