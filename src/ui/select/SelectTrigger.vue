<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import {
  SelectIcon,
  SelectTrigger,
  type SelectTriggerProps,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  SelectTriggerProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        props.class,
        'placeholder:text-muted-foreground flex items-center justify-between text-start text-sm disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate'
      )
    "
  >
    <slot />
    <slot name="icon">
      <SelectIcon as-child>
        <ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
      </SelectIcon>
    </slot>
  </SelectTrigger>
</template>
