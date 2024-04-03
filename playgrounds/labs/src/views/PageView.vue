<template>
  <upm-embed-view v-bind="meta" :url="embedUrl" v-if="embedUrl" />
</template>

<script setup>
import { inject, computed } from "vue";
import { useRoute } from "vue-router";
import UpmEmbedView from "./EmbedView.vue";

const activeTheme = inject("activeTheme");
const { fullPath, meta } = useRoute();
const embedUrl = computed(
  () => `${fullPath}/embed?embed=true&theme=${activeTheme.value}`
); // ---
</script>
