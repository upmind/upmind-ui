<template>
  <div
    class="flex bg-neutral-100 hover:bg-neutral-200 rounded-xl transition p-1 dark:bg-neutral-700 dark:hover:bg-neutral-700/[.7]"
  >
    <nav class="flex space-x-1">
      <button
        v-for="resolution in resolutions"
        :key="resolution"
        type="button"
        class="flex flex-col place-items-center gap-1 text-xs sm:text-sm text-inherit hover:text-inherit font-medium rounded-lg py-2 px-3"
        :class="{
          active: active === resolution,
          'bg-white': active === resolution,
          'text-inherit': active === resolution,
          'shadow-sm': active === resolution,
        }"
        @click.prevent="active = resolution"
      >
        <upm-icon path="devices" :name="resolution" class="size-6" />
        <span class="text-xs sr-only">{{ startCase(resolution) }}</span>
      </button>
      <!-- <button
        type="button"
        class="hs-tab-active:bg-white hs-tab-active:text-inherit hs-tab-active:shadow-sm text-xs sm:text-sm text-inherit hover:text-inherit font-medium rounded-lg py-2 px-3 dark:text-neutral-200 dark:hover:text-white dark:hs-tab-active:bg-neutral-800 dark:hs-tab-active:text-neutral-200 active"
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
import { inject, defineComponent } from "vue";
import UpmIcon from "@/components/Icon.vue";
import { startCase } from "lodash-es";

export default defineComponent({
  name: "ResolutionSwitcher",
  components: {
    UpmIcon,
  },
  setup() {
    const { active } = inject("resolution");
    const resolutions = ["desktop", "tablet", "mobile"];

    return {
      resolutions,
      active,
      startCase,
    };
  },
});
</script>
