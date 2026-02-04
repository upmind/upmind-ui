<script lang="ts" setup>
import { useForwardPropsEmits } from "radix-vue";
import { DrawerContent, DrawerPortal } from "vaul-vue";
import DrawerOverlay from "./DrawerOverlay.vue";
import { cn } from "../../utils";
import type {
  DialogContentEmits,
  DialogContentProps,
  DialogPortalProps
} from "radix-vue";
import type { HTMLAttributes } from "vue";

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
          'bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[90vh] flex-col rounded-t-[10px] border',
          props.class
        )
      "
      data-testid="drawer-content"
    >
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
