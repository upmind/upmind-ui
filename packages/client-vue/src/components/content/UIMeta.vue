<template>
  <Markdown v-if="UIMeta" :model-value="UIMeta" />
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { get } from "lodash-es";
import { Markdown } from "@upmind-automation/upmind-ui";

const props = defineProps<{
  meta: any;
  path: string;
}>();

const UIMeta = computed(() => get(props.meta?.ui, props.path));
</script>
