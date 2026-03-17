<template>
  <!-- Overlay — rendered when route has meta.overlay -->
  <component
    :is="overlayContainer"
    v-if="isOpen && overlayComponent"
    open
    size="lg"
    @close="close"
  >
    <component :is="overlayComponent" @close="close" />
  </component>
</template>

<script lang="ts" setup>
/**
 * Overlay Controller
 * Watches the current route for overlay meta and renders the appropriate
 * container (Drawer or Modal) with the registered overlay content component.
 * Place this in the app shell / layout — it handles all overlay routes.
 */

// --- external
import { computed } from "vue";

// --- internal
import { useOverlayRoute, OverlayType } from "@upmind-automation/headless";
import { Drawer, Modal } from "@upmind-automation/upmind-ui";

// --- utils
import { get } from "lodash-es";

// --- registry
import { OVERLAY_REGISTRY } from "./overlayRegistry";

// -----------------------------------------------------------------------------

const { isOpen, overlayId, overlayType, close } = useOverlayRoute();

/** Resolve container (Drawer or Modal) from overlay type */
const overlayContainer = computed(() =>
  overlayType.value === OverlayType.MODAL ? Modal : Drawer
);

/** Resolve content component from registry by overlayId */
const overlayComponent = computed(() =>
  overlayId.value ? get(OVERLAY_REGISTRY, overlayId.value) : undefined
);
</script>
