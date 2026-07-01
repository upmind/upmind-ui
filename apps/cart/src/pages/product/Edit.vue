<template>
  <UpmBasketProductEdit
    :storefront-route="storefrontRoute"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>
<script lang="ts" setup>
import { UpmBasketProductEdit } from "@upmind-automation/client-vue";
import { ROUTE } from "../../router";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";
const { storefrontRoute } = useStorefrontRoute();
</script>
