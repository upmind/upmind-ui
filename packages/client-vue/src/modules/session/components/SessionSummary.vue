<template>
  <Summary :show-promotions="false" show-products />
</template>

<script lang="ts" setup>
// The basket-summary aside `auth` asks for through `foundation`'s shell socket.
// `basket` sits ABOVE `auth` in the ADR 023 §3 graph, so the summary cannot be
// imported there; the shell owns it and hands it over.
import Summary from "../../basket/components/Summary.vue";
</script>
