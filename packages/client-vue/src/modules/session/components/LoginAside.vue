<template>
  <Summary v-if="meta.hasProducts" :actions="false" />
</template>

<script lang="ts" setup>
import { useBasket } from "@upmind-automation/headless";
import Summary from "../../basket/components/Summary.vue";

const { meta } = useBasket();
</script>
