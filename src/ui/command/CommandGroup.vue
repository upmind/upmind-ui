<script lang="ts" setup>
import { ComboboxGroup, ComboboxLabel } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";
import type { ComboboxGroupProps } from "radix-vue";

const props = defineProps<
  ComboboxGroupProps & {
    class?: HTMLAttributes["class"];
    heading?: string;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <ComboboxGroup
    v-bind="delegatedProps"
    :class="
      cn(
        '[&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-2 text-base',
        props.class
      )
    "
  >
    <ComboboxLabel
      v-if="heading"
      class="text-muted-foreground px-2 py-1.5 text-xs font-medium"
    >
      {{ heading }}
    </ComboboxLabel>
    <slot />
  </ComboboxGroup>
</template>
