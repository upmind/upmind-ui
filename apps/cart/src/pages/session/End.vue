<template>
  <UpmSessionLogout :storefront-route="storefrontRoute" />
</template>
<script lang="ts" setup>
import { UpmSessionLogout } from "@upmind-automation/auth";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>
