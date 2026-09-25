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
import { computed } from "vue";
import {
  provideShellComponents,
  provideThemeEngine
} from "@upmind-automation/foundation";
import { useTheme } from "~/composables/useTheme";
import { PORTAL_AUTH_SHELL_COMPONENTS } from "~/portal/auth/shell";

const { setTheme } = useTheme();

provideThemeEngine({ set: setTheme });

provideShellComponents(computed(() => PORTAL_AUTH_SHELL_COMPONENTS));
</script>
