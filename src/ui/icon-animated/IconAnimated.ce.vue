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
import { ICON_STROKE_KEY } from "../../utils/injectionKeys";

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
const strokeData = inject(ICON_STROKE_KEY);

const stroke = computed(() => {
  return strokeData?.value || "regular";
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
