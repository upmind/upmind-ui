<template>
  <DacWidget />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

// -----------------------------------------------------------------------------

// Lazy: only a category that shows the domain search loads `domain`.
const DacWidget = defineAsyncComponent(() =>
  import("@upmind-automation/domain").then(({ UpmDacWidget }) => UpmDacWidget)
);
</script>
