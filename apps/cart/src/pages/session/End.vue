<template>
  <UpmAuthLogout :storefront-route="storefrontRoute" />
</template>
<script lang="ts" setup>
import { UpmAuthLogout } from "@upmind-automation/auth";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>
