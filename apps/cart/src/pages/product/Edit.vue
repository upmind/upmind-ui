<template>
  <UpmTransition>
    <UpmBasketProductEdit
      :storefront-route="storefrontRoute"
      :catalogue-route="{ name: ROUTE.CATALOGUE }"
      v-slot="{ template }"
    >
      <component :is="BASKET_PRODUCT_TEMPLATES[template]" />
    </UpmBasketProductEdit>
  </UpmTransition>
</template>
<script lang="ts" setup>
import { UpmBasketProductEdit } from "@upmind-automation/basket";
import {
  BASKET_PRODUCT_TEMPLATES,
  UpmTransition
} from "@upmind-automation/client-vue";
import { ROUTE } from "../../router";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";
const { storefrontRoute } = useStorefrontRoute();
</script>
