<template>
  <Sheet v-bind="forwardedRoot" v-model:open="value">
    <SheetTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </SheetTrigger>

    <SheetContent
      v-bind="{ ...forwardedContent, ...testAttrs }"
      :side="side"
      :class="cn(styles.sheet.content, props.class)"
      :classOverlay="styles.sheet.overlay"
    >
      <!-- Always render the title for accessibility, even with no header -->
      <SheetTitle v-if="meta.hasHiddenTitle" class="sr-only">
        {{ title }}
      </SheetTitle>
      <SheetDescription v-if="meta.hasHiddenDescription" class="sr-only">
        {{ description }}
      </SheetDescription>

      <SheetHeader
        v-if="meta.hasHeader"
        :class="cn(styles.sheet.header, props.classHeader)"
      >
        <slot name="header">
          <SheetTitle v-if="title || $slots.title">
            <slot name="title">{{ title }}</slot>
          </SheetTitle>
          <SheetDescription v-if="description || $slots.description">
            <slot name="description">{{ description }}</slot>
          </SheetDescription>
        </slot>
      </SheetHeader>

      <div :class="cn(styles.sheet.container, props.classContent)">
        <slot />
      </div>

      <SheetFooter
        v-if="meta.hasFooter"
        :class="cn(styles.sheet.footer, props.classFooter)"
      >
        <slot name="footer">
          <SheetClose v-if="$slots.close">
            <slot name="close" />
          </SheetClose>

          <slot name="actions" />
        </slot>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script lang="ts" setup>
import { useVModel } from "@vueuse/core";
import { useForwardPropsEmits } from "radix-vue";
import { computed, useSlots } from "vue";
import config from "./sheet.config";
import Sheet from "./Sheet.vue";
import SheetClose from "./SheetClose.vue";
import SheetContent from "./SheetContent.vue";
import SheetDescription from "./SheetDescription.vue";
import SheetFooter from "./SheetFooter.vue";
import SheetHeader from "./SheetHeader.vue";
import SheetTitle from "./SheetTitle.vue";
import SheetTrigger from "./SheetTrigger.vue";
import { useStyles, cn, useTestAttrs } from "../../utils";
import { pick } from "lodash-es";
import type { SheetProps } from "./types";
import type { DialogRootEmits, DialogContentEmits } from "radix-vue";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SheetProps>(), {
  // --- props
  open: false,
  title: "",
  description: "",
  noHeader: false,
  noFooter: false,
  // --- variants
  side: "right",
  to: "body",
  // --- styles
  uiConfig: () => ({
    sheet: {
      overlay: [],
      content: [],
      header: [],
      container: [],
      footer: []
    }
  }),
  class: "",
  classHeader: "",
  classContent: "",
  classFooter: ""
});

const emits = defineEmits<DialogRootEmits & DialogContentEmits>();

const slots = useSlots();

const forwardedRoot = useForwardPropsEmits(
  computed(() => pick(props, ["defaultOpen", "modal"])),
  emits
);

const forwardedContent = useForwardPropsEmits(
  computed(() =>
    pick(props, [
      "forceMount",
      "trapFocus",
      "disableOutsidePointerEvents",
      "to"
    ])
  ),
  emits
);

const value = useVModel(props, "open", emits);

const meta = computed(() => ({
  side: props.side,
  hasHeader:
    !props.noHeader &&
    !!(
      slots.header ||
      props.title ||
      slots.title ||
      props.description ||
      slots.description
    ),
  hasHiddenTitle: !!props.title && (props.noHeader || !!slots.header),
  hasHiddenDescription:
    !!props.description && (props.noHeader || !!slots.header),
  hasFooter: !props.noFooter && !!(slots.footer || slots.close || slots.actions)
}));

const styles = useStyles(["sheet"], meta, config, props.uiConfig ?? {});

const testAttrs = useTestAttrs({ dataAttrs: props.dataAttrs });
</script>
