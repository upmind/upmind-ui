<template>
  <div ref="el" id="theme-provider" :data-theme="activeTheme">
    <slot></slot>
  </div>
</template>

<script>
// --- external
import { inject, defineComponent, watchEffect, ref } from "vue";
import { useMutationObserver } from "@vueuse/core";

// --- internal
import themes from "@/assets/themes";

// --- utils
import { find, first } from "lodash-es";

export default defineComponent({
  name: "ThemeProvider",
  components: {},
  props: {
    theme: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const el = ref(null);

    const activeTheme = inject("activeTheme");
    const upwindStyles = inject("upwind");

    useMutationObserver(
      el,
      mutations => {
        if (first(mutations)?.attributeName === "data-theme") {
          activeTheme.value = first(mutations)?.target?.dataset?.theme;
          const theme = find(themes, ["id", activeTheme.value]);
          if (theme?.upwind) {
            upwindStyles.value = theme.upwind;
          }
        }
      },
      {
        attributes: true,
      }
    );

    watchEffect(() => {
      activeTheme.value = props.theme || activeTheme.value;
    });

    return {
      el,
      activeTheme,
    };
  },
});
</script>
