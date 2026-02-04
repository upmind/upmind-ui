<script lang="ts" setup>
import { Separator, type SeparatorProps } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  SeparatorProps & { class?: HTMLAttributes["class"]; label?: string }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <Separator
    v-bind="delegatedProps"
    :class="
      cn(
        'border-control-default relative shrink-0 border',
        props.orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        props.class
      )
    "
  >
    <span
      v-if="props.label"
      :class="
        cn(
          'bg-background text-muted-foreground absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-xs',
          props.orientation === 'vertical' ? 'w-px px-1 py-2' : 'h-px px-2 py-1'
        )
      "
      >{{ props.label }}</span
    >
  </Separator>
</template>
