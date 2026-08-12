<template>
  <UpmDac :tlds="tlds" @resolve="doResolve" />
</template>

<script lang="ts" setup>
// --- external
import { useRoute } from "vue-router";

// --- components
import {
  UpmDac,
  useQueryParams,
  useRoutingEngine
} from "@upmind-automation/client-vue";

// --- internal

// ---utils
import { first } from "lodash-es";

// -----------------------------------------------------------------------------

const route = useRoute();
const { navigateNext } = useRoutingEngine();
const { tlds } = useQueryParams(route);

function doResolve(value?: string[]) {
  const primaryDomain = first(value);
  navigateNext({ domain: primaryDomain });
}
</script>
