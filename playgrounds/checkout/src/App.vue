<template>
  <div
    class="flex h-screen flex-wrap justify-center overflow-hidden bg-base text-base-content"
    :data-theme="activeTheme"
  >
    <upm-header></upm-header>

    <!-- provide padding for our fixed header 4.5rem -->
    <main
      class="flex h-full w-full flex-wrap justify-center overflow-hidden pt-[4.5rem]"
    >
      <router-view class="h-full w-full" :key="route.fullPath" />

      <footer
        class="flex w-full items-start justify-center gap-4 px-4 py-8 text-center text-sm"
      >
        <span>@copyright {{ new Date().getFullYear() }} Upmind Checkout.</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
// --- external
import { provide, ref, watch } from "vue";
import { useRoute } from "vue-router";

// --- internal
import UpmHeader from "@/components/Header.vue";

// --- utils

// ---
const route = useRoute();

// ---

const activeTheme = ref("light");
provide("activeTheme", activeTheme);

watch(route, () => {
  activeTheme.value = route?.query?.theme || activeTheme.value || "light";
});
</script>
