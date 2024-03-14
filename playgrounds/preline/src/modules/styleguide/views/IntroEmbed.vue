<template>
  <div
    class="mx-auto flex max-w-md flex-wrap items-center p-6"
    :data-theme="activeTheme"
  >
    <!-- TODO -->
  </div>
</template>

<script setup>
import { inject } from "vue";

const activeTheme = inject("activeTheme");
</script>
