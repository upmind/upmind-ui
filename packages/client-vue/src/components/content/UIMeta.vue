<template>
  <section v-if="UIMeta" v-html="UIMeta" class="w-full" />
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { get } from "lodash-es";

const props = defineProps<{
  meta: any;
  path: string;
}>();

const UIMeta = computed(() => get(props.meta?.ui, props.path));

// TODO: Handle rendering individual components
</script>
