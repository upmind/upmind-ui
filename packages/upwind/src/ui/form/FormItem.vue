<template>
  <fieldset :class="cn('space-y-2', props.class)">
    <slot />
  </fieldset>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  formItemId: string;
  class?: HTMLAttributes["class"];
}>();
</script>
