<template>
  <div
    class="flex bg-neutral-100 hover:bg-neutral-200 rounded-xl transition p-1 dark:bg-neutral-700 dark:hover:bg-neutral-700/[.7]"
  >
    <nav class="flex space-x-1" aria-label="Tabs" role="tablist">
      <button
        v-for="resolution in resolutions"
        :key="resolution"
        type="button"
        class="flex flex-col place-items-center gap-1 hs-tab-active:bg-white hs-tab-active:text-neutral-800 hs-tab-active:shadow-sm text-xs sm:text-sm text-neutral-800 hover:text-black font-medium rounded-lg py-2 px-3 dark:text-neutral-200 dark:hover:text-white dark:hs-tab-active:bg-neutral-800 dark:hs-tab-active:text-neutral-200"
        :class="{ active: activeResolution === resolution }"
        :id="`trigger-resolution-${resolution}`"
        :data-hs-tab="`#resolution-${resolution}`"
        :aria-controls="`resolution-${resolution}`"
        role="tab"
        @click.prevent="activeResolution = resolution"
      >
        <upm-icon path="devices" :name="resolution" class="size-5" />
        <span class="text-xs sr-only">{{ startCase(resolution) }}</span>
      </button>
      <!-- <button
        type="button"
        class="hs-tab-active:bg-white hs-tab-active:text-neutral-800 hs-tab-active:shadow-sm text-xs sm:text-sm text-neutral-800 hover:text-black font-medium rounded-lg py-2 px-3 dark:text-neutral-200 dark:hover:text-white dark:hs-tab-active:bg-neutral-800 dark:hs-tab-active:text-neutral-200 active"
        id="ctc-component-primary-bg-tab-html-item"
        data-hs-tab="#ctc-component-primary-bg-tab-html"
        aria-controls="ctc-component-primary-bg-tab-html"
        role="tab"
      >
        HTML
      </button> -->
    </nav>
  </div>

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
