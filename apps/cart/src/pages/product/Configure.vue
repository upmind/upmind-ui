<template>
  <!-- Own Suspense boundary: the funnel can redirect away (express-add →
       basket) while this async view's setup is still pending — a pending dep
       in RouteView's shared Suspense wedges it on the branch swap; a local
       boundary just unmounts with the page. TODO: @Dom investigate why this is needed and remove if not necessary-->
  <Suspense>
    <UpmProductConfigure
      :storefront-route="storefrontRoute"
      :catalogue-route="{ name: ROUTE.CATALOGUE }"
    />
    <template #fallback>
      <UpmLoading />
    </template>
  </Suspense>
</template>
<script lang="ts" setup>
// --- components
import { UpmLoading, UpmProductConfigure } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "../../router";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";

// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>
