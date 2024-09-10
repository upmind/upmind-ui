<template>
  <i
    v-if="svg"
    class="icon"
    :class="styles.icon.root"
    v-html="svg"
    role="img"
    :aria-label="`${icon?.name || icon} icon`"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent, ref, watchEffect, toRefs } from "vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";
import { find, isObject, includes } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { IconProps } from "./types";
// ----------------------------------------------

export default defineComponent({
  name: "UpwIcon",
  props: {
    size: {
      type: String,
      default: "auto",
      validator: (value: string) =>
        ["full", "auto", "xs", "sm", "md", "lg", "xl", "2xl"].includes(value),
    },
    icon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      required: true,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
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
        includes(iconPath, `${safePath}${safeName}.svg`)
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
    };
  },
});
</script>
