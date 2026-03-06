<template>
  <ToggleGroupItem
    v-bind="forwardedProps"
    :key="index"
    :class="
      cn(
        'group m-0! flex w-full items-start text-start outline-none select-none',
        props.itemClass
      )
    "
  >
    <slot />
  </ToggleGroupItem>
</template>

<script setup lang="ts">
import {
  ToggleGroupItem,
  useForwardProps,
  type ToggleGroupItemProps
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  ToggleGroupItemProps & {
    index?: number;
    class?: HTMLAttributes["class"];
    itemClass?: HTMLAttributes["class"];
    noInput?: boolean;
    checked?: boolean;
    dataHover: boolean;
    dataFocus: boolean;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>
