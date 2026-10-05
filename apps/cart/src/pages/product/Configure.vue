<template>
  <!-- Own Suspense boundary: the funnel can redirect away (express-add →
       basket) while this async view's setup is still pending — a pending dep
       in RouteView's shared Suspense wedges it on the branch swap; a local
       boundary just unmounts with the page. TODO: @Dom investigate why this is needed and remove if not necessary-->
  <Suspense>
    <UpmProductConfigure
      :storefront-route="storefrontRoute"
      :catalogue-route="{ name: ROUTE.CATALOGUE }"
      v-slot="{ template }"
    >
      <component :is="PRODUCT_TEMPLATES[template]" />
    </UpmProductConfigure>
    <template #fallback>
      <UpmLoading />
    </template>
  </Suspense>
</template>
<script lang="ts" setup>
import { UpmProductConfigure } from "@upmind-automation/product";
import { ROUTE } from "../../router";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";
import { PRODUCT_TEMPLATES } from "../../shell/modules/product/shell";
import UpmLoading from "../../shell/modules/system/Loading.vue";

// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>
