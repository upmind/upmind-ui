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
        :class="[styles.dialog.header, props.classHeader]"
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
          <DialogClose
            v-if="dismissable"
            iconOnly
            @click="forceClose"
            class="absolute top-0 right-0 m-4"
          />

          <DialogTitle
            v-if="title || $slots.title"
            class="mb-2 text-2xl font-normal"
          >
            <slot name="title">{{ title }}</slot>
          </DialogTitle>

          <DialogDescription
            v-if="description || $slots.description"
            class="text-muted-foreground text-sm"
          >
            <slot name="description">{{ description }}</slot>
          </DialogDescription>
        </slot>
      </DialogHeader>

      <div :class="styles.dialog.container">
        <slot />
      </div>

      <DialogFooter
        v-if="$slots.footer || dismissable || $slots.actions"
        :class="[styles.dialog.footer, props.classFooter]"
      >
        <slot name="footer">
          <slot name="close">
            <Link
              @click="forceClose"
              v-if="!noFooter"
              color="muted"
              label="Close"
            />
          </slot>
        </slot>

        <slot name="actions" />
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { useVModel } from "@vueuse/core";
import { useForwardPropsEmits } from "radix-vue";
import { computed, nextTick } from "vue";
import { usePointerEvents } from "../../utils/usePointerEvents";
import { Link } from "../link";
import config from "./dialog.config";
import Dialog from "./Dialog.vue";
import DialogClose from "./DialogClose.vue";
import DialogContent from "./DialogContent.vue";
import DialogDescription from "./DialogDescription.vue";
import DialogFooter from "./DialogFooter.vue";
import DialogHeader from "./DialogHeader.vue";
import DialogTitle from "./DialogTitle.vue";
import DialogTrigger from "./DialogTrigger.vue";
import { useStyles, cn } from "../../utils";
import { pick } from "lodash-es";
import type { DialogProps } from "./types";
import type { DialogRootEmits, DialogContentEmits } from "radix-vue";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<DialogProps>(), {
  // --- props
  open: false,
  dismissable: true,
  noFooter: false,
  title: "",
  description: "",
  // --- styles
  size: "app",
  overflow: "auto",
  fit: "contain",
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
    "as",
    "to"
  ]),
  emits
);
// ---

const meta = computed(() => ({
  size: props.size,
  overflow: props.overflow,
  fit: props.fit
}));

const styles = useStyles(["dialog"], meta, config, props.uiConfig ?? {});
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
