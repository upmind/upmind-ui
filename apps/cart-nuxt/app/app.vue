<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- Eagerly loaded — always in DOM, never chunked -->
  <UpmAssetUnavailable :open="chunkErrorOccurred" />
</template>

<script lang="ts" setup>
// --- internal
import { UpmAssetUnavailable } from "@upmind-automation/client-vue";

// --- utils
import { chunkErrorOccurred } from "~/funnels/utils";
</script>
