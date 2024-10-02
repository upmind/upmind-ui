<template>
  <Dialog v-bind="forwarded" :open="isOpen" @update:modelValue="onOpen">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogScrollContent
      v-bind="forwarded"
      :class="cn(variants.dialog.content, props.class)"
      :classOverlay="variants.dialog.overlay"
      @update:modelValue="onOpen"
    >
      <DialogHeader
        :class="props.classHeader"
        v-if="
          $slots.header ||
          title ||
          $slots.title ||
          description ||
          $slots.description
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

      <slot />

      <DialogFooter :class="props.classFooter">
        <slot name="footer" />

        <DialogClose @click="forceClose" v-if="$slots.close">
          <slot name="close" />
        </DialogClose>
        <slot name="actions" />
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>

<script setup lang="ts">
// --- external
import { computed, ref, watch } from "vue";
import { useForwardPropsEmits } from "radix-vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./dialog.config";

// --- components
import Dialog from "./Dialog.vue";
import DialogTrigger from "./DialogTrigger.vue";
import DialogScrollContent from "./DialogScrollContent.vue";
import DialogHeader from "./DialogHeader.vue";
import DialogFooter from "./DialogFooter.vue";
import DialogTitle from "./DialogTitle.vue";
import DialogDescription from "./DialogDescription.vue";
import DialogClose from "./DialogClose.vue";

// --- types
import type { ComputedRef } from "vue";
import type { DialogProps } from "./types";
import type { DialogRootEmits, DialogContentEmits } from "radix-vue";

const props = withDefaults(defineProps<DialogProps>(), {
  // --- props
  open: false,
  title: "",
  description: "",
  // --- variants
  size: "md",
  overflow: "auto",
  fit: "contain",
  skrim: "dark",
  // --- styles
  upwindConfig: () => ({
    dialog: {
      content: {},
      overlay: {},
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

const variants = useStyles(
  ["dialog"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ dialog: { content: string; overlay: string } }>;

// --- state
const isOpen = ref(props.open);

const onOpen = (value: boolean, force: boolean = false) => {
  debugger;
  if (props.persistent && !value && !force) return;
  isOpen.value = value;
  emits("update:open", value);
};

const forceClose = () => {
  onOpen(false, true);
};

watch(
  () => props.open,
  (value, oldValue) => {
    if (value === oldValue) return;
    isOpen.value = value;
  }
);
</script>
