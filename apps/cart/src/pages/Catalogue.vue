<template>
  <UpmCatalogue
    :category-route="{ name: ROUTE.CATALOGUE }"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
    v-slot="{ template }"
  >
    <component :is="CATALOGUE_TEMPLATES[template]" />
  </UpmCatalogue>
</template>

<script lang="ts" setup>
import { UpmCatalogue } from "@upmind-automation/catalogue";
import { CATALOGUE_TEMPLATES } from "@upmind-automation/client-vue";
import { ROUTE } from "../router";
</script>
