<script lang="ts" setup>
import { useForwardPropsEmits } from "radix-vue";
import { DrawerContent, DrawerPortal } from "vaul-vue";
import { type HTMLAttributes, useTemplateRef } from "vue";
import DrawerOverlay from "./DrawerOverlay.vue";
import { cn, providePortalTarget, useTestAttrs } from "../../utils";
import type {
  DialogContentEmits,
  DialogContentProps,
  DialogPortalProps
} from "radix-vue";

const props = withDefaults(
  defineProps<
    DialogContentProps &
      DialogPortalProps & {
        class?: HTMLAttributes["class"];
        classOverlay?: HTMLAttributes["class"];
        dismissible?: boolean;
      }
  >(),
  { dismissible: true }
);
const emits = defineEmits<
  DialogContentEmits & {
    close: [];
  }
>();

const testAttrs = useTestAttrs({
  key: "drawer-content"
});

const forwarded = useForwardPropsEmits({ ...props, ...testAttrs }, emits);

function onOverlayClick() {
  if (props.dismissible) emits("close");
}

// Expose the content element to descendant overlays so their portals teleport
// into this drawer's stacking context instead of competing at body level.
providePortalTarget(useTemplateRef("content"));
</script>

<!--
 **** BREAKING CHANGES ON UPDATE ****
 • DrawerPortal doesn't receive the prop 'to' by default, this is a manually change by us
 • DrawerContent emits 'close' as set the dialog to not be dismissable so that we can handle this ourselves (they use outside click which doesn't work with toasts)
-->

<template>
  <DrawerPortal :to="props.to">
    <DrawerOverlay :class="props.classOverlay" @click="onOverlayClick" />
    <DrawerContent
      ref="content"
      v-bind="forwarded"
      :class="
        cn(
          'bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[90vh] flex-col rounded-t-[10px] border',
          props.class
        )
      "
    >
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
