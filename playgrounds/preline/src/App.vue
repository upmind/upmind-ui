<template>
  <header class="flex items-center justify-start p-4 gap-4">
    <div class="avatar my-4">
      <div class="w-auto h-16">
        <logo-icon class="w-full h-full"></logo-icon>
      </div>
    </div>

    <button
      type="button"
      class="text-gray-500 hover:text-gray-600"
      data-hs-overlay="#drawer-1"
      aria-controls="drawer-1"
      aria-label="Toggle navigation"
    >
      <span class="sr-only">Toggle Navigation</span>
      <svg
        class="flex-shrink-0 size-4 h-6 w-6"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path
          fill-rule="evenodd"
          d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"
        />
      </svg>
    </button>
  </header>

  <pv-drawer
    contentId="drawer-1"
    title="Drawer 1"
    action="Toggle Navigation"
    no-action
  >
    <template #action>
      <span class="sr-only">Toggle Navigation</span>
      <svg
        class="flex-shrink-0 size-4"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path
          fill-rule="evenodd"
          d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"
        />
      </svg>
    </template>
    <div class="px-6">
      <a
        class="flex-none text-xl font-semibold dark:text-white"
        href="#"
        aria-label="Brand"
        >Upmind Flow Demo</a
      >
    </div>
    <nav
      class="hs-accordion-group p-6 w-full flex flex-col flex-wrap"
      data-hs-accordion-always-open
    >
      <ul class="space-y-1.5">
        <li v-for="route in routes" :key="route.path">
          <router-link
            :to="route.path"
            active-class="bg-gray-300"
            :class="[
              'flex',
              'items-center',
              'p-2',
              'px-2.5',
              'text-sm',
              'rounded-lg',
              'bg-gray-100',
              'text-slate-700',
              'hover:bg-gray-200',
              'dark:bg-gray-900',
              'dark:text-white',
              'dark:focus:outline-none',
              'dark:focus:ring-1',
              'dark:focus:ring-gray-600'
            ]"
          >
            {{ startCase(route.name) }}
          </router-link>
        </li>
      </ul>
    </nav>
  </pv-drawer>

  <main class="container min-h-screen" :data-theme="activeTheme">
    <upm-feedback />
    <router-view class="view" />
  </main>
</template>

<script setup lang="ts">
// --- external
import { provide, ref, watch } from "vue";
import { RouterView, useRouter } from "vue-router";

// --- internal
import LogoIcon from "@/assets/logo.svg";
import UpmFeedback from "@/modules/feedback/components/Feedback.vue";
import PvDrawer from "@/components/Drawer.vue";
// --- utils
import { startCase } from "lodash-es";

// ---
const router = useRouter();
const routes = ref(router.options.routes);

// ---

const activeTheme = ref("");
const themes = import.meta.env.VITE_THEMES.split(",");

watch(
  () => activeTheme.value,
  (theme, current) => {
    debugger;
    // TODO: implement theme change
  }
);

provide("activeTheme", activeTheme);
</script>
