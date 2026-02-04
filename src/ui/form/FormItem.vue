<template>
  <fieldset :class="cn('space-y-2', props.class)">
    <slot />
  </fieldset>
</template>

<script lang="ts" setup>
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  formItemId: string;
  class?: HTMLAttributes["class"];
}>();
</script>
