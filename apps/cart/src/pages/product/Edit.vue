<template>
  <UpmBasketProductEdit
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>
<script lang="ts" setup>
// --- components
import { UpmBasketProductEdit } from "@upmind-automation/client-vue";

// --- types
import { ROUTE } from "../../router";
</script>
