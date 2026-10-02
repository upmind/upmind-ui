<template>
  <UpmOrder
    :storefront-route="storefrontRoute"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
    v-slot="{ template }"
  >
    <component :is="ORDER_TEMPLATES[template]" />
  </UpmOrder>
</template>

<script lang="ts" setup>
import { ORDER_TEMPLATES } from "@upmind-automation/client-vue";
import { UpmOrder } from "@upmind-automation/invoice";
import { ROUTE } from "../router";
import { useStorefrontRoute } from "../router/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>
