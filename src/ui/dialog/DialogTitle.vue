<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import { DialogTitle, type DialogTitleProps, useForwardProps } from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  DialogTitleProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogTitle
    v-bind="forwardedProps"
    :class="cn('text-lg leading-none font-semibold', props.class)"
    data-testid="dialog-title"
  >
    <slot />
  </DialogTitle>
</template>
