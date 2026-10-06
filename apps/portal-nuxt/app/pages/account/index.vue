<template>
  <div />
</template>

<script setup lang="ts">
// Legacy parity (plan §1.2 revised): vue-app's /account landed on profile,
// never an overview of its own — same surface, nothing more.
await navigateTo("/account/profile", { replace: true });
</script>
