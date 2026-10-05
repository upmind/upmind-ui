<template>
  <UpmDac :tlds="tlds" v-slot="{ template }" @resolve="doResolve">
    <component :is="domainTemplate(template)" />
  </UpmDac>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router";
import { UpmDac } from "@upmind-automation/domain";
import { useQueryParams, useRoutingEngine } from "@upmind-automation/headless";
import { domainTemplate } from "../shell/modules/domain/shell";
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
