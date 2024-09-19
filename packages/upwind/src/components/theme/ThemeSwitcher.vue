<template>
  <upw-dropdown
    v-if="hasThemes"
    :label="`${activeThemeName} Theme`"
    icon="palette"
    :items="themes"
  />

  <!-- End Popover -->
</template>

<script>
import { inject, defineComponent, computed } from "vue";
import UpwDropdown from "../dropdown/Dropdown.vue";
import { startCase, keys } from "lodash-es";

export default defineComponent({
  name: "UwpwThemeSwitcher",
  components: {
    UpwDropdown,
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
