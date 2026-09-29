<template>
  <slot />
  <Toaster />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module layouts/auth
 * @description The frame the auth pages render in; their templates draw the page.
 */
import { Toaster } from "@upmind/ui";
import { watch } from "vue";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { useTheme } from "~/composables/useTheme";

const { activeConfig } = usePortalConfig();
const { setTheme } = useTheme();

// The shape's own brand, applied the same way the signed-in layout applies it.
watch(activeConfig, config => setTheme(config.theme ?? "upmind"), {
  immediate: true
});
</script>
