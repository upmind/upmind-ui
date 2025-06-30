<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import {
  DialogContent,
  DialogPortal,
  useForwardPropsEmits,
  type DialogContentEmits,
  type DialogContentProps
} from "radix-vue";

import DialogClose from "./DialogClose.vue";
import DialogOverlay from "./DialogOverlay.vue";
import { cn } from "../../utils";

const props = defineProps<
  DialogContentProps & {
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

<template>
  <DialogPortal>
    <DialogOverlay
      :class="cn('grid place-items-center overflow-y-auto', props.classOverlay)"
    >
      <DialogContent
        v-bind="forwarded"
        :class="
          cn(
            'max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)_auto] p-0 sm:max-w-[425px]',
            'border-border relative z-50 my-8 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full',
            props.class
          )
        "
        @pointer-down-outside="
          event => {
            const originalEvent = event.detail.originalEvent;
            const target = originalEvent.target as HTMLElement;
            if (
              originalEvent.offsetX > target.clientWidth ||
              originalEvent.offsetY > target.clientHeight
            ) {
              event.preventDefault();
            }
          }
        "
      >
        <slot />

        <DialogClose v-if="props.dismissable" class="absolute right-0 top-0" />
      </DialogContent>
    </DialogOverlay>
  </DialogPortal>
</template>
