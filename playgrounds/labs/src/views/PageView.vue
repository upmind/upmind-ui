<template>
  <upm-embed-view
    v-bind="meta"
    :variants="children"
    :url="embedUrl"
    v-if="embedUrl"
  />
</template>

<script setup>
import { inject, computed } from "vue";
import { useRoute } from "vue-router";
import UpmEmbedView from "./EmbedView.vue";
import { first, reject } from "lodash-es";

const activeTheme = inject("activeTheme");

const { fullPath, meta, matched } = useRoute();
//  ignore any hidden or root children
const children = reject(
  first(matched)?.children || [],
  child => child?.meta?.hidden //|| child.path == ""
);
debugger;

const embedUrl = computed(
  () => `${fullPath}/embed?embed=true&theme=${activeTheme.value}`
); // ---
</script>
