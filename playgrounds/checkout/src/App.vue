<template>
  <suspense>
    <div
      class="relative flex min-h-screen flex-col items-start bg-base text-base-foreground antialiased"
      :data-theme="activeTheme"
    >
      <upm-header no-home></upm-header>

      <main class="prose flex w-full max-w-none flex-1 flex-col">
        <upm-feedback />

        <router-view
          class="view flex-1 gap-4 px-4 py-8 sm:px-6 lg:px-20"
          :key="route.fullPath"
        />

        <upm-session-expired auto />
      </main>

      <upm-footer />
    </div>
  </suspense>
</template>

<script setup>
// --- external
import { useRoute } from "vue-router";

// --- internal
import { UpmFeedback, useThemes, UpmSessionExpired } from "@upmind/client-vue";
import theme from "@/assets/theme";

// --- components
import UpmHeader from "@/components/Header.vue";
import UpmFooter from "@/components/Footer.vue";

// ---
const route = useRoute();
const { activeTheme } = useThemes(theme);
</script>
