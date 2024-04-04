<template>
  <i
    v-if="icon"
    class="icon"
    :class="styles.root"
    v-html="icon"
    role="img"
    :aria-label="`${name} icon`"
  />
</template>

<script>
// --- global
import { defineComponent, ref, watchEffect } from "vue";

// --- local
import config from "./config";

// --- utils
import { useStyles } from "../../utils";

// ----------------------------------------------

export default defineComponent({
  name: "UpwIcon",
  props: {
    path: String,
    name: { type: String, required: true },
    filled: { type: Boolean, default: false },
    avatar: { type: Boolean, default: false },
  },
  setup(props) {
    const styles = useStyles("icon", config);

    const icon = ref(null);

    watchEffect(async () => {
      try {
        const iconsImport = import.meta.glob("@/assets/icons/**/*.svg", {
          as: "raw",
          eager: false,
        });

        const safePath = props.path ? `${props.path}/` : "";

        const rawIcon =
          await iconsImport[`/src/assets/icons/${safePath}${props.name}.svg`]();
        icon.value = rawIcon;
      } catch {
        icon.value = null;
      }
    });

    return {
      styles,
      icon,
    };
  },
});
</script>

<style lang="scss">
.icon {
  > svg {
    width: 100%;
    height: 100%;
  }
}
</style>
