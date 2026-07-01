<template>
  <UpmSessionLogout :storefront-route="storefrontRoute" />
</template>
<script lang="ts" setup>
import { UpmSessionLogout } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>
