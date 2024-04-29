<template>
  <div
    class="flex min-h-screen flex-col items-start bg-base text-base-content"
    :data-theme="activeTheme"
  >
    <upm-header></upm-header>

    <main class="flex w-full flex-1 flex-col">
      <router-view
        class="view prose max-w-none flex-1 gap-4 px-4 py-8 sm:px-6 lg:px-20"
        :key="route.fullPath"
      />
    </main>

    <upm-footer />
  </div>
</template>

<script setup>
// --- external
import { useRoute } from "vue-router";

// --- internal
import UpmHeader from "@/components/Header.vue";
import UpmFooter from "@/components/Footer.vue";
import theme from "@/assets/theme";
import { useThemes } from "@upmind/client";

// ---
const route = useRoute();
const { activeTheme } = useThemes(theme);
</script>
