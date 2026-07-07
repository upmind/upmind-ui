<script lang="ts" setup>
import {
  AccordionItem,
  type AccordionItemProps,
  useForwardProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn, useTestAttrs } from "../../utils";

const props = defineProps<
  AccordionItemProps & { class?: HTMLAttributes["class"] }
>();

const testAttrs = useTestAttrs({
  key: "accordion-item",
  value: props.value
});

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return { ...delegated, ...testAttrs };
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <AccordionItem v-bind="forwardedProps" :class="cn('border-b', props.class)">
    <slot />
  </AccordionItem>
</template>
