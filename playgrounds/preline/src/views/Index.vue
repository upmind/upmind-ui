<script setup lang="ts">
import { inject } from "vue";
const activeTheme = inject("activeTheme");
</script>

<template>
  <section>
    <div
      class="content bg-base-200 text-base-content rounded-box px-4"
      :data-theme="activeTheme"
    ></div>
  </section>
</template>
