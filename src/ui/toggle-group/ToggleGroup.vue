<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import {
  ToggleGroupRoot,
  type ToggleGroupRootEmits,
  type ToggleGroupRootProps,
  useForwardPropsEmits
} from "radix-vue";
import { provide, type HTMLAttributes } from "vue";
import { cn } from "../../utils";
import type { ToggleVariantProps } from "../toggle/types";

const props = defineProps<
  ToggleGroupRootProps & {
    class?: HTMLAttributes["class"];
    variant?: ToggleVariantProps["variant"];
    size?: ToggleVariantProps["size"];
  }
>();
const emits = defineEmits<ToggleGroupRootEmits>();

provide("toggleGroup", {
  variant: props.variant,
  size: props.size
});

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ToggleGroupRoot
    v-slot="slotProps"
    v-bind="forwarded"
    :class="cn('flex w-fit items-center', props.class)"
  >
    <slot v-bind="slotProps" />
  </ToggleGroupRoot>
</template>
