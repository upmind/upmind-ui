<template>
  <UpmTransition>
    <UpmProductSetup
      :basket-route="{ name: ROUTE.BASKET }"
      v-slot="{ template }"
    >
      <component :is="PRODUCT_SETUP_TEMPLATES[template]" />
    </UpmProductSetup>
  </UpmTransition>
</template>

<script lang="ts" setup>
import { UpmProductSetup } from "@upmind-automation/basket";
import {
  PRODUCT_SETUP_TEMPLATES,
  UpmTransition
} from "@upmind-automation/client-vue";
import { ROUTE } from "../router";
</script>
