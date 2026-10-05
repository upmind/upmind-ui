<template>
  <Transitions>
    <UpmBasketProductEdit
      :storefront-route="storefrontRoute"
      :catalogue-route="{ name: ROUTE.CATALOGUE }"
      v-slot="{ template }"
    >
      <component :is="BASKET_PRODUCT_TEMPLATES[template]" />
    </UpmBasketProductEdit>
  </Transitions>
</template>
<script lang="ts" setup>
import { UpmBasketProductEdit } from "@upmind-automation/basket";
import { ROUTE } from "../../router";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";
import Transitions from "../../shell/components/transition/Transition.vue";
import { BASKET_PRODUCT_TEMPLATES } from "../../shell/modules/basket-product/shell";
const { storefrontRoute } = useStorefrontRoute();
</script>
