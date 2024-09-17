<template>
  <link rel="stylesheet" :href="stylesheet" />

  <i
    v-if="svg"
    class="icon"
    :class="[styles.icon.root, $attrs?.class]"
    v-html="svg"
    role="img"
    :aria-label="`${icon?.name || icon} icon`"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, watchEffect, toRefs } from "vue";

// --- internal

import { useStyles, stylesheet } from "../../utils";
import config from "./icon.config";

// --- utils
import { find, isObject, endsWith } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { IconConfig } from "./types";
import type { IconProps } from "./types";
// ----------------------------------------------

export default defineComponent({
  name: "UwIcon",
  inheritAttrs: false,
  props: {
    size: {
      type: String as PropType<IconConfig["size"]>,
      default: "auto",
    },
    icon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      required: true,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const styles = useStyles("icon", toRefs(props), config, props.upwindConfig);

    const icons = import.meta.glob("@icons/**/*.svg", {
      query: "?raw",
      eager: false,
      import: "default",
    });

    const svg = ref();

    watchEffect(async () => {
      const safePath = isObject(props.icon) ? `${props.icon?.path}/` : "";
      const safeName = isObject(props.icon) ? props.icon?.name : props.icon;

      const asyncImport = find(icons, (fn, iconPath) =>
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

    return {
      styles,
      svg,
      stylesheet,
    };
  },
});
</script>
