<template>
  <UpmDac :template="template" @resolve="doResolve" />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- components
import { UpmDac, useRoutingEngine } from "@upmind-automation/client-vue";

// --- internal
import { DOMAIN_TEMPLATE } from "@upmind-automation/client-vue";

// ---utils
import { first } from "lodash-es";

// -----------------------------------------------------------------------------

const route = useRoute();
const { navigateNext } = useRoutingEngine();

const template = computed(() => {
  return (route?.meta?.template as DOMAIN_TEMPLATE) ?? DOMAIN_TEMPLATE.FULL;
});

function doResolve(value?: string[]) {
  const primaryDomain = first(value);
  navigateNext({ domain: primaryDomain });
}
</script>
