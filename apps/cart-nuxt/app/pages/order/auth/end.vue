<template>
  <UpmSessionLogout :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
// --- components
import { UpmSessionLogout } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.SESSION_END
});
</script>
