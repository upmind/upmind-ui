<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import {
  SelectIcon,
  SelectTrigger,
  type SelectTriggerProps,
  useForwardProps
} from "radix-vue";
import { ChevronDown } from "lucide-vue-next";
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
        'focus:ring-ring flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-start text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate',
        props.class
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
