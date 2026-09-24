<template>
  <div :class="[props.ground, PORTAL_AUTH_GROUND_CLASS]">
    <ShellSkipLink target="portal-auth-main" label="Skip to content" />
    <slot />
  </div>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/auth/PortalAuthShell
 * @description The ground an auth page is set on, and nothing else.
 */
import { ShellSkipLink } from "@upmind/ui";
import { PORTAL_AUTH_GROUND_CLASS } from "~/portal/shell/variants";

const props = defineProps<{
  ground: string;
}>();
</script>
