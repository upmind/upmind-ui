<script lang="ts" setup>
import { DialogTitle, type DialogTitleProps, useForwardProps } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn, useTestAttrs } from "../../utils";

const props = defineProps<
  DialogTitleProps & { class?: HTMLAttributes["class"] }
>();

const testAttrs = useTestAttrs({
  key: "dialog-title"
});

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return { ...delegated, ...testAttrs };
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogTitle
    v-bind="forwardedProps"
    :class="cn('text-lg leading-none font-semibold', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
