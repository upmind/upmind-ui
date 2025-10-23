<template>
  <Summary v-if="meta.hasProducts" :actions="false" />
</template>

<script lang="ts" setup>
// --- internal
import { useBasket } from "@upmind-automation/headless";

// --- components
import Summary from "../../../basket/components/Summary.vue";

const { meta } = useBasket();
</script>
