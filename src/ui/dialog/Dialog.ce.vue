<template>
  <DialogRoot v-bind="forwarded" :open="value" @update:open="onOpen">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogContent
      v-bind="forwarded"
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
            v-bind="forwarded"
            class="text-lg font-semibold leading-none tracking-tight"
          >
            <slot name="title">{{ title }}</slot>
          </DialogTitle>

          <DialogDescription
            v-if="description || $slots.description"
            v-bind="forwarded"
            class="mt-2 text-sm text-muted-foreground"
          >
            <slot name="description">{{ description }}</slot>
          </DialogDescription>
        </slot>
      </DialogHeader>

      <div class="grid gap-4 overflow-y-auto px-1 py-4">
        <div class="flex flex-col justify-start">
          <slot />
        </div>
      </div>

      <DialogFooter :class="props.classFooter">
        <slot name="footer" />

        <DialogClose @click="forceClose" v-if="$slots.close && dismissable">
          <slot name="close" />
        </DialogClose>

        <slot name="actions" />
      </DialogFooter>
    </DialogContent>
  </DialogRoot>
</template>

<script lang="ts" setup>
// --- external
import { computed, nextTick } from "vue";
import { useForwardPropsEmits } from "radix-vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./dialog.config";

// --- components
import { DialogRoot } from "radix-vue";
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
import { usePointerEvents } from "../../utils/usePointerEvents";

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
      footer: [],
    },
  }),
  class: "",
  classHeader: "",
  classContent: "",
  classFooter: "",
});

const emits = defineEmits<DialogRootEmits & DialogContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  size: props.size,
  overflow: props.overflow,
  fit: props.fit,
  skrim: props.skrim,
}));

const styles = useStyles(
  ["dialog"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  dialog: { overlay: string; content: string; header: string; footer: string };
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
  nextTick(() => handlePointerEvents(open));
};

const forceClose = () => {
  onOpen(false, true);
};
</script>
