<template>
  <slot />
  <Toaster />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module layouts/auth
 * @description The host seams the auth organisms need; their templates draw the page.
 */
import { Toaster } from "@upmind/ui";
import { computed, watch } from "vue";
import { provideShellComponents } from "@upmind-automation/foundation";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { useTheme } from "~/composables/useTheme";
import { PORTAL_AUTH_SHELL_COMPONENTS } from "~/portal/auth/shell";

const { activeConfig } = usePortalConfig();
const { setTheme } = useTheme();

provideShellComponents(computed(() => PORTAL_AUTH_SHELL_COMPONENTS));

// The shape's own brand, applied the same way the signed-in layout applies it.
watch(activeConfig, config => setTheme(config.theme ?? "upmind"), {
  immediate: true
});
</script>
