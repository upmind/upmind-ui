<template>
  <DropdownMenu
    v-if="hasThemes"
    :label="`${activeThemeName} Theme`"
    icon="palette"
    :items="themes"
  />

  <!-- End Popover -->
</template>

<script>
import { inject, defineComponent, computed } from "vue";
import { DropdownMenu } from "../dropdown-menu";
import { startCase, keys } from "lodash-es";

export default defineComponent({
  name: "UwpwThemeSwitcher",
  components: {
    DropdownMenu,
  },
  setup() {
    const { activeTheme, themes } = inject("upwind");

    return {
      hasThemes: computed(() => keys(themes.value).length > 1),
      themes,
      activeTheme,
      activeThemeName: computed(() => startCase(activeTheme.value || "light")),
      startCase,
    };
  },
});
</script>
