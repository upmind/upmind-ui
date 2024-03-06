<template>
  <header class="flex items-center justify-start p-4 gap-4">
    <div class="avatar my-4">
      <div class="w-auto h-16">
        <logo-icon class="w-full h-full"></logo-icon>
      </div>
    </div>

    <button
      type="button"
      :class="[
        'hover:border-neutral-300',
        'hover:shadow-lg',
        'hover:-tranneutral-y-1',
        'hover:border',
        // ---
        'active:border-neutral-600',
        'active:shadow-lg',
        'active:-tranneutral-y-0.5',
        'active:border',
        // ---
        'transition-all',
        'rounded-full',
        'aspect-square',
        'p-2',
      ]"
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
    title="Upmind Flow Demo"
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

    <nav
      class="hs-accordion-group w-full flex flex-col flex-wrap"
      data-hs-accordion-always-open
    >
      <ul class="space-y-1.5">
        <template v-for="route in routes" :key="route.path">
          <li v-if="!route?.children">
            <router-link
              :to="{ name: route.name }"
              active-class="bg-primary-content hover:bg-primary-content text-primary"
              :class="[
                'flex',
                'items-center',
                'p-2',
                'px-2.5',
                'text-sm',
                'rounded',
                'text-neutral-900',
                'hover:bg-neutral-50',
                'dark:bg-neutral-900',
                'dark:text-white',
                'dark:focus:outline-none',
                'dark:focus:ring-1',
                'dark:focus:ring-neutral-600',
              ]"
            >
              {{ startCase(route.name) }}
            </router-link>
          </li>

          <li v-else class="hs-accordion" :id="`accordion-${route.path}`">
            <button
              type="button"
              class="hs-accordion-toggle hs-accordion-active:text-blue-600 hs-accordion-active:hover:bg-transparent w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-slate-700 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 dark:hs-accordion-active:text-white dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
            >
              {{ startCase(route.name) }}

              <svg
                class="hs-accordion-active:block ms-auto hidden size-4 text-gray-600 group-hover:text-gray-500 dark:text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>

              <svg
                class="hs-accordion-active:hidden ms-auto block size-4 text-gray-600 group-hover:text-gray-500 dark:text-gray-400"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 5L8.16086 10.6869C8.35239 10.8637 8.64761 10.8637 8.83914 10.6869L15 5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                ></path>
              </svg>
            </button>

            <div
              :id="`accordion-${route.path}`"
              class="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden"
            >
              <ul class="pt-2 ps-2">
                <li v-for="child in route.children" :key="child.path">
                  <router-link
                    :to="{ name: child.name }"
                    active-class="bg-primary-content hover:bg-primary-content text-primary"
                    :class="[
                      'flex',
                      'items-center',
                      'p-2',
                      'px-2.5',
                      'text-sm',
                      'rounded',
                      'text-neutral-900',
                      'hover:bg-neutral-50',
                      'dark:bg-neutral-900',
                      'dark:text-white',
                      'dark:focus:outline-none',
                      'dark:focus:ring-1',
                      'dark:focus:ring-neutral-600',
                    ]"
                  >
                    {{ startCase(child.name) }}
                  </router-link>
                </li>
              </ul>
            </div>
          </li>
        </template>
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
import { start } from "repl";

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
