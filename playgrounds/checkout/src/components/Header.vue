<template>
  <header
    class="flex w-full flex-wrap border-b border-gray-200 bg-base py-3 text-sm text-base-content sm:flex-nowrap sm:justify-start"
  >
    <nav
      class="relative mx-auto flex w-full flex-wrap items-center gap-4 px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-20"
      aria-label="Global"
    >
      <a
        class="flex h-10 w-auto items-center justify-between gap-3 text-xl font-semibold"
        href="/"
        aria-label="Brand"
      >
        <logo class="h-full w-full" />
        <span class="tracking-widest">Checkout&nbsp;v2</span>
      </a>
    </nav>
  </header>
</template>

<script>
import { defineComponent } from "vue";
import Logo from "@/assets/logo.svg";

export default defineComponent({
  name: "UpmHeader",
  components: {
    Logo,
  },
});
</script>
