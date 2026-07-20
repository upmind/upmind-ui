<script lang="ts" setup>
import { AccordionItem, type AccordionItemProps } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn, useForwardPropsTests } from "../../utils";

const props = defineProps<
  AccordionItemProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardPropsTests(delegatedProps, {
  key: "accordion-item",
  value: props.value
});
</script>

<template>
  <AccordionItem v-bind="forwardedProps" :class="cn('border-b', props.class)">
    <slot />
  </AccordionItem>
</template>
