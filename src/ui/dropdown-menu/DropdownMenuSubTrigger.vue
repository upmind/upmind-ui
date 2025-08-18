<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import {
  DropdownMenuSubTrigger,
  type DropdownMenuSubTriggerProps,
  useForwardProps
} from "radix-vue";
import { ChevronRight } from "lucide-vue-next";
import { cn } from "../../utils";

const props = defineProps<
  DropdownMenuSubTriggerProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DropdownMenuSubTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'focus:bg-accent data-[state=open]:bg-accent rounded-xs outline-hidden flex cursor-default select-none items-center px-2 py-1.5 text-sm',
        props.class
      )
    "
  >
    <slot />
    <ChevronRight class="ml-auto h-4 w-4" />
  </DropdownMenuSubTrigger>
</template>
