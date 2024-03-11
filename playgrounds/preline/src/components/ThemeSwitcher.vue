<template>
  <!-- Popover -->
  <popper :interactive="false">
    <button
      type="button"
      class="inline-flex items-center gap-x-2.5 text-sm font-medium rounded-lg hover:text-primary dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
    >
      <upm-icon name="palette" class="flex-shrink-0 size-6" />
      <span>{{ activeThemeName }}</span>
    </button>
    <template #content>
      <div :class="['rounded-xl', 'shadow-md', 'm-2']">
        <ul class="flex flex-col sm:flex-row">
          <li
            :class="[
              'border',
              'bg-white',
              'border-gray-200',
              'dark:bg-slate-900',
              'dark:border-gray-700',
              'dark:text-white',
              'first:mt-0',
              'first:rounded-t-lg',
              'font-medium',
              'gap-x-2.5',
              'inline-flex',
              'items-center',
              'last:rounded-b-lg',
              'sm:-ms-px',
              'sm:first:rounded-es-lg',
              'sm:first:rounded-se-none',
              'sm:last:rounded-es-none',
              'sm:last:rounded-se-lg',
              'sm:mt-0',

              'text-sm',
              activeTheme == theme
                ? ['text-primary', 'hover:bg-white']
                : ['text-gray-800', 'hover:bg-gray-50'],
            ]"
            v-for="(theme, key) in themes"
            :key="theme"
          >
            <button
              type="button"
              class="flex flex-col items-center place-content-center h-full gap-2.5 py-3 px-8 text-sm font-medium text-inherit rounded-lg"
              @click.prevent="activeTheme = key"
            >
              <upm-icon
                path="themes"
                :name="key"
                class="flex-shrink-0 size-12"
              />

              {{ startCase(theme) }}
            </button>
          </li>
        </ul>
      </div>
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
