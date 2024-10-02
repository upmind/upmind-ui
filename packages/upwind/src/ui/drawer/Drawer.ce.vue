<template>
  <Drawer v-bind="forwarded" v-model:open="isOpen">
    <DrawerTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DrawerTrigger>

    <DrawerContent
      v-bind="forwarded"
      :class="cn(variants.drawer.container, props.class)"
      :classOverlay="variants.drawer.overlay"
    >
      <DrawerHeader
        :class="props.classHeader"
        v-if="$slots.header || title || description"
      >
        <slot name="header">
          <DrawerTitle>{{ title }}</DrawerTitle>
          <DrawerDescription>{{ description }}</DrawerDescription>
        </slot>
      </DrawerHeader>

      <div
        :class="cn('max-h-[75vh] overflow-auto p-4 pb-0', props.classContent)"
      >
        <slot />
      </div>

      <DrawerFooter :class="props.classFooter">
        <slot name="footer" />

        <DrawerClose v-if="$slots.close">
          <slot name="close">
            <!-- Shorthand block not working? -->
            <Button label="Close" block />
          </slot>
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

// --- types
import type { ComputedRef } from "vue";
import type { DrawerProps } from "./types";
import type { DrawerRootEmits } from "vaul-vue";

// --- components
import Drawer from "./Drawer.vue";
import DrawerContent from "./DrawerContent.vue";
import DrawerDescription from "./DrawerDescription.vue";
import DrawerFooter from "./DrawerFooter.vue";
import DrawerHeader from "./DrawerHeader.vue";
import DrawerTitle from "./DrawerTitle.vue";
import Button from "../button/Button.ce.vue";
import { DrawerTrigger, DrawerClose } from "vaul-vue";

const props = withDefaults(defineProps<DrawerProps>(), {
  // --- props
  open: false,
  title: "",
  description: "",

  // --- variants
  size: "md",
  skrim: "dark",
  // --- styles
  upwindConfig: () => ({
    drawer: {
      container: {},
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
  skrim: props.skrim,
}));

const variants = useStyles(
  ["drawer"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ drawer: { container: string; overlay: string } }>;

// --- state
const isOpen = ref(props.open);

watch(
  () => props.open,
  value => (isOpen.value = value)
);
</script>
