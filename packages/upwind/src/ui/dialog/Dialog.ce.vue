<template>
  <DialogRoot v-bind="forwarded" :open="value" @update:open="onOpen">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogContent
      v-bind="forwarded"
      :class="cn(variants.dialog.content, props.class)"
      :classOverlay="variants.dialog.overlay"
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

        <DialogClose @click="forceClose" v-if="$slots.close && !persistent">
          <slot name="close" />
        </DialogClose>

        <slot name="actions" />
      </DialogFooter>
    </DialogContent>
  </DialogRoot>
</template>

<script lang="ts" setup>
// --- external
import { computed, onUnmounted, nextTick, onMounted } from "vue";
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

const props = withDefaults(defineProps<DialogProps>(), {
  // --- props
  open: false,
  persistent: false,
  title: "",
  description: "",
  // --- variants
  size: "app",
  overflow: "auto",
  fit: "contain",
  skrim: "dark",
  // --- styles
  upwindConfig: () => ({
    dialog: {
      overlay: {},
      content: {},
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

const variants = useStyles(
  ["dialog"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  dialog: { overlay: string; content: string; header: string; footer: string };
}>;

// --- state
const value = useVModel(props, "open", emits);

const onOpen = (open: boolean, force: boolean = false) => {
  if (props.persistent && !open && !force) return;
  value.value = open;
};

onMounted(() => {
  // if (props.to) {
  //   nextTick(() => {
  //     const element = document.querySelector(props.to as string);
  //     if (element) {
  //       document.body.style.setProperty("pointer-events", "auto");
  //       (element as HTMLElement).style.setProperty("pointer-events", "none");
  //     }
  //   });
  // }
});

onUnmounted(() => {
  // if (props.to) {
  //   const element = document.querySelector(props.to as string);
  //   document.body.style.setProperty("pointer-events", "auto");
  //   (element as HTMLElement)?.style.setProperty("pointer-events", "auto");
  // }
});

const forceClose = () => {
  onOpen(false, true);
};
</script>
