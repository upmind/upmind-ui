<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import {
  AccordionItem,
  type AccordionItemProps,
  useForwardProps
} from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  AccordionItemProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <AccordionItem
    v-bind="forwardedProps"
    :class="cn('border-b', props.class)"
    data-testid="accordion-item"
  >
    <slot />
  </AccordionItem>
</template>
