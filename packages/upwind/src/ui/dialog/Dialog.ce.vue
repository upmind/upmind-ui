<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->
  <DialogRoot v-bind="forwarded">
    <DialogTrigger v-bind="forwarded" as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogScrollContent
      v-bind="forwarded"
      :class="cn(variants.content, props.class)"
    >
      <DialogHeader class="flex flex-col gap-y-2 text-center sm:text-left">
        <div v-if="title || $slots.title || description || $slots.description">
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
        </div>
      </DialogHeader>

      <slot />

      <DialogFooter
        class="flex flex-col-reverse items-baseline sm:flex-row sm:justify-end sm:gap-x-2"
      >
        <slot name="footer" />

        <DialogClose @click="forceClose">
          <slot name="close" />
        </DialogClose>
      </DialogFooter>
    </DialogScrollContent>
  </DialogRoot>
</template>

<script setup lang="ts">
// --- external
import { computed, ref, watch } from "vue";
import { useForwardPropsEmits } from "radix-vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./dialog.config";

// --- components
import DialogRoot from "./Dialog.vue";
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
  title: "",
  description: "",
  modelValue: false,
  // --- variants
  size: "md",
  overflow: "auto",
  fit: "contain",
  skrim: "dark",
  // --- styles
  upwindConfig: () => ({ alert: {} }),
  class: "",
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
  ["content", "overlay"],
  meta,
  config,
  props.upwindConfig
) as ComputedRef<{ content: string }>;

const open = ref(props.modelValue);

const onOpen = (value: boolean, force: boolean = false) => {
  if (props.persistent && !value && !force) return;
  open.value = value;
  emits("update:open", value);
};

const forceClose = () => {
  onOpen(false, true);
};

watch(
  () => props.modelValue,
  (value, oldValue) => {
    if (value === oldValue) return;
    open.value = value;
  }
);
</script>
