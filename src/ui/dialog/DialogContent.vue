<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import {
  DialogContent,
  DialogPortal,
  type DialogPortalProps,
  useForwardPropsEmits,
  type DialogContentEmits,
  type DialogContentProps
} from "radix-vue";

import DialogClose from "./DialogClose.vue";
import DialogOverlay from "./DialogOverlay.vue";
import { cn } from "../../utils";

const props = defineProps<
  DialogContentProps &
    DialogPortalProps & {
      dismissable?: boolean;
      class?: HTMLAttributes["class"];
      classOverlay?: HTMLAttributes["class"];
    }
>();

const emits = defineEmits<DialogContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<!--
 **** BREAKING CHANGES ON UPDATE ****
 • DialogPortal doesn't receive the prop 'to' by default, this is a manually change by us
-->

<template>
  <DialogPortal :to="props.to">
    <DialogOverlay :class="props.classOverlay" />
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'fixed left-1/2 top-1/2 z-50 grid -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          props.class
        )
      "
      data-testid="dialog-window"
    >
      <slot />

      <DialogClose v-if="props.dismissable" class="absolute right-0 top-0" />
    </DialogContent>
  </DialogPortal>
</template>
