<template>
  <UpmDac :tlds="tlds" v-slot="{ template }" @resolve="doResolve">
    <component :is="DOMAIN_TEMPLATES[template]" />
  </UpmDac>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router";
import {
  DOMAIN_TEMPLATES,
  useQueryParams,
  useRoutingEngine
} from "@upmind-automation/client-vue";
import { UpmDac } from "@upmind-automation/domain";
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
