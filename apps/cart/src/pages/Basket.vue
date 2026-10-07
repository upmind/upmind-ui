<template>
  <Transitions>
    <UpmBasket
      :storefront-route="storefrontRoute"
      :basket-route="{ name: ROUTE.BASKET }"
      :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
      v-slot="{ template }"
    >
      <component :is="basketTemplate(template)" />
    </UpmBasket>
  </Transitions>
</template>

<script lang="ts" setup>
import { UpmBasket } from "@upmind-automation/basket";
import { ROUTE } from "../router";
import { useStorefrontRoute } from "../router/useStorefrontRoute";
import Transitions from "../shell/components/transition/Transition.vue";
import { basketTemplate } from "../shell/modules/basket/shell";

// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>
