<template>
  <nav
    class="flex justify-between space-x-1 rounded-lg bg-neutral-50 px-1 py-1 transition hover:bg-neutral-100"
  >
    <button
      v-for="resolution in resolutions"
      :key="resolution"
      type="button"
      class="flex flex-col place-items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-inherit hover:text-inherit sm:text-sm"
      :class="{
        active: active === resolution,
        'bg-white': active === resolution,
        'text-inherit': active === resolution,
        'shadow-sm': active === resolution,
      }"
      @click.prevent="active = resolution"
    >
      <upw-icon
        :icon="{ path: 'devices', name: 'resolution' }"
        class="size-4"
      />
      <span class="sr-only text-xs">{{ startCase(resolution) }}</span>
    </button>
  </nav>

  <!-- End Popover -->
</template>

<script>
import { inject, defineComponent } from "vue";
import { UpwIcon } from "@upmind/upwind";
import { startCase } from "lodash-es";

export default defineComponent({
  name: "ResolutionSwitcher",
  components: {
    UpwIcon,
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
