<template>
  <lord-icon
    v-if="iconData"
    :src="iconData"
    :trigger="trigger"
    :delay="delay"
    :sequence="sequence"
    :stroke="stroke"
    :class="cn(styles.iconAnimated, props.class)"
    :colors="`primary:${neutralHex},secondary:${primaryHex}`"
  />
</template>

<span class="text-icon-primary text-icon-neutral hidden" />
<script lang="ts" setup>
// --- external
import { onMounted, computed, ref, watch, inject } from "vue";
import { find } from "lodash-es";

// --- internal
import { useStyles, cn, getComputedColor } from "../../utils";
import config from "./iconAnimated.config";

// --- types
import type { ComputedRef } from "vue";
import type { AnimatedIconProps } from "./types";

const props = withDefaults(defineProps<AnimatedIconProps>(), {
  trigger: "loop",
  delay: 1000,
  // ---
  size: "md",
  // ---
  uiConfig: () => ({ iconAnimated: [] }),
  class: ""
});

const meta = computed(() => ({
  size: props.size
}));

const iconData = ref("");

const stroke = computed(() => {
  // Get the stroke variable value for icons
  const cssValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--stroke-icon")
    .trim();

  // Parse the value, defaulting to 2 if invalid or missing
  const pxValue = parseFloat(cssValue) || 2;

  // Apply bounds checking with Math functions to map to stroke weights:
  // Math.ceil() - Round up to nearest integer (ensures whole pixel values)
  // Math.max() - Ensure minimum value of 1 = light stroke weight
  // Math.min() - Ensure maximum value of 3 = bold stroke weight
  // Final result: 1 = light, 2 = regular, 3 = bold
  return Math.min(Math.max(Math.ceil(pxValue), 1), 3);
});

const icons = import.meta.glob("@animations/**/*.json", {
  query: "?url",
  eager: false,
  import: "default"
});

const loadIcon = async () => {
  const path = find(Object.keys(icons), path =>
    path.includes(`/${props.icon}.json`)
  );

  if (path) {
    iconData.value = (await icons[path]()) as string;
  } else {
    // console.error(`Animated icon not found: ${props.icon}`);
  }
};

onMounted(() => {
  loadIcon();
});

watch(
  () => props.icon,
  () => {
    loadIcon();
  }
);

const styles = useStyles(
  "iconAnimated",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ iconAnimated: string }>;

const primaryHex = computed(() => {
  const _ = styles.value;
  return getComputedColor("icon-primary");
});

const neutralHex = computed(() => {
  const _ = styles.value;
  return getComputedColor("icon-neutral");
});
</script>
