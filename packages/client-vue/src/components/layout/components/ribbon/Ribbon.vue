<template>
  <component
    :is="props.as"
    :class="
      cn(
        ribbonVariants({
          background: props.background,
          border: props.border,
          sticky: props.sticky,
          height: props.height
        }),
        props.class
      )
    "
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import {
  RIBBON_BACKGROUND,
  RIBBON_BORDER,
  RIBBON_STICKY,
  RIBBON_HEIGHT
} from "./types";
import { ribbonVariants } from "./variants";
import type { RibbonProps } from "./types";

const props = withDefaults(defineProps<RibbonProps>(), {
  as: "section",
  background: RIBBON_BACKGROUND.CANVAS,
  border: RIBBON_BORDER.BOTTOM,
  sticky: RIBBON_STICKY.NONE,
  height: RIBBON_HEIGHT.AUTO
});
</script>
