<template>
  <upm-view v-bind="meta" :url="embedUrl" v-if="embedUrl" />
  <!-- TODO page structure if we are NOT embedding -->
</template>

<script setup lang="ts">
import { inject, computed } from "vue";
import { useRoute } from "vue-router";
import UpmView from "./EmbedView.vue";

const activeTheme = inject("activeTheme");
const { fullPath, meta } = useRoute();
const embedUrl = computed(
  () => `${fullPath}/embed?embed=true&theme=${activeTheme.value}`
); // ---
</script>
