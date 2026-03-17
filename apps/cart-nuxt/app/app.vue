<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- Eagerly loaded — always in DOM, never chunked -->
  <UpmAssetUnavailable />
</template>

<script lang="ts" setup>
// --- internal
import { UpmAssetUnavailable } from "@upmind-automation/client-vue";
</script>
