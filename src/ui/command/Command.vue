<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import type { ComboboxRootEmits, ComboboxRootProps } from "radix-vue";
import { ComboboxRoot, useForwardPropsEmits } from "radix-vue";
import { cn } from "../../utils";

const props = withDefaults(
  defineProps<ComboboxRootProps & { class?: HTMLAttributes["class"] }>(),
  {
    open: true,
    modelValue: ""
  }
);

const emits = defineEmits<ComboboxRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxRoot
    v-bind="forwarded"
    :class="
      cn(
        'flex h-full w-full flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground',
        props.class
      )
    "
  >
    <slot />
  </ComboboxRoot>
</template>
