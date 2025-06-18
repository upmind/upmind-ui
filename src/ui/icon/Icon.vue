<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <i
    v-if="svg"
    class="icon"
    :class="cn(styles.icon, props.class)"
    v-html="svg"
    role="img"
    :aria-label="`${isObject(icon) ? icon.name : icon} icon`"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watchEffect } from "vue";

// --- internal

import {
  useStyles,
  cn,
  //stylesheet
} from "../../utils";
import config from "./icon.config";

// --- utils
import { find, isObject, endsWith, isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { IconProps } from ".";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<IconProps>(), {
  //  --- styles
  size: "auto",
  // --- styles
  uiConfig: () => ({ icon: [] }),
  class: "",
});

// Add emit definition
const emit = defineEmits<{
  error: [Error];
}>();

const meta = computed(() => ({
  size: props.size,
  // ---
  hasIcon: !isEmpty(props.icon),
}));

const styles = useStyles(
  "icon",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ icon: string }>;

const icons = import.meta.glob("@icons/**/*.svg", {
  query: "?raw",
  eager: false,
  import: "default",
});

const svg = ref();

watchEffect(async () => {
  const safePath = isObject(props.icon) ? `${props.icon?.path}/` : "";
  const safeName = isObject(props.icon) ? props.icon?.name : props.icon;

  const exactMatch = find(icons, (fn, iconPath) => {
    const pathParts = iconPath.split("/");
    const fileName = pathParts[pathParts.length - 1];
    return fileName === `${safeName}.svg`;
  });

  const asyncImport =
    exactMatch ||
    find(icons, (fn, iconPath) =>
      endsWith(iconPath, `${safePath}${safeName}.svg`)
    );

  if (!asyncImport) {
    console.warn("icon", "import not found", {
      icon: props.icon,
      icons,
    });
    emit("error", new Error(`Icon not found: ${safeName}`));
    svg.value = null;
    return;
  }

  svg.value = await asyncImport().catch(() => {
    emit("error", new Error(`Failed to process content: ${safeName}`));
    return null;
  });
});
</script>
