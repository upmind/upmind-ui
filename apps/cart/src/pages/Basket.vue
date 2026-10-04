<template>
  <UpmTransition>
    <UpmBasket
      :storefront-route="storefrontRoute"
      :basket-route="{ name: ROUTE.BASKET }"
      :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
      v-slot="{ template }"
    >
      <component :is="BASKET_TEMPLATES[template]" />
    </UpmBasket>
  </UpmTransition>
</template>

<script lang="ts" setup>
import { UpmBasket } from "@upmind-automation/basket";
import { BASKET_TEMPLATES, UpmTransition } from "@upmind-automation/client-vue";
import { ROUTE } from "../router";
import { useStorefrontRoute } from "../router/useStorefrontRoute";

// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>
