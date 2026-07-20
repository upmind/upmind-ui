<script lang="ts" setup>
import { DialogTitle, type DialogTitleProps } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn, useForwardPropsTests } from "../../utils";

const props = defineProps<
  DialogTitleProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardPropsTests(delegatedProps, {
  key: "dialog-title"
});
</script>

<template>
  <DialogTitle
    v-bind="forwardedProps"
    :class="cn('text-lg leading-none font-semibold', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
