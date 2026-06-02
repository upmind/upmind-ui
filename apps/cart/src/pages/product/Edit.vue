<template>
  <UpmBasketProductEdit
    :storefront-route="storefrontRoute"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>
<script lang="ts" setup>
// --- components
import { UpmBasketProductEdit } from "@upmind-automation/client-vue";

// --- types
import { ROUTE } from "../../router";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";
const { storefrontRoute } = useStorefrontRoute();
</script>
