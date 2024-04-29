<template>
  <div ref="el" id="theme-provider" :data-theme="activeTheme">
    <!-- force re-render on theme change with a key -->
    <slot :key="activeTheme"></slot>
  </div>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";
import { useMutationObserver } from "@vueuse/core";

// --- internal
import { useThemes } from "@upmind/upwind";
import themes from "@/assets/themes";

// --- utils
import { first } from "lodash-es";

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
    const { updateTheme, activeTheme } = useThemes(themes, props.theme);

    useMutationObserver(
      el,
      mutations => {
        if (first(mutations)?.attributeName === "data-theme") {
          const theme = first(mutations)?.target?.dataset?.theme;
          if (theme && theme != activeTheme.value) updateTheme(theme);
        }
      },
      {
        attributes: true,
      }
    );

    return {
      el,
      activeTheme,
    };
  },
});
</script>
