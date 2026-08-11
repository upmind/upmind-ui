<script lang="ts" setup>
import { DialogDescription, type DialogDescriptionProps } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  DialogDescriptionProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <DialogDescription
    v-bind="delegatedProps"
    :class="cn('text-muted-foreground text-sm', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
