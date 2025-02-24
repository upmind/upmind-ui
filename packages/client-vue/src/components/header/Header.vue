<template>
  <header
    class="bg-base-background text-base-foreground md:bg-base-background top-0 z-[20] flex w-full flex-col items-center px-2 py-6 transition-all duration-500 md:px-0"
  >
    <div class="max-w-app mx-auto flex w-full items-center justify-between">
      <a id="logo" class="relative z-20" :href="storefrontUrl">
        <picture class="h-full w-full">
          <slot name="logo">
            <img src="@/assets/logo.svg" class="h-8" alt="logo" />
          </slot>
          <span class="sr-only">
            {{ t("header.title") }}
          </span>
        </picture>
      </a>

      <VHeaderButtons />
    </div>
  </header>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- components
import VHeaderButtons from "./HeaderButtons.vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();
const storefrontUrl: string = import.meta.env.VITE_APP_STOREFRONT;
const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
</script>
