<template>
  <Add />
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import { useBillingDetails } from "@upmind-automation/headless-vue";
// --- components
import Add from "../../client/components/billing/Add.vue";
// -----------------------------------------------------------------------------

const { isReady, getAll } = useBillingDetails();

await isReady().then(async () => {
  await getAll();
});
</script>
