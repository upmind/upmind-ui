<script lang="ts" setup>
import {
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  type DialogPortalProps
} from "radix-vue";
import { type HTMLAttributes, computed, useTemplateRef } from "vue";
import { sheetVariants } from "./sheet.config";
import SheetClose from "./SheetClose.vue";
import {
  cn,
  providePortalTarget,
  useForwardPropsEmitsTests
} from "../../utils";
import type { SheetVariants } from "./types";

defineOptions({ inheritAttrs: false });

const props = defineProps<
  DialogContentProps &
    DialogPortalProps & {
      class?: HTMLAttributes["class"];
      classOverlay?: HTMLAttributes["class"];
      side?: SheetVariants["side"];
    }
>();

const emits = defineEmits<DialogContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, classOverlay: __, side: ___, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmitsTests(delegatedProps, emits, {
  key: "sheet-content"
});

// Expose the content element to descendant overlays so their portals teleport
// into this sheet's stacking context instead of competing at body level.
providePortalTarget(useTemplateRef("content"));
</script>

<!--
 **** BREAKING CHANGES ON UPDATE ****
 • DialogPortal doesn't receive the prop 'to' by default, this is a manual change by us
-->

<template>
  <DialogPortal :to="props.to">
    <DialogOverlay
      :class="
        cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-overlay fixed inset-0 z-50',
          props.classOverlay
        )
      "
    />
    <DialogContent
      ref="content"
      :class="cn(sheetVariants({ side: props.side }), props.class)"
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot />

      <SheetClose class="absolute top-4 right-4" />
    </DialogContent>
  </DialogPortal>
</template>
