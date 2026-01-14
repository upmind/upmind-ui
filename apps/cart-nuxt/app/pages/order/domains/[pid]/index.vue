<template>
  <UpmDac @resolve="doResolve" />
</template>

<script lang="ts" setup>
// --- components
import { UpmDac, useRoutingEngine } from "@upmind-automation/client-vue";

// ---utils
import { first } from "lodash-es";

// --- types
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

const { navigateNext } = useRoutingEngine();

function doResolve(value?: string[]) {
  const primaryDomain = first(value);
  navigateNext({ domain: primaryDomain });
}

definePageMeta({
  name: ROUTE.DOMAINS_WITH_PRODUCT
});
</script>
