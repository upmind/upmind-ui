<template>
  <slot />
</template>

<script setup lang="ts">
// --- external
import { toRef } from "vue";

// --- utils
import { provideDisabled } from "../../utils";
// -----------------------------------------------------------------------------

const props = defineProps<{
  value: boolean;
}>();

provideDisabled(toRef(props, "value"));
</script>
