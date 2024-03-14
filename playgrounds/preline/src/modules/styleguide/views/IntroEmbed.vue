<template>
  <div
    class="max-w-md mx-auto p-6 items-center flex flex-wrap"
    :data-theme="activeTheme"
  >
    <!-- TODO -->
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";

const activeTheme = inject("activeTheme");
</script>
