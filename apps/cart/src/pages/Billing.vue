<template>
  <UpmBilling v-slot="{ template }">
    <component :is="BILLING_TEMPLATES[template]" />
  </UpmBilling>
</template>

<script lang="ts" setup>
import { UpmBilling } from "@upmind-automation/basket";
import { BILLING_TEMPLATES } from "../shell/modules/billing/shell";
</script>
