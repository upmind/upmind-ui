<template>
  <lord-icon :src="iconSrc" :trigger="trigger" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AnimatedIconProps } from "./types";

const props = withDefaults(defineProps<AnimatedIconProps>(), {
  trigger: "loop",
});

const iconSrc = computed(() => {
  return new URL(`../../assets/animations/${props.icon}.json`, import.meta.url)
    .href;
});
</script>
