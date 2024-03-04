<script setup lang="ts">
import { inject } from "vue";
import TheWelcome from "../components/TheWelcome.vue";
const activeTheme = inject("activeTheme");
</script>

<template>
  <section>
    <div class="content bg-base-200 rounded-box px-4" :data-theme="activeTheme">
      <the-welcome />
    </div>
  </section>
</template>
