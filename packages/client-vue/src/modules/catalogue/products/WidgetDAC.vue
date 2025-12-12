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
import Dac from "../../domain/Dac.vue";
import { DOMAIN_TEMPLATE } from "../../domain";

// -----------------------------------------------------------------------------

const { navigateNext } = useRoutingEngine();
</script>
