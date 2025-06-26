<template>
  <lord-icon
    v-if="iconData"
    :src="iconData"
    :trigger="trigger"
    :delay="delay"
    :sequence="sequence"
    :class="cn(styles.iconAnimated, props.class)"
    :colors="`primary:${primaryHex},secondary:${secondaryHex}`"
  />
</template>

<span class="text-icon-primary text-icon-secondary hidden" />
<script lang="ts" setup>
// --- external
import { onMounted, computed, ref, watch } from "vue";
import { find } from "lodash-es";

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
  uiConfig: () => ({ iconAnimated: [] }),
  class: "",
});

const meta = computed(() => ({
  size: props.size,
}));

const iconData = ref("");

const icons = import.meta.glob("@animations/**/*.json", {
  query: "?url",
  eager: false,
  import: "default",
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

// ---

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
