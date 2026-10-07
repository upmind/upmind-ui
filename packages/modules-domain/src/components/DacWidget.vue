<template>
  <Dac
    role="main"
    aria-label="Product listing"
    required
    :template="DOMAIN_TEMPLATE.WIDGET"
    @resolve="navigateNext"
  >
    <WidgetLayout />
  </Dac>
</template>

<script setup lang="ts">
import { useRoutingEngine } from "@upmind-automation/headless";
import { DOMAIN_TEMPLATE } from "../types";
import Dac from "./Dac.vue";
import WidgetLayout from "./WidgetLayout.vue";

// -----------------------------------------------------------------------------

const { navigateNext } = useRoutingEngine();
</script>
