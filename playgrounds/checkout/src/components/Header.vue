<template>
  <header
    class="fixed top-0 z-50 flex w-full flex-wrap border-b border-gray-200 bg-base py-3 text-sm text-base-content sm:flex-nowrap sm:justify-start sm:py-4"
  >
    <nav
      class="relative mx-auto flex w-full basis-full flex-wrap items-center gap-4 px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8"
      aria-label="Global"
    >
      <a
        class="flex h-10 w-auto items-center justify-between gap-3 text-xl font-semibold"
        href="/"
        aria-label="Brand"
      >
        <logo class="h-full w-full" />
        <span class="tracking-widest">Checkout</span>
      </a>

      <div class="ms-auto flex items-center justify-end sm:order-3 sm:ms-0">
        <upm-theme-switcher />
      </div>
    </nav>
  </header>
</template>

<script>
import { defineComponent } from "vue";
import Logo from "@/assets/logo.svg";
import { UpwIcon } from "@upmind/upwind";
import UpmThemeSwitcher from "@/components/ThemeSwitcherDropdown.vue";

export default defineComponent({
  name: "UpmHeader",
  components: {
    Logo,
    UpwIcon,
    UpmThemeSwitcher,
  },
});
</script>
