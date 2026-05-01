<template>
  <UpmProductSetup :basket-route="{ name: ROUTE.BASKET }" />
</template>

<script lang="ts" setup>
// --- components
import { UpmProductSetup } from "@upmind-automation/client-vue";

// --- types
import { ROUTE } from "../router";
</script>
