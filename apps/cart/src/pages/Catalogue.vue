<template>
  <UpmCatalogue
    :category-route="{ name: ROUTE.CATALOGUE }"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
    v-slot="{ template }"
  >
    <component :is="catalogueTemplate(template)" />
  </UpmCatalogue>
</template>

<script lang="ts" setup>
import { UpmCatalogue } from "@upmind-automation/catalogue";
import { ROUTE } from "../router";
import { catalogueTemplate } from "../shell/modules/catalogue/shell";
</script>
