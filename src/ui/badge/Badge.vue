<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn(props.class)" data-testid="badge">
    <slot />
  </div>
</template>
