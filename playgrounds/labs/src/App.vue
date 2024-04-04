<template>
  <router-view
    v-if="isEmbed"
    class="h-screen max-h-full w-full overflow-auto bg-base text-base-content"
    :data-theme="activeTheme"
  />

  <div
    v-else
    class="flex h-screen flex-wrap justify-center overflow-hidden bg-base text-base-content"
  >
    <upm-header></upm-header>

    <upm-drawer
      contentId="navbar-secondary-content"
      title="Upmind Flow Demo"
      action="Toggle Navigation"
      no-action
    >
      <template #action>
        <span class="sr-only">Toggle Navigation</span>
        <svg
          class="size-4 flex-shrink-0"
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
        class="hs-accordion-group flex w-full flex-col flex-wrap"
        data-hs-accordion-always-open
      >
        <ul class="space-y-1.5">
          <template v-for="route in routes" :key="route.path">
            <li v-if="!route?.children && !route?.meta?.hidden">
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
                ]"
              >
                {{ startCase(route.name) }}
              </router-link>
            </li>

            <li
              v-else-if="route?.children && !route?.meta?.hidden"
              class="hs-accordion"
              :id="`accordion-${route.path}`"
            >
              <button
                type="button"
                class="hs-accordion-toggle hs-accordion-active:bg-primary-content hs-accordion-active:text-primary hs-accordion-active:hover:bg-primary-content flex w-full items-center gap-x-3.5 rounded-lg px-2.5 py-2 text-start text-sm text-slate-700 hover:bg-gray-100"
              >
                {{ startCase(route.name) }}

                <svg
                  class="hs-accordion-active:block ms-auto hidden size-4 text-gray-600 group-hover:text-gray-500"
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
                  class="hs-accordion-active:hidden ms-auto block size-4 text-gray-600 group-hover:text-gray-500"
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
                class="hs-accordion-content hidden w-full overflow-hidden transition-[height] duration-300"
              >
                <ul class="ps-2 pt-2">
                  <template v-for="child in route.children" :key="child.path">
                    <li v-if="!child?.meta?.hidden">
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
                        ]"
                      >
                        {{ startCase(child.name) }}
                      </router-link>
                    </li>
                  </template>
                </ul>
              </div>
            </li>
          </template>
        </ul>
      </nav>
    </upm-drawer>

    <!-- provide padding for our fixed header 4.5rem -->
    <main
      class="flex h-full w-full flex-wrap justify-center overflow-hidden pt-[4.5rem]"
    >
      <router-view class="h-full w-full" :key="route.fullPath" />

      <!-- <footer
        class="w-full flex items-start justify-center text-center py-8 px-4 gap-4 text-sm"
      >
        <span>@copyright {{ new Date().getFullYear() }} Upmind Labs.</span>
      </footer> -->
    </main>
  </div>
</template>

<script setup>
// --- external
import { provide, ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

// --- internal
import UpmDrawer from "@/components/Drawer.vue";
import UpmHeader from "@/components/Header.vue";
import themes from "@/assets/themes";

// --- utils
import { startCase, set, find } from "lodash-es";

// ---
const router = useRouter();
const route = useRoute();

const routes = ref(router.options.routes);
const isEmbed = ref(true);

// ---

const activeTheme = ref("light");
provide("activeTheme", activeTheme);

// ---
const upwindStyles = ref({});

provide("upwind", upwindStyles);
// ---

watch(route, () => {
  isEmbed.value = !!route?.query?.embed;
  activeTheme.value = route?.query?.theme || activeTheme.value || "light";
  if (themes) {
    const theme = find(themes, ["id", activeTheme.value]);
    upwindStyles.value = theme?.upwind || {};
  }
});
// ---

const activeResolution = ref("desktop");

provide("resolution", {
  active: activeResolution,
  isDesktop: computed(() => activeResolution.value === "desktop"),
  isTablet: computed(() => activeResolution.value === "tablet"),
  isMobile: computed(
    () => !activeResolution.value || activeResolution.value === "mobile"
  ),
});

// ---
const inspectors = ref({});
provide("inspectors", inspectors.value);

// listen for events from our embedded content
window.addEventListener(
  "message",
  event => {
    if (event.origin !== window.origin) return; // safety check we are getting data from ourselves
    if (
      event?.data?.key == "_upm-inspector" &&
      !!event?.data?.flow &&
      !!event?.data?.snapshot
    ) {
      set(inspectors.value, event.data.flow, event.data.snapshot);
    }
    // …
  },
  false
);
</script>
