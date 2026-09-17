<template>
  <NuxtLayout name="logged-out">
    <PortalAuthShell variant="centered" card>
      <slot />
    </PortalAuthShell>
  </NuxtLayout>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module layouts/logged-out-page
 * @description The logged-out screens this app draws itself — verification,
 * reset, preferences. They take the same chrome the auth templates draw, on the
 * centred arrangement the screens have always used.
 *
 * The auth screens do NOT use this layout: their page comes from the `auth`
 * package's template slot, so the arrangement is the brand's to choose.
 */
import PortalAuthShell from "~/portal/auth/PortalAuthShell.vue";
</script>
