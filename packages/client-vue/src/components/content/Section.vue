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
<script lang="ts" setup>
// --- types
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  class: HTMLAttributes["class"];
}>();
</script>
