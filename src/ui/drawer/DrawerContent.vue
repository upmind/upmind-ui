<script lang="ts" setup>
import { DrawerContent, DrawerPortal } from "vaul-vue";
import type {
  DialogContentEmits,
  DialogContentProps,
  DialogPortalProps
} from "radix-vue";
import { useForwardPropsEmits } from "radix-vue";
import type { HTMLAttributes } from "vue";
import DrawerOverlay from "./DrawerOverlay.vue";
import { cn } from "../../utils";

const props = defineProps<
  DialogContentProps &
    DialogPortalProps & {
      class?: HTMLAttributes["class"];
      classOverlay?: HTMLAttributes["class"];
    }
>();
const emits = defineEmits<
  DialogContentEmits & {
    close: [];
  }
>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<!--
 **** BREAKING CHANGES ON UPDATE ****
 • DrawerPortal doesn't receive the prop 'to' by default, this is a manually change by us
 • DrawerContent emits 'close' as set the dialog to not be dismissable so that we can handle this ourselves (they use outside click which doesn't work with toasts)
-->

<template>
  <DrawerPortal :to="props.to">
    <DrawerOverlay :class="props.classOverlay" @click="() => emits('close')" />
    <DrawerContent
      v-bind="forwarded"
      :class="
        cn(
          'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[90vh] flex-col rounded-t-[10px] border bg-background',
          props.class
        )
      "
    >
      <div
        class="drag-handle bg-base-muted mx-auto mt-4 h-2 w-[100px] rounded-full"
      />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
