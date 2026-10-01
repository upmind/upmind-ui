<template>
  <UpmPayment :invoice-id="invoiceId" />
</template>

<script lang="ts" setup>
import { UpmPayment } from "@upmind-automation/payment";
import type { PayProps } from "./types";
// -----------------------------------------------------------------------------
defineProps<PayProps>();
</script>
