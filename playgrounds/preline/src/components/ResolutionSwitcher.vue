<template>
  <nav
    class="flex bg-neutral-50 hover:bg-neutral-100 rounded-lg transition py-1 px-1 space-x-1 justify-between"
  >
    <button
      v-for="resolution in resolutions"
      :key="resolution"
      type="button"
      class="flex flex-col place-items-center gap-1 text-xs sm:text-sm text-inherit hover:text-inherit font-medium rounded-lg py-2 px-2"
      :class="{
        active: active === resolution,
        'bg-white': active === resolution,
        'text-inherit': active === resolution,
        'shadow-sm': active === resolution,
      }"
      @click.prevent="active = resolution"
    >
      <upm-icon path="devices" :name="resolution" class="size-4" />
      <span class="text-xs sr-only">{{ startCase(resolution) }}</span>
    </button>
  </nav>

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
