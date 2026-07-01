<template>
  <Dac
    role="main"
    aria-label="Product listing"
    required
    :template="DOMAIN_TEMPLATE.WIDGET"
    @resolve="navigateNext"
  />
</template>

<script setup lang="ts">
import { useRoutingEngine } from "@upmind-automation/headless";
import { DOMAIN_TEMPLATE } from "../../domain";
import Dac from "../../domain/Dac.vue";

// -----------------------------------------------------------------------------

const { navigateNext } = useRoutingEngine();
</script>
