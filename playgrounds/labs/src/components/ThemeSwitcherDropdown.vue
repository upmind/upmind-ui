<template>
  <upw-dropdown
    :label="`${activeThemeName} Theme`"
    icon="palette"
    :items="themes"
  />

  <!-- End Popover -->
</template>

<script>
import { inject, defineComponent, computed, watch } from "vue";
import { UpwDropdown } from "@upmind/upwind";
import themes from "@/assets/themes";
import { startCase, set, lowerCase, reduce, find } from "lodash-es";

export default defineComponent({
  name: "ThemeSwitcherDropdown",
  components: {
    UpwDropdown,
  },
  setup() {
    const activeTheme = inject("activeTheme");
    const upwindStyles = inject("upwind");

    watch(activeTheme, value => {
      const theme = find(themes, ["id", value]);
      upwindStyles.value = theme?.upwind || {};
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
