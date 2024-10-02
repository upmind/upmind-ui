<template>
  <Drawer v-bind="forwarded" :open="isOpen" @update:modelValue="onOpen">
    <DrawerTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DrawerTrigger>

    <DrawerContent
      v-bind="forwarded"
      :class="cn(variants.drawer.content, props.class)"
      :classOverlay="variants.drawer.overlay"
    >
      <DrawerHeader
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
          <DrawerTitle v-if="title || $slots.title" v-bind="forwarded">
            <slot name="title">{{ title }}</slot>
          </DrawerTitle>
          <DrawerDescription
            v-if="description || $slots.description"
            v-bind="forwarded"
          >
            <slot name="description">{{ description }}</slot>
          </DrawerDescription>
        </slot>
      </DrawerHeader>

      <div
        :class="cn('max-h-[75vh] overflow-auto p-4 pb-0', props.classContent)"
      >
        <slot />
      </div>

      <DrawerFooter :class="props.classFooter">
        <slot name="footer" />

        <DrawerClose v-if="$slots.close" @click="forceClose">
          <slot name="close" />
        </DrawerClose>

        <slot name="actions" />
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
// --- external
import { computed, ref, watch } from "vue";
import { useForwardPropsEmits } from "radix-vue";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./drawer.config";

// --- components
import Drawer from "./Drawer.vue";
import DrawerContent from "./DrawerContent.vue";
import DrawerDescription from "./DrawerDescription.vue";
import DrawerFooter from "./DrawerFooter.vue";
import DrawerHeader from "./DrawerHeader.vue";
import DrawerTitle from "./DrawerTitle.vue";
import { DrawerTrigger, DrawerClose } from "vaul-vue";

// --- types
import type { ComputedRef } from "vue";
import type { DrawerProps } from "./types";
import type { DrawerRootEmits } from "vaul-vue";

const props = withDefaults(defineProps<DrawerProps>(), {
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
    drawer: {
      content: {},
      overlay: {},
    },
  }),
  class: "",
  classHeader: "",
  classContent: "",
  classFooter: "",
});

const emits = defineEmits<DrawerRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  size: props.size,
  fit: props.fit,
  skrim: props.skrim,
}));

const variants = useStyles(
  ["drawer"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ drawer: { content: string; overlay: string } }>;

// --- state
const isOpen = ref(props.open);

const onOpen = (value: boolean, force: boolean = false) => {
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
