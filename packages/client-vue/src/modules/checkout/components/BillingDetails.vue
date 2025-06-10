<template>
  <Add />
</template>

<script setup lang="ts">
// --- external
import { useBillingDetails } from "@upmind-automation/headless";
// --- components
import Add from "../../client/components/billing/Add.vue";
// -----------------------------------------------------------------------------

const { isReady, getAll } = useBillingDetails();

await isReady().then(async () => {
  await getAll();
});
</script>
