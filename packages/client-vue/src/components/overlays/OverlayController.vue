<template>
  <!-- Overlay — rendered when route has meta.overlay -->
  <component
    :is="overlayContainer"
    v-bind="safeProps"
    :open="open"
    @close="handleDismiss"
    @update:open="handleDismiss"
  >
    <component :is="overlayComponent" @close="handleClose" />
  </component>
</template>

<script lang="ts" setup>
/**
 * Overlay Controller
 * Watches the current route for overlay meta and renders the appropriate
 * container (Drawer or Modal) with the overlay component from the matched route.
 * Place this in the app shell / layout — it handles all overlay routes.
 *
 * Components are resolved from the vue-router route record, not a separate registry.
 */

// --- external
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

// --- internal
import { OverlayType } from "@upmind-automation/headless";
import { useOverlayRoute } from "./useOverlayRoute";
import { Drawer, Dialog, Slot } from "@upmind-automation/upmind-ui";

// --- utils
import { defaults, find } from "lodash-es";

// --- types
import type { RouteRecordNormalized } from "vue-router";
import type { DrawerProps } from "@upmind-automation/upmind-ui";
import type { DialogProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<DrawerProps | DialogProps>(), {
  modal: undefined,
  noFooter: true
});

const route = useRoute();
const { isOpen, overlayType, close, dismiss } = useOverlayRoute();

/** Matched route with overlay meta */
const overlayRoute = computed(() => find(route.matched, "meta.overlay"));

/** Resolve container (Dialog or Drawer) from overlay type */
const overlayContainer = computed(() => {
  switch (overlayType.value) {
    case OverlayType.MODAL:
      return Dialog;

    case OverlayType.DRAWER:
      return Drawer;

    default:
    case OverlayType.CUSTOM:
      return Slot;
  }
});

/** Resolve content component from matched overlay route */
const overlayComponent = computed(
  () => overlayRoute.value?.components?.default
);

/** Props with sensible defaults based on overlay type, merged with route meta */
const safeProps = computed(() => {
  const metaProps = overlayRoute.value?.meta ?? {};

  switch (overlayType.value) {
    case OverlayType.MODAL:
      return defaults({}, metaProps, props) as DialogProps;

    case OverlayType.DRAWER:
      return defaults({}, metaProps, props) as DrawerProps;

    default:
    case OverlayType.CUSTOM:
      return props;
  }
});

/** Local open state — synced with route, but can be closed independently */
const open = ref(props.open ?? false);

watch(
  isOpen,
  value => {
    open.value = value;
  },
  { immediate: true }
);

/** Close after overlay flow completes (e.g. auth success) → returnUrl */
function handleClose(): void {
  if (!open.value) return;
  open.value = false;
  close();
}

/** Dismissed via backdrop click, X, or ESC → go back, fallback to "/" */
function handleDismiss(value: boolean): void {
  if (value || !open.value) return;
  open.value = false;
  dismiss();
}
</script>
