<template>
  <header
    class="bg-base-background text-base-foreground md:bg-base-background top-0 z-[20] flex w-full flex-col items-center px-2 py-6 transition-all duration-500 md:px-0"
  >
    <div class="max-w-app mx-auto w-full">
      <div
        class="relative z-20 hidden w-full items-center justify-between md:flex"
      >
        <a class="relative z-20" :href="storefrontUrl">
          <picture class="h-full w-full">
            <img
              class="m-0 hidden h-8 md:block"
              src="/logo.svg?url"
              alt="logo"
            />
            <img
              class="m-0 h-8 md:hidden"
              src="/logo-small.svg?url"
              alt="logo"
            />
            <span class="sr-only">
              {{ t("header.title") }}
            </span>
          </picture>
        </a>

        <div class="hidden md:flex">
          <VHeaderButtons />
        </div>
      </div>
      <div class="flex w-full items-center justify-between md:hidden md:pb-5">
        <VHeaderButtons />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
// --- external
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import VHeaderButtons from "./HeaderButtons.vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();
const storefrontUrl: string = import.meta.env.VITE_APP_STOREFRONT;

const isScrollingDown = ref(false);
let lastScrollTop = 0;
const scrollThreshold = 50;

const handleScroll = () => {
  const currentScrollTop = Math.max(window.scrollY, 0);
  const scrollDifference = currentScrollTop - lastScrollTop;

  if (Math.abs(scrollDifference) > scrollThreshold) {
    isScrollingDown.value = scrollDifference > 0;
    lastScrollTop = currentScrollTop;
  }
};

onMounted(() => {
  // window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>
