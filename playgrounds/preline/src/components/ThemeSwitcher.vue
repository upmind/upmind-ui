<template>
  <div
    class="flex bg-neutral-100 hover:bg-neutral-200 rounded-xl transition py-2 px-2"
  >
    <nav class="flex space-x-1 justify-between w-full">
      <button
        v-for="(theme, key) in themes"
        :key="key"
        type="button"
        class="flex flex-col place-items-center gap-1 text-xs sm:text-sm text-inherit hover:text-inherit font-medium rounded-lg py-2 px-3"
        :class="{
          active: activeTheme === key,
          'bg-white': activeTheme === key,
          'text-inherit': activeTheme === key,
          'shadow-sm': activeTheme === key,
        }"
        @click.prevent="activeTheme = key"
      >
        <upm-icon path="themes" :name="key" class="size-6" />
        <span class="text-xs sr-only">{{ startCase(theme) }}</span>
      </button>
    </nav>
  </div>

  <!-- End Popover -->
</template>

<script lang="ts">
import { inject, watch, defineComponent, computed } from "vue";
import Popper from "vue3-popper";
import UpmIcon from "@/components/Icon.vue";
import themes from "@/assets/themes";
import { startCase, set, lowerCase, reduce } from "lodash-es";

export default defineComponent({
  name: "ThemeSwitcher",
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
      activeThemeName: computed(() => startCase(activeTheme.value || "simple")),
      startCase,
    };
  },
});
</script>
