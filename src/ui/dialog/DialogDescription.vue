<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import {
  DialogDescription,
  type DialogDescriptionProps,
  useForwardProps
} from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  DialogDescriptionProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogDescription
    v-bind="forwardedProps"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
