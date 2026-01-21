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

// --- internal
import { useStyles, cn, getComputedColor } from "../../utils";
import config from "./iconAnimated.config";
import { loadAnimation } from "./utils/animationLoader";

// --- types
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
  // Examples: 1px → 1 (light), 1.5px → 2 (regular), 2px → 2 (regular)
  return Math.min(Math.max(Math.ceil(pxValue), 1), 3);
});

const loadIcon = async () => {
  const url = await loadAnimation(props.icon);
  if (url) {
    iconData.value = url;
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

const styles = useStyles("iconAnimated", meta, config, props.uiConfig ?? {});

const primaryHex = computed(() => {
  const _ = styles.value;
  return getComputedColor("icon-primary");
});

const neutralHex = computed(() => {
  const _ = styles.value;
  return getComputedColor("icon-neutral");
});
</script>
