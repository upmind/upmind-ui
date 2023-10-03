<template>
  <section class="toggle">
    <header class="toolbar">
      <h2 class="title">Toggle Machine</h2>

      <slot name="actions"></slot>
    </header>

    <upm-toggle use-global>Global Instance</upm-toggle>
    <upm-toggle></upm-toggle>
    <upm-toggle use-global>Global Instance</upm-toggle>
  </section>
</template>

<script setup lang="ts">
import UpmToggle from "../components/Toggle.vue";
</script>

<style scoped lang="scss">
.toggle {
  .values {
    margin-top: 1em;
    &:not(:last-child) {
      border-bottom: 1px solid whitesmoke;
      padding-bottom: 1em;
    }
  }
}
</style>
