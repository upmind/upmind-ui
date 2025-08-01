<template>
  <Dialog v-bind="forwardedRoot" :open="value" @update:open="onOpen">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogContent
      v-bind="forwardedContent"
      :class="cn(styles.dialog.content, props.class)"
      :classOverlay="styles.dialog.overlay"
      @update:open="onOpen"
    >
      <DialogHeader
        :class="props.classHeader"
        v-if="
          !props.noHeader &&
          ($slots.header ||
            title ||
            $slots.title ||
            description ||
            $slots.description)
        "
      >
        <slot name="header">
          <DialogTitle
            v-if="title || $slots.title"
            class="mb-2 text-2xl font-normal"
          >
            <slot name="title">{{ title }}</slot>
          </DialogTitle>

          <DialogDescription
            v-if="description || $slots.description"
            class="text-sm text-muted-foreground"
          >
            <slot name="description">{{ description }}</slot>
          </DialogDescription>
        </slot>
      </DialogHeader>

      <div :class="cn(styles.dialog.container)">
        <div class="flex flex-col justify-start">
          <slot />
        </div>
      </div>

      <DialogFooter
        v-if="$slots.footer || ($slots.close && dismissable) || $slots.actions"
        :class="props.classFooter"
      >
        <slot name="footer" />

        <DialogClose @click="forceClose" v-if="$slots.close && dismissable">
          <slot name="close" />
        </DialogClose>

        <slot name="actions" />
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
// --- external
import { computed, nextTick } from "vue";
import { useForwardPropsEmits, useForwardProps } from "radix-vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./dialog.config";

// --- components
import Dialog from "./Dialog.vue";
import DialogContent from "./DialogContent.vue";
import DialogHeader from "./DialogHeader.vue";
import DialogFooter from "./DialogFooter.vue";
import DialogTitle from "./DialogTitle.vue";
import DialogDescription from "./DialogDescription.vue";
import DialogTrigger from "./DialogTrigger.vue";
import DialogClose from "./DialogClose.vue";

// --- types
import type { ComputedRef } from "vue";
import type { DialogProps } from "./types";
import type { DialogRootEmits, DialogContentEmits } from "radix-vue";

// --- utils
import { pick } from "lodash-es";
import { usePointerEvents } from "../../utils/usePointerEvents";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<DialogProps>(), {
  // --- props
  open: false,
  dismissable: true,
  title: "",
  description: "",
  // --- styles
  size: "app",
  overflow: "auto",
  fit: "contain",
  skrim: "dark",
  to: "body",
  // --- styles
  uiConfig: () => ({
    dialog: {
      overlay: [],
      content: [],
      header: [],
      footer: []
    }
  }),
  class: "",
  classHeader: "",
  classContent: "",
  classFooter: ""
});

const emits = defineEmits<DialogRootEmits & DialogContentEmits>();

const forwardedRoot = useForwardPropsEmits(
  pick(props, ["open", "defaultOpen", "modal"]),
  emits
);

const forwardedContent = useForwardPropsEmits(
  pick(props, [
    "forceMount",
    "trapFocus",
    "disableOutsidePointerEvents",
    "asChild",
    "as"
  ]),
  emits
);

// ---

const meta = computed(() => ({
  size: props.size,
  overflow: props.overflow,
  fit: props.fit,
  skrim: props.skrim
}));

const styles = useStyles(
  ["dialog"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  dialog: {
    overlay: string;
    content: string;
    header: string;
    footer: string;
    container: string;
  };
}>;

// --- state
const value = useVModel(props, "open", emits);

// By default, Dialog will set the Body element to pointer-events: none;
// This prevents the whole body from being clickable.
// As this is a result of an external library that we can't override, we need to handle this manually.
// With handlePointerEvents, pointer-events: none; is moved to props.to..
const { handlePointerEvents } = usePointerEvents(value, props.to);

const onOpen = (open: boolean, force: boolean = false) => {
  if (!props.dismissable && !open && !force) return;
  value.value = open;
  emits("update:open", open);
  nextTick(() => handlePointerEvents(open));
};

const forceClose = () => {
  onOpen(false, true);
};
</script>
