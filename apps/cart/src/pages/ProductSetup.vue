<template>
  <Transitions>
    <UpmProductSetup
      :basket-route="{ name: ROUTE.BASKET }"
      v-slot="{ template }"
    >
      <component :is="PRODUCT_SETUP_TEMPLATES[template]" />
    </UpmProductSetup>
  </Transitions>
</template>

<script lang="ts" setup>
import { UpmProductSetup } from "@upmind-automation/basket";
import { ROUTE } from "../router";
import Transitions from "../shell/components/transition/Transition.vue";
import { PRODUCT_SETUP_TEMPLATES } from "../shell/modules/product-setup/shell";
</script>
