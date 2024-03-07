<template>
  <div class="flex flex-wrap justify-center bg-base text-base-content">
    <upm-header></upm-header>

    <pv-drawer
      contentId="navbar-secondary-content"
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
                class="hs-accordion-toggle hs-accordion-active:bg-primary-content hs-accordion-active:text-primary hs-accordion-active:hover:bg-primary-content w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-slate-700 rounded-lg hover:bg-gray-100 dark:bg-base-300 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 dark:hs-accordion-active:text-white dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
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
                      :exact="true"
                      exact-active-class="bg-primary-content hover:bg-primary-content text-primary"
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

    <main
      class="p-8 w-full flex flex-wrap justify-center"
      :data-theme="activeTheme"
    >
      <div class="canvas min-h-screen">
        <upm-feedback />
        <upm-desktop v-if="isDesktopResolution" />
        <upm-tablet v-else-if="isTabletResolution" />
        <upm-mobile v-else />
      </div>

      <footer
        class="w-full flex items-start justify-center text-center mt-8 py-12 px-4 gap-4 text-sm"
      >
        <span>@copyright {{ new Date().getFullYear() }} Upmind Labs.</span>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
// --- external
import { provide, ref, computed } from "vue";
import { useRouter } from "vue-router";

// --- internal
import LogoIcon from "@/assets/logo.svg";
import UpmThemeSwitcher from "@/components/ThemeSwitcher.vue";
import UpmResolutionSwitcher from "@/components/ResolutionSwitcher.vue";
import UpmFeedback from "@/modules/feedback/components/Feedback.vue";
import PvDrawer from "@/components/Drawer.vue";
import UpmHeader from "@/components/Header.vue";
import UpmMobile from "@/components/Mobile.vue";
import UpmTablet from "@/components/Tablet.vue";
import UpmDesktop from "@/components/Desktop.vue";

// --- utils
import { startCase } from "lodash-es";

// ---
const router = useRouter();
const routes = ref(router.options.routes);

// ---

const activeTheme = ref("simple");
provide("activeTheme", activeTheme);

// ---

const activeResolution = ref("desktop");
provide("activeResolution", activeResolution);

const isDesktopResolution = computed(
  () => activeResolution.value === "desktop"
);
const isTabletResolution = computed(() => activeResolution.value === "tablet");
</script>

<style lang="scss" scoped>
main {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-position: center;
  background-attachment: fixed;
}
</style>
