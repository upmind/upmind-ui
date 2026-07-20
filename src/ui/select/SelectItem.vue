<script setup lang="ts">
import { SelectItem, SelectItemText } from "radix-vue";
import { computed } from "vue";
import { cn, useForwardPropsTests } from "../../utils";
import type { SelectItemProps } from "./types";

const props = defineProps<SelectItemProps>();

const delegatedProps = computed(() => {
  const { class: _, dataAttrs: __, id: ___, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardPropsTests(delegatedProps, {
  key: "select-item",
  value: [props.id, props.value],
  dataAttrs: props.dataAttrs
});
</script>

<template>
  <SelectItem
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex w-full cursor-default items-center rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        props.class
      )
    "
  >
    <slot name="indicator" />

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
