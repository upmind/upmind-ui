<template>
  <slot />
</template>

<script setup lang="ts">
// --- external
import { toRef } from "vue";

// --- utils
import { provideReadonly } from "../../utils";
// -----------------------------------------------------------------------------

const props = defineProps<{
  value: boolean;
}>();

provideReadonly(toRef(props, "value"));
</script>
