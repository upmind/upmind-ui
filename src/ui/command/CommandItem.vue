<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import type { ComboboxItemEmits, ComboboxItemProps } from "radix-vue";
import { ComboboxItem, useForwardPropsEmits } from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  ComboboxItemProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<ComboboxItemEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxItem
    v-bind="forwarded"
    :class="
      cn(
        'data-highlighted:bg-accent data-highlighted:text-accent-foreground rounded-xs outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50 relative flex cursor-default select-none items-center px-2 py-1.5 text-sm',
        props.class
      )
    "
  >
    <slot />
  </ComboboxItem>
</template>
