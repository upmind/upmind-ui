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
 * @description The ground an auth page is set on, and nothing else. The cart
 * gives its header and footer the SAME background as the body and no border, so
 * a two-column page's split runs the full height. A bar across the top would
 * cut it, which is why the wordmark and the legal line are placed by the
 * template, inside whichever column they belong to.
 */
import { ShellSkipLink } from "@upmind/ui";
import { PORTAL_AUTH_GROUND_CLASS } from "~/portal/shell/variants";

const props = defineProps<{
  /** The page's background, from the template — the cart sets one per layout. */
  ground: string;
}>();
</script>
