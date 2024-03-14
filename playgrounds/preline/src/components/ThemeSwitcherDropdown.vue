<template>
  <!-- Popover -->
  <popper :interactive="false">
    <button
      type="button"
      class="inline-flex items-center gap-x-2.5 text-sm font-medium rounded-lg hover:text-neutral-400"
    >
      <span>{{ activeThemeName }} Theme</span>
      <upm-icon name="palette" class="flex-shrink-0 size-6" />
    </button>
    <template #content>
      <ul
        class="min-w-[15rem] mt-5 mx-2 bg-white border border-base-300 shadow-md rounded-b-lg p-2 after:h-4 after:absolute after:-bottom-4 after:start-0 after:w-full before:h-4 before:absolute before:-top-4 before:start-0 before:w-full"
      >
        <li
          class="flex cursor-pointer items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-neutral-800 hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100"
          :class="{ '!bg-neutral-200': activeTheme === key }"
          v-for="(theme, key) in themes"
          :key="theme"
          @click.prevent="activeTheme = key"
        >
          <upm-icon path="themes" :name="key" class="flex-shrink-0 size-5" />

          {{ startCase(theme) }} Theme
        </li>
      </ul>
    </template>
  </popper>

  <!-- End Popover -->
</template>

<script lang="ts">
import { inject, watch, defineComponent, computed } from "vue";
import Popper from "vue3-popper";
import UpmIcon from "@/components/Icon.vue";
import themes from "@/assets/themes";
import { startCase, set, lowerCase, reduce } from "lodash-es";

export default defineComponent({
  name: "ThemeSwitcherDropdown",
  components: {
    Popper,
    UpmIcon,
  },
  setup() {
    const activeTheme = inject("activeTheme");

    watch(
      () => activeTheme.value,
      (theme, current) => {
        // TODO: implement theme change
      }
    );

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
