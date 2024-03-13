<template>
  <article class="view w-full grid grid-cols-4 gap-4 h-full overflow-hidden">
    <aside
      class="rounded pr-8 border-e border-neutral-200 bg-neutral-50 py-12 px-4 sm:px-8 lg:px-12 relative h-full overflow-auto"
    >
      <header class="view-header mb-8">
        <p
          v-if="flow"
          class="view-flow mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wide"
        >
          {{ flow }}
        </p>

        <h1
          v-if="title"
          class="view-title block text-xl font-bold text-neutral sm:text-3xl"
        >
          {{ title }}
        </h1>

        <p
          v-if="description"
          class="view-description mt-2 text-sm text-neutral-500"
        >
          {{ description }}
        </p>

        <div class="view-actions my-8 flex items-center gap-2 sm:gap-3">
          <button
            class="py-3 px-4 aspect-square inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent bg-neutral text-white hover:bg-neutral disabled:opacity-50 disabled:pointer-events-none transition-colors"
            disabled
          >
            <upm-icon name="code" class="size-4 stroke-current" />

            <span class="sr-only">Show code</span>
          </button>

          <pv-drawer
            contentId="debug-auth-flow"
            title="Debug Auth Flow"
            action="Debug"
            class="py-3 px-4 aspect-square inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-neutral text-neutral bg-transparent hover:bg-neutral hover:text-neutral-content transition-colors"
          >
            <template #action>
              <upm-icon name="debug" class="size-4 fill-current -mt-1" />
              <span class="sr-only">Debug Auth Flow</span>
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

      <div class="sticky top-0">
        <nav
          class="hs-accordion-group w-full flex flex-col flex-wrap"
          data-hs-accordion-always-open
        >
          <div
            class="mb-5 py-3 flex items-center text-xs text-neutral-300 uppercase before:flex-[1_1_0%] before:border-t before:border-neutral-200 before:me-6 after:flex-[1_1_0%] after:border-t after:border-neutral-200 after:ms-6"
          >
            Options
          </div>

          <ul class="space-y-4">
            <li>
              <span
                class="flex flex-wrap justify-between py-2 text-xs text-neutral-500 uppercase"
              >
                Layout Variants
              </span>

              <div class="flex flex-col rounded-lg">
                <router-link
                  :to="{ name: 'auth-simple' }"
                  type="button"
                  class="py-3 px-4 flex items-center gap-x-2 rounded-t-md text-sm font-medium focus:z-10 border border-neutral-200 bg-white text-neutral-400 shadow-sm hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none"
                  exact-active-class="!bg-neutral text-neutral-content"
                >
                  Simple
                </router-link>

                <router-link
                  :to="{ name: 'auth-illustration' }"
                  type="button"
                  class="-mt-px py-3 px-4 flex items-center gap-x-2 text-sm font-medium focus:z-10 border border-neutral-200 bg-white text-neutral-400 shadow-sm hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none"
                  exact-active-class="!bg-neutral text-neutral-content"
                >
                  Illustration
                </router-link>

                <router-link
                  :to="{ name: 'auth-background' }"
                  type="button"
                  class="-mt-px py-3 px-4 flex items-center gap-x-2 text-sm font-medium focus:z-10 border border-neutral-200 bg-white text-neutral-400 shadow-sm hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none"
                  exact-active-class="!bg-neutral text-neutral-content"
                >
                  Background
                </router-link>

                <router-link
                  :to="{ name: 'auth-marketing' }"
                  type="button"
                  class="-mt-px py-3 px-4 flex items-center gap-x-2 rounded-b-md text-sm font-medium focus:z-10 border border-neutral-200 bg-white text-neutral-400 shadow-sm hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none"
                  exact-active-class="!bg-neutral text-neutral-content"
                >
                  Marketing
                </router-link>
              </div>

              <p class="py-2 text-xs text-neutral-300">
                Choose a layout to see how the auth flow can be customized.
              </p>
            </li>
          </ul>
        </nav>
      </div>
    </aside>

    <div class="h-full canvas col-span-3 py-8 px-4 sm:px-6 lg:px-6">
      <!-- <div class="canvas col-span-3"> -->
      <figure
        class="h-full relative z-[1] max-w-full rounded-md shadow-menu mx-auto transition-all overflow-hidden"
        :class="{
          'w-full': isDesktop,
          'w-[768px]': isTablet,
          'w-[375px]': !isDesktop && !isTablet,
        }"
      >
        <!-- <div
          class="flex gap-12 justify-between items-center bg-base-50 rounded-t-lg py-2 px-4 border-b border-base-300"
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
        </div> -->

        <div
          :data-theme="activeTheme"
          class="h-full relative bg-base-100 text-base-content rounded-b-md overflow-auto"
        >
          <object :data="url" class="absolute w-full h-full"></object>
        </div>
      </figure>
    </div>

    <!-- <footer class="view-footer col-span-full"></footer> -->
  </article>
</template>

<script lang="ts">
import { defineComponent, inject, computed } from "vue";
import { UpmDebug } from "@upmind/ui";
import PvDrawer from "@/components/Drawer.vue";
import UpmIcon from "@/components/Icon.vue";
import UpmThemeSwitcher from "@/components/ThemeSwitcher.vue";
import UpmResolutionSwitcher from "@/components/ResolutionSwitcher.vue";

import { startCase, kebabCase } from "lodash-es";

export default defineComponent({
  name: "UpmView",
  components: {
    UpmDebug,
    PvDrawer,
    UpmIcon,
    UpmThemeSwitcher,
    UpmResolutionSwitcher,
  },
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

  setup() {
    const { active, isDesktop, isTablet } = inject("resolution");

    return {
      isDesktop,
      isTablet,
      resolution: active,
      startCase,
      kebabCase,
    };
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

.view {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-position: center;
  background-attachment: fixed;
}
</style>
