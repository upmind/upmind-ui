<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'aspect-square h-4 w-4 border border-control text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        radioGroupItemVariants({ required })
      )
    "
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <Square
        class="h-3 w-3 fill-current text-current"
        v-if="!props.required"
      />
      <Circle class="h-2.5 w-2.5 fill-current text-current" v-else />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>

<script setup lang="ts">
import { cn } from "../../utils";
import { Square, Circle } from "lucide-vue-next";
import {
  RadioGroupIndicator,
  RadioGroupItem,
  type RadioGroupItemProps,
  useForwardProps,
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";

import { radioGroupItemVariants } from "./radioGroup.config";

const props = defineProps<
  RadioGroupItemProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>
