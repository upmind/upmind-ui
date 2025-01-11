<template>
  <lord-icon
    :src="iconSrc"
    :trigger="trigger"
    :delay="delay"
    :sequence="sequence"
    :class="cn(variants.icon, props.class)"
    :colors="`primary:${primaryHex},secondary:${secondaryHex}`"
  />
</template>

<span class="text-icon-primary text-icon-secondary hidden" />
<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useStyles, cn } from "../../utils";
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
  upmindUIConfig: () => ({ icon: {} }),
  class: "",
});

const meta = computed(() => ({
  size: props.size,
}));

const variants = useStyles(
  "icon",
  meta,
  config,
  props.upmindUIConfig ?? {}
) as ComputedRef<{ icon: string }>;

// ---

const iconSrc = computed(
  () => new URL(`../../assets/animations/${props.icon}.json`, import.meta.url)
);

const primaryHex = computed(() => getComputedColor("icon-primary"));
const secondaryHex = computed(() => getComputedColor("icon-secondary"));

function getComputedColor(className: string) {
  const cssVar = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${className}`)
    .trim();

  if (cssVar) {
    return cssVar;
  }

  const tempElement = document.createElement("div");
  tempElement.className = "text-" + className;
  document.body.appendChild(tempElement);

  const computedStyle = window.getComputedStyle(tempElement);
  const color = computedStyle.color;

  document.body.removeChild(tempElement);

  const rgb = color.match(/\d+/g);
  if (rgb) {
    return `#${parseInt(rgb[0]).toString(16).padStart(2, "0")}${parseInt(rgb[1]).toString(16).padStart(2, "0")}${parseInt(rgb[2]).toString(16).padStart(2, "0")}`;
  }

  return "#ffffff";
}
</script>
