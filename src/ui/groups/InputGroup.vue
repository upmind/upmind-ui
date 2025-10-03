<template>
  <div
    class="group w-full"
    :class="ring ? [ringClasses, invalidRingClasses] : ''"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
// --- utils=
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";

withDefaults(
  defineProps<{
    ring?: boolean;
  }>(),
  {
    ring: false
  }
);
</script>
