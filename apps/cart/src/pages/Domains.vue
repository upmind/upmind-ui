<template>
  <UpmDac @resolve="doResolve" />
</template>

<script lang="ts" setup>
// --- components
import { UpmDac, useRoutingEngine } from "@upmind-automation/client-vue";

// --- internal

// ---utils
import { first } from "lodash-es";

// -----------------------------------------------------------------------------

const { navigateNext } = useRoutingEngine();

function doResolve(value?: string[]) {
  const primaryDomain = first(value);
  navigateNext({ domain: primaryDomain });
}
</script>
