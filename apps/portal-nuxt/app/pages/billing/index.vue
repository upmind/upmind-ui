<template>
  <div />
</template>

<script setup lang="ts">
// Legacy parity (plan §1.2 revised): vue-app's /billing landed on orders,
// never an overview of its own — same surface, nothing more.
await navigateTo("/billing/orders", { replace: true });
</script>
