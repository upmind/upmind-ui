<template>
  <upw-dropdown
    :label="`${activeThemeName} Theme`"
    icon="palette"
    :items="themes"
  />

  <!-- End Popover -->
</template>

<script>
import { inject, defineComponent, computed } from "vue";
import { UpwDropdown } from "@upmind/upwind";
import { startCase } from "lodash-es";

export default defineComponent({
  name: "ThemeSwitcherDropdown",
  components: {
    UpwDropdown,
  },
  setup() {
    const { activeTheme, themes } = inject("upwind");

    return {
      themes,
      activeTheme,
      activeThemeName: computed(() => startCase(activeTheme.value || "light")),
      startCase,
    };
  },
});
</script>
