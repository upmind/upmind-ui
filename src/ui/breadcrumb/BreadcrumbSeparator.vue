<script lang="ts" setup>
import { ChevronRight } from "lucide-vue-next";
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <li
    role="presentation"
    aria-hidden="true"
    :class="cn('text-muted [&>svg]:h-3.5 [&>svg]:w-3.5', props.class)"
  >
    <slot>
      <ChevronRight />
    </slot>
  </li>
</template>
