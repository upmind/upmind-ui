<script lang="ts" setup>
import { vResizeObserver } from "@vueuse/components";
import { type HTMLAttributes, computed, ref } from "vue";
import { AccordionContent, type AccordionContentProps } from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  AccordionContentProps & {
    class?: HTMLAttributes["class"];
    contentClass?: HTMLAttributes["class"];
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const contentRef = ref<InstanceType<typeof AccordionContent>>();

// Create our own --accordion-content-height CSS variable as --radix-collapsible-content-height is unreliable
const updateContentHeight = (entries: readonly ResizeObserverEntry[]) => {
  if (entries.length === 0 || !contentRef.value?.$el) return;

  const entry = entries[0];
  const height = entry.target.clientHeight;

  const cssVarName = "--accordion-content-height";
  contentRef.value.$el.style.setProperty(cssVarName, `${height}px`);
};
</script>

<template>
  <AccordionContent
    ref="contentRef"
    v-bind="delegatedProps"
    :class="
      cn(
        'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm transition-all',
        props.contentClass
      )
    "
    data-testid="accordion-content"
  >
    <div
      v-resize-observer="updateContentHeight"
      :class="cn('pt-0 pb-4', props.class)"
    >
      <slot />
    </div>
  </AccordionContent>
</template>
