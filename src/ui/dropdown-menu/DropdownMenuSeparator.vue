<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import {
  DropdownMenuSeparator,
  type DropdownMenuSeparatorProps,
} from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  DropdownMenuSeparatorProps & {
    class?: HTMLAttributes["class"];
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <DropdownMenuSeparator
    v-bind="delegatedProps"
    :class="cn('bg-base-muted -mx-1 my-1 h-px', props.class)"
  />
</template>
