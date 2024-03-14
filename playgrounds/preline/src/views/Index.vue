<script setup>
import { inject } from "vue";
const activeTheme = inject("activeTheme");
</script>

<template>
  <section>
    <div
      class="content rounded-box bg-base-200 px-4 text-base-content"
      :data-theme="activeTheme"
    ></div>
  </section>
</template>
