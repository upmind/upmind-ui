<template>
  <section class="toggle">
    <header
      class="navbar bg-base-100 rounded-md shadow-md sticky top-0 z-10 px-4"
    >
      <h2 class="title m-0">Toggle Machine</h2>

      <div class="actions">
        <slot name="actions"></slot>
      </div>
    </header>

    <upm-toggle use-global>Global Instance</upm-toggle>
    <upm-toggle></upm-toggle>
    <upm-toggle use-global>Global Instance</upm-toggle>
  </section>
</template>

<script setup lang="ts">
import UpmToggle from "../components/Toggle.vue";
</script>
