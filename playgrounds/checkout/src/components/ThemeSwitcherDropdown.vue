<template>
  <!-- Popover -->
  <popper :interactive="false">
    <button
      type="button"
      class="inline-flex items-center gap-x-2.5 rounded-lg text-sm font-medium hover:text-neutral-400"
    >
      <span>{{ activeThemeName }} Theme</span>
      <upw-icon name="palette" class="size-6 flex-shrink-0" />
    </button>
    <template #content>
      <ul
        class="min-w-md mx-2 mt-5 rounded-b-lg border border-base-300 bg-white p-2 shadow-md before:absolute before:-top-4 before:start-0 before:h-4 before:w-full after:absolute after:-bottom-4 after:start-0 after:h-4 after:w-full"
      >
        <li
          class="flex cursor-pointer items-center justify-between gap-x-3.5 rounded-lg px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
          :class="{ '!bg-neutral-200': activeTheme === key }"
          v-for="(theme, key) in themes"
          :key="theme"
          @click.prevent="activeTheme = key"
        >
          {{ startCase(theme) }} Theme
          <upw-icon path="themes" :name="key" class="size-5 flex-shrink-0" />
        </li>
      </ul>
    </template>
  </popper>

  <!-- End Popover -->
</template>

<script>
import { inject, defineComponent, computed, watch } from "vue";
import Popper from "vue3-popper";
import { UpwIcon } from "@upmind/upwind";
import themes from "@/assets/themes";
import { startCase, set, lowerCase, reduce, find } from "lodash-es";

export default defineComponent({
  name: "ThemeSwitcherDropdown",
  components: {
    Popper,
    UpwIcon,
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
            set(result, lowerCase(theme.id), theme.name);
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
