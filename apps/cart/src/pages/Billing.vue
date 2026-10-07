<template>
  <UpmBilling v-slot="{ template }">
    <component :is="billingTemplate(template)" />
  </UpmBilling>
</template>

<script lang="ts" setup>
import { UpmBilling } from "@upmind-automation/basket";
import { billingTemplate } from "../shell/modules/billing/shell";
</script>
