<template>
  <div :data-theme="theme">
    <slot></slot>
  </div>
</template>

<script>
import { inject, defineComponent, computed, watchEffect } from "vue";
import themes from "@/assets/themes";
import { startCase, set, lowerCase, reduce, find } from "lodash-es";

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
    const activeTheme = inject("activeTheme");
    const upwindStyles = inject("upwind");

    watchEffect(() => {
      activeTheme.value = props.theme || activeTheme.value;
      const theme = find(themes, ["id", activeTheme.value]);
      if (theme?.upwind) {
        upwindStyles.value = theme.upwind;
      }
    });

    return {
      themes: computed(() =>
        reduce(
          themes,
          (result, theme) => {
            set(result, lowerCase(theme.id), {
              label: theme.name,
              icon: {
                name: theme.id,
                path: "themes",
              },
              action: () => (activeTheme.value = theme.id),
            });
            return result;
          },
          {}
        )
      ),

      activeTheme,
      activeThemeName: computed(() => startCase(activeTheme.value || "light")),
      startCase,
    };
  },
});
</script>
