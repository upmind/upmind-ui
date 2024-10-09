<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn(props.class)" role="alert">
    <slot />
  </div>
</template>
