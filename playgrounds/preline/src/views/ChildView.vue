<template>
  <article
    class="view max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 min-h-screen"
  >
    <header class="view-header max-w-3xl">
      <p v-if="flow" class="view-flow mb-2 text-sm font-semibold text-primary">
        {{ flow }}
      </p>
      <h1
        v-if="title"
        class="view-title block text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white"
      >
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="view-description mt-2 text-lg text-gray-800 dark:text-gray-400"
      >
        {{ description }}
      </p>
      <div
        class="view-actions mt-5 flex flex-col items-center gap-2 sm:flex-row sm:gap-3"
      >
        <button
          class="w-full sm:w-auto py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-primary text-white hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
          disabled
        >
          <upm-icon name="code" class="size-4 stroke-current" />

          Show code
        </button>

        <pv-drawer
          contentId="debug-auth-flow"
          title="Debug Auth Flow"
          action="Debug"
          class="text-sm border border-primary text-primary bg-transparent hover:bg-primary-700 hover:text-primary-content transition-colors"
        >
          <template #action>
            <upm-icon name="debug" class="size-4 fill-current -mt-1" />
            <span>Debug Auth Flow</span>
          </template>

          <upm-debug
            :id="`debug-${kebabCase(name)}`"
            :title="`Debug ${startCase(name)}`"
            :open="{ state }"
            :state="state"
            :context="context"
            :errors="errors"
            :meta="meta"
          />
        </pv-drawer>
      </div>
    </header>

    <div class="canvas w-full min-h-screen my-12">
      <figure
        class="relative z-[1] max-w-full rounded-b-lg shadow-[0_2.75rem_3.5rem_-2rem_rgb(45_55_75_/_20%),_0_0_5rem_-2rem_rgb(45_55_75_/_15%)] dark:shadow-[0_2.75rem_3.5rem_-2rem_rgb(0_0_0_/_20%),_0_0_5rem_-2rem_rgb(0_0_0_/_15%)]"
      >
        <div
          class="relative flex gap-12 justify-start items-center bg-base-300 rounded-t-lg py-2 px-4 dark:bg-base-200"
        >
          <div class="flex gap-1">
            <span class="size-2 bg-error rounded-full"></span>
            <span class="size-2 bg-warning rounded-full"></span>
            <span class="size-2 bg-success rounded-full"></span>
          </div>

          <!-- <div
            class="flex-1 rounded-xl text-xs py-1 px-4 bg-base-100 text-base-content"
          >
            www.upmind.com
          </div> -->
        </div>

        <div
          class="transition-all relative bg-base-100 text-base-content border-base-300 border rounded-b-lg mx-auto overflow-auto"
          :class="{
            'w-full h-screen': isDesktop,
            'w-[768px] h-[1024px]': isTablet,
            'w-[375px] h-[667px]': !isDesktop && !isTablet,
          }"
        >
          <object :data="url" class="absolute w-full h-full"></object>
        </div>
      </figure>
    </div>

    <footer class="view-footer"></footer>
  </article>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { UpmDebug } from "@upmind/ui";
import PvDrawer from "@/components/Drawer.vue";
import UpmIcon from "@/components/Icon.vue";

import { startCase, kebabCase } from "lodash-es";

export default defineComponent({
  name: "UpmView",
  props: {
    name: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    flow: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: false,
    },
    // ---
    state: {
      type: Object,
      required: false,
    },
    context: {
      type: Object,
      required: false,
    },
    errors: {
      type: Object,
      required: false,
    },
    meta: {
      type: Object,
      required: false,
    },
  },

  components: {
    UpmDebug,
    PvDrawer,
    UpmIcon,
  },
  setup() {
    const { isDesktop, isTablet } = inject("resolution");

    return {
      isDesktop,
      isTablet,
      startCase,
      kebabCase,
    };
  },
  computed: {
    resoluton() {
      if (this.isDesktop) return "UpmDesktop";
      if (this.isTablet) return "UpmTablet";
      return "UpmMobile";
    },
  },
});

// ---
</script>

<style lang="scss" scoped>
.canvas {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-position: center;
  background-attachment: fixed;
}
</style>
