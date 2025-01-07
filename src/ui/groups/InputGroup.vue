<template>
  <div class="group w-full" :class="[ringClasses, invalidRingClasses]">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// --- utils=
import { ringClasses, invalidRingClasses } from "../input/input.config";
</script>
