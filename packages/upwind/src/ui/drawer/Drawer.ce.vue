<template>
  <Drawer v-bind="forwarded">
    <DrawerTrigger>
      <slot name="trigger" />
    </DrawerTrigger>
    <DrawerContent v-bind="forwarded">
      <div :class="cn(variants.container, props.class)">
        <DrawerHeader>
          <DrawerTitle>{{ title }}</DrawerTitle>
          <DrawerDescription>{{ description }}</DrawerDescription>
        </DrawerHeader>
        <div class="p-4 pb-0">
          <slot />
        </div>
        <DrawerFooter>
          <slot name="footer" />

          <DrawerClose v-if="showClose">
            <slot name="close">
              <!-- Shorthand block not working? -->
              <Button label="Close" block />
            </slot>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
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
  title: "",
  description: "",
  showClose: true,
  // --- variants
  maxWidth: "md",
  // --- styles
  upwindConfig: () => ({ alert: {} }),
  class: "",
});

const emits = defineEmits<DrawerRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  maxWidth: props.maxWidth,
}));

const variants = useStyles(
  "container",
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ container: string }>;
</script>
