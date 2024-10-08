<template>
  <section :class="props.class">
    <slot name="header">
      <header></header>
    </slot>

    <slot />

    <slot name="footer">
      <footer></footer>
    </slot>
  </section>
</template>

<!-- eslint-disable vue/component-api-style -->
<script setup lang="ts">
// --- types
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  class: HTMLAttributes["class"];
}>();
</script>
