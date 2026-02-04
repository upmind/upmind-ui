<script lang="ts" setup>
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn(props.class)" data-testid="badge">
    <slot />
  </div>
</template>
