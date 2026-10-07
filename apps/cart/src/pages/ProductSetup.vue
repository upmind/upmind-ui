<template>
  <Transitions>
    <UpmProductSetup
      :basket-route="{ name: ROUTE.BASKET }"
      v-slot="{ template }"
    >
      <component :is="productSetupTemplate(template)" />
    </UpmProductSetup>
  </Transitions>
</template>

<script lang="ts" setup>
import { UpmProductSetup } from "@upmind-automation/basket";
import { ROUTE } from "../router";
import Transitions from "../shell/components/transition/Transition.vue";
import { productSetupTemplate } from "../shell/modules/product-setup/shell";
</script>
