<template>
  <i
    v-if="svg"
    class="icon"
    :class="styles.root"
    v-html="svg"
    role="img"
    :aria-label="`${icon?.name || icon} icon`"
  />
</template>

<script lang="ts">
// --- global
import { defineComponent, ref, watchEffect } from "vue";

// --- local
import config from "./config";

// --- utils
import { useStyles } from "../../utils";
import { isObject } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { Icon } from "./types";
// ----------------------------------------------

export default defineComponent({
  name: "UpwIcon",
  props: {
    icon: { type: [String, Object] as PropType<Icon>, required: true },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const styles = useStyles("icon", { props }, config, props.upwindConfig);

    const svg = ref(null);

    watchEffect(async () => {
      try {
        const iconsImport = import.meta.glob("@/assets/icons/**/*.svg", {
          as: "raw",
          eager: false,
        });

        const safePath = isObject(props.icon) ? `${props.icon?.path}/` : "";
        const safeName = isObject(props.icon) ? props.icon?.name : props.icon;

        svg.value = (await iconsImport[
          `/src/assets/icons/${safePath}${safeName}.svg`
        ]()) as any;
      } catch {
        svg.value = null;
      }
    });

    return {
      styles,
      svg,
    };
  },
});
</script>

<style lang="scss">
.icon {
  > svg {
    width: apply(w-full);
    height: apply(h-full);
  }
}
</style>
