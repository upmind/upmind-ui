<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import {
  ToggleGroupItem,
  type ToggleGroupItemProps,
  useForwardProps
} from "radix-vue";
import { inject, type HTMLAttributes } from "vue";
import { toggleVariants } from "../toggle/toggle.config";
import { cn } from "../../utils";
import type { ToggleVariantProps } from "../toggle/types";

const props = defineProps<
  ToggleGroupItemProps & {
    class?: HTMLAttributes["class"];
    variant?: ToggleVariantProps["variant"];
    size?: ToggleVariantProps["size"];
  }
>();

const context = inject<ToggleVariantProps>("toggleGroup");

const delegatedProps = reactiveOmit(props, "class", "size", "variant");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ToggleGroupItem
    v-slot="slotProps"
    v-bind="forwardedProps"
    :class="
      cn(
        toggleVariants({
          variant: context?.variant || variant,
          size: context?.size || size
        }),
        props.class
      )
    "
  >
    <slot v-bind="slotProps" />
  </ToggleGroupItem>
</template>
