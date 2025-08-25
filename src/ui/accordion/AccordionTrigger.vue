<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import {
  AccordionHeader,
  AccordionTrigger,
  type AccordionTriggerProps
} from "radix-vue";
import { ChevronDown } from "lucide-vue-next";
import { cn } from "../../utils";

const props = defineProps<
  AccordionTriggerProps & { class?: HTMLAttributes["class"]; open?: boolean }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <AccordionHeader as="div" class="flex">
    <AccordionTrigger
      v-bind="delegatedProps"
      :class="
        cn(
          'flex flex-1 items-center justify-between rounded py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
          props.class
        )
      "
      data-testid="accordion-trigger"
      :data-state="props.open ? 'open' : 'closed'"
    >
      <slot />
      <slot name="icon">
        <ChevronDown
          class="h-4 w-4 shrink-0 transition-transform duration-200"
        />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>
