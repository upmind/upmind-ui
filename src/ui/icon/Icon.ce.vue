<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <i
    v-if="svg"
    class="icon"
    :class="cn(variants.icon, props.class)"
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

// ----------------------------------------------

const props = withDefaults(defineProps<IconProps>(), {
  //  --- variants
  size: "auto",
  // --- styles
  upwindConfig: () => ({ icon: {} }),
  class: "",
});

const meta = computed(() => ({
  size: props.size,
  // ---
  hasIcon: !isEmpty(props.icon),
}));

const variants = useStyles(
  "icon",
  meta,
  config,
  props.upwindConfig ?? {}
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
    svg.value = null;
    return;
  }

  svg.value = await asyncImport().catch(error => {
    console.error("icon", "import error", {
      icon: props.icon,
      error,
      icons,
    });
    return null;
  });
});
</script>
