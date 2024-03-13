<template>
  <header
    class="flex flex-wrap sm:justify-start sm:flex-nowrap z-50 w-full bg-base text-base-content border-b border-gray-200 text-sm py-3 sm:py-4 fixed top-0"
  >
    <nav
      class="relative flex gap-4 flex-wrap basis-full items-center w-full mx-auto px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8"
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

      <div class="flex gap-4 justify-center">
        <upm-resolution-switcher />
      </div>

      <div class="flex justify-end items-center ms-auto sm:ms-0 sm:order-3">
        <upm-theme-switcher />

        <div class="ps-3 sm:ps-6 sm:ms-6 sm:border-s sm:border-gray-300">
          <button
            type="button"
            :class="[
              'hover:border-neutral-300',
              'hover:shadow-lg',
              // ---
              'border',
              'border-transparent',
              // ---
              'active:border-neutral-600',
              'active:shadow-lg',
              'active:border',
              // ---
              'transition-all',
              'rounded',
              'aspect-square',
            ]"
            data-hs-overlay="#navbar-secondary-content"
            aria-controls="navbar-secondary-content"
            aria-label="Toggle navigation"
          >
            <span class="sr-only">Toggle Navigation</span>
            <upm-icon name="navigation-menu" class="size-6"></upm-icon>
          </button>
        </div>
      </div>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LogoIcon from "@/assets/logo.svg";
import UpmIcon from "@/components/Icon.vue";
import UpmThemeSwitcher from "@/components/ThemeSwitcherDropdown.vue";
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
