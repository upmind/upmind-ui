<template>
  <Transitions>
    <UpmBasketProductEdit
      :storefront-route="storefrontRoute"
      :catalogue-route="{ name: ROUTE.CATALOGUE }"
      v-slot="{ template }"
    >
      <component :is="basketProductTemplate(template)" />
    </UpmBasketProductEdit>
  </Transitions>
</template>
<script lang="ts" setup>
import { UpmBasketProductEdit } from "@upmind-automation/basket";
import { ROUTE } from "../../router";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";
import Transitions from "../../shell/components/transition/Transition.vue";
import { basketProductTemplate } from "../../shell/modules/basket-product/shell";
const { storefrontRoute } = useStorefrontRoute();
</script>
