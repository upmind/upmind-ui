<template>
  <component
    :is="props.as"
    :class="cn(styles.ribbon, props.class)"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./ribbon.config";
import {
  RIBBON_BACKGROUND,
  RIBBON_BORDER,
  RIBBON_STICKY,
  RIBBON_HEIGHT
} from "./types";
import type { RibbonProps } from "./types";

const props = withDefaults(defineProps<RibbonProps>(), {
  as: "section",
  background: RIBBON_BACKGROUND.CANVAS,
  border: RIBBON_BORDER.BOTTOM,
  sticky: RIBBON_STICKY.NONE,
  height: RIBBON_HEIGHT.AUTO
});

const meta = computed(() => ({
  background: props.background,
  border: props.border,
  sticky: props.sticky,
  height: props.height
}));

const styles = useStyles(["ribbon"], meta, config);
</script>
