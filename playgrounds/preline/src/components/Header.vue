<template>
  <header
    class="flex flex-wrap sm:justify-start sm:flex-nowrap z-50 w-full bg-base text-base-content border-b border-gray-200 text-sm py-3 sm:py-4 sticky top-0 dark:bg-gray-800 dark:border-gray-700"
  >
    <nav
      class="relative max-w-[85rem] flex flex-wrap basis-full items-center w-full mx-auto px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8"
      aria-label="Global"
    >
      <a
        class="flex items-center gap-3 justify-between text-xl font-semibold w-auto h-10"
        href="/"
        aria-label="Brand"
      >
        <logo-icon class="w-full h-full"></logo-icon>
        <span class="font-mono tracking-widest">LABS</span>
      </a>

      <div class="flex items-center ms-auto sm:ms-0 sm:order-3">
        <div class="sm:hidden">
          <button
            type="button"
            class="p-2 inline-flex justify-center items-center gap-2 rounded-lg border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-xs dark:bg-gray-800 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800"
            data-hs-overlay="#navbar-offcanvas-example"
            aria-controls="navbar-offcanvas-example"
            aria-label="Toggle navigation"
          >
            Menu
            <svg
              class="hs-overlay-open:hidden size-4"
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
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>

        <div
          class="ps-3 sm:ps-6 sm:ms-6 sm:border-s sm:border-gray-300 dark:border-gray-700"
        >
          <button
            type="button"
            :class="[
              'hover:border-neutral-300',
              'hover:shadow-lg',
              'hover:-tranneutral-y-1',
              'border',
              'border-transparent',
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
            data-hs-overlay="#navbar-secondary-content"
            aria-controls="navbar-secondary-content"
            aria-label="Toggle navigation"
          >
            <span class="sr-only">Toggle Navigation</span>
            <upm-icon name="hamburger" class="size-6"></upm-icon>
          </button>
        </div>
      </div>

      <div
        id="navbar-offcanvas-example"
        class="hs-overlay hs-overlay-open:translate-x-0 -translate-x-full fixed top-0 start-0 transition-all duration-300 transform h-full max-w-xs w-full z-[60] bg-white border-e basis-full grow sm:order-2 sm:static sm:block sm:h-auto sm:max-w-none sm:w-auto sm:border-r-transparent sm:transition-none sm:translate-x-0 sm:z-40 sm:basis-auto dark:bg-gray-800 dark:border-r-gray-700 sm:dark:border-r-transparent hidden"
        tabindex="-1"
        data-hs-overlay-close-on-resize
      >
        <div
          class="flex flex-col gap-y-4 gap-x-0 mt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-y-0 sm:gap-x-7 sm:mt-0 sm:ps-7"
        >
          <upm-resolution-switcher />
          <upm-theme-switcher />
        </div>
      </div>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LogoIcon from "@/assets/logo.svg";
import UpmIcon from "@/components/Icon.vue";
import UpmThemeSwitcher from "@/components/ThemeSwitcher.vue";
import UpmResolutionSwitcher from "@/components/ResolutionSwitcher.vue";

export default defineComponent({
  name: "UpmHeader",
  components: {
    LogoIcon,
    UpmIcon,
    UpmThemeSwitcher,
    UpmResolutionSwitcher,
  },
});
</script>
