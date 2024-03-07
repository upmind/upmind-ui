<template>
  <!-- Popover -->
  <popper placement="left" :interactive="false">
    <button
      type="button"
      class="inline-flex items-center gap-x-2.5 py-3 px-4 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
    >
      <upm-icon name="palette" class="flex-shrink-0 size-4" />
      <span>{{ activeResolutionName }}</span>
    </button>
    <template #content>
      <div :class="['rounded-xl', 'shadow-md']">
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
              activeResolution == resolution
                ? ['text-primary', 'hover:bg-white']
                : ['text-gray-800', 'hover:bg-gray-50'],
            ]"
            v-for="resolution in resolutions"
            :key="resolution"
          >
            <button
              type="button"
              class="flex flex-col items-center place-content-center h-full gap-2.5 py-3 px-8 text-sm font-medium text-inherit rounded-lg"
              @click.prevent="activeResolution = resolution"
            >
              <upm-icon
                path="resolutions"
                :name="resolution"
                class="flex-shrink-0 size-12"
              />

              {{ startCase(resolution) }}
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
import { startCase } from "lodash-es";

export default defineComponent({
  name: "ResolutionSwitcher",
  components: {
    Popper,
    UpmIcon,
  },
  setup() {
    const activeResolution = inject("activeResolution");
    const resolutions = ["mobile", "tablet", "desktop"];

    watch(
      () => activeResolution.value,
      (resolution, current) => {
        debugger;
        // TODO: implement resolution change
      }
    );

    return {
      resolutions,
      activeResolution,
      activeResolutionName: computed(() =>
        startCase(activeResolution.value || "mobile")
      ),
      startCase,
    };
  },
});
</script>
