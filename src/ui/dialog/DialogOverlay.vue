<script lang="ts" setup>
import { type DialogOverlayProps, DialogOverlay } from "radix-vue";
import { type HtmlHTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  DialogOverlayProps & { class?: HtmlHTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <DialogOverlay
    v-bind="delegatedProps"
    :class="
      cn(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        props.class
      )
    "
  />
</template>
