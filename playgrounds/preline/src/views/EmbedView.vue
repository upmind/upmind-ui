<template>
  <article class="view max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
    <header class="view-header max-w-3xl">
      <p v-if="flow" class="view-flow mb-2 text-sm font-semibold text-primary">
        {{ flow }}
      </p>
      <h1
        v-if="title"
        class="view-title block text-2xl font-bold text-gray-800 sm:text-3xl"
      >
        {{ title }}
      </h1>
      <p v-if="description" class="view-description mt-2 text-lg text-gray-800">
        {{ description }}
      </p>
      <div
        class="view-actions mt-5 flex flex-col items-center gap-2 sm:flex-row sm:gap-3"
      >
        <button
          class="w-full sm:w-auto py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-primary text-white hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none"
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

    <div class="canvas w-full my-12">
      <figure class="relative z-[1] max-w-full rounded-md shadow-menu">
        <div
          class="relative flex gap-12 justify-between items-center bg-base-50 rounded-t-lg py-2 px-4 border-b border-base-300"
        >
          <div class="flex gap-2">
            <span class="size-3 bg-error rounded-full"></span>
            <span class="size-3 bg-warning rounded-full"></span>
            <span class="size-3 bg-success rounded-full"></span>
          </div>

          <div
            class="flex-1 rounded-lg text-sm text-center py-2 px-4 bg-base-100 text-base-content max-w-lg"
          >
            www.upmind.com
          </div>

          <button></button>
        </div>

        <div
          :data-theme="activeTheme"
          class="h-[80vh] transition-all relative bg-base-100 text-base-content rounded-b-md mx-auto overflow-auto"
          :class="{
            'w-full': isDesktop,
            'w-[768px]': isTablet,
            'w-[375px]': !isDesktop && !isTablet,
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
  inject: ["activeTheme"],
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
.shadow-menu,
.shadow-modal {
  --tw-shadow: 0px 0px 0px 1px rgba(18, 18, 23, 0.1),
    0px 24px 48px rgba(18, 18, 23, 0.03), 0px 10px 18px rgba(18, 18, 23, 0.03),
    0px 5px 8px rgba(18, 18, 23, 0.04), 0px 2px 4px rgba(18, 18, 23, 0.0399338);
  --tw-shadow-colored: 0px 0px 0px 1px var(--tw-shadow-color),
    0px 24px 48px var(--tw-shadow-color), 0px 10px 18px var(--tw-shadow-color),
    0px 5px 8px var(--tw-shadow-color), 0px 2px 4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
    var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.canvas {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-position: center;
  background-attachment: fixed;
}
</style>
