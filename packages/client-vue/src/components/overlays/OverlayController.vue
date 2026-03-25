<template>
  <!-- Overlay — rendered when route has meta.overlay -->
  <component
    :is="overlayContainer"
    v-if="isOpen && overlayComponent"
    :open="drawerOpen"
    size="lg"
    @close="handleDismiss"
  >
    <component :is="overlayComponent" @close="handleClose" />
  </component>
</template>

<script lang="ts" setup>
/**
 * Overlay Controller
 * Watches the current route for overlay meta and renders the appropriate
 * container (Drawer or Modal) with the registered overlay content component.
 * Place this in the app shell / layout — it handles all overlay routes.
 *
 * Uses a local `drawerOpen` ref so the Drawer can begin its close animation
 * immediately when content emits close, without waiting for async route guards.
 */

// --- external
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

// --- internal
import { OverlayType, useSession } from "@upmind-automation/headless";
import { useOverlayRoute } from "./useOverlayRoute";
import { Drawer, Dialog } from "@upmind-automation/upmind-ui";

// --- utils
import { get } from "lodash-es";

// --- registry
import { OVERLAY_REGISTRY } from "./overlayRegistry";

// -----------------------------------------------------------------------------

const route = useRoute();
const { isOpen, overlayId, overlayType, close, dismiss } = useOverlayRoute();
const { meta: sessionMeta } = useSession();

/** Resolve container (Dialog or Drawer) from overlay type */
const overlayContainer = computed(() =>
  overlayType.value === OverlayType.MODAL ? Dialog : Drawer
);

/** Resolve content component from registry by overlayId */
const overlayComponent = computed(() =>
  overlayId.value ? get(OVERLAY_REGISTRY, overlayId.value) : undefined
);

/** Local open state — synced with route, but can be closed independently */
const drawerOpen = ref(false);

watch(
  isOpen,
  open => {
    // Auth guard (defense-in-depth): if user is already authenticated
    // and the overlay requires a guest, close immediately.
    // Primary guard is in useRouting guardRoute — this catches edge cases.
    if (
      open &&
      route.meta?.requiresGuest &&
      sessionMeta.value.isAuthenticated
    ) {
      close();
      return;
    }
    drawerOpen.value = open;
  },
  { immediate: true }
);

/** Close after overlay flow completes (e.g. auth success) → returnRoute */
function handleClose(): void {
  if (!drawerOpen.value) return;
  drawerOpen.value = false;
  close();
}

/** Dismissed via backdrop click → go back, fallback to "/" */
function handleDismiss(): void {
  if (!drawerOpen.value) return;
  drawerOpen.value = false;
  dismiss();
}
</script>
