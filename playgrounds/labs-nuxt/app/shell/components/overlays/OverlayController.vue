<template>
  <!-- Overlay — rendered only when layered over a base page. When the overlay
       route is the active destination itself (e.g. visiting /overlays/verify-email
       directly), the main RouteView already renders it — rendering it here too
       would mount it twice. -->
  <OverlayContainer
    v-if="isLayered"
    :type="overlayType"
    v-bind="safeProps"
    :open="open"
    @update:open="handleDismiss"
  >
    <component
      :is="overlayComponent"
      @close="handleClose"
      @vue:mounted="mountOverlay"
    />
  </OverlayContainer>
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

import { useRoute } from "vue-router";
import { OverlayContainer } from "@upmind-automation/foundation";
import { useRoutingEngine } from "@upmind-automation/headless";
import { useOverlayRoute } from "./useOverlayRoute";
import { defaults, find, pick, some, toString } from "lodash-es";
import type { OverlayContainerProps } from "@upmind-automation/foundation";

// -----------------------------------------------------------------------------

// type is derived from the route (overlayType), not passed in
const props = withDefaults(defineProps<Omit<OverlayContainerProps, "type">>(), {
  modal: undefined
});

const route = useRoute();
const { isOpen, overlayType, close, dismiss } = useOverlayRoute();
const { mount } = useRoutingEngine();

/** Local open state — synced with route, but can be closed independently */
const open = ref(props.open ?? false);

/** Matched route with overlay meta */
const overlayRoute = computed(() => find(route.matched, "meta.overlay"));

/**
 * True only when the overlay is layered over a base page — i.e. `route.matched`
 * contains a non-overlay route with its own component (e.g. `checkout`). When
 * the overlay route is the active destination itself (matched only alongside the
 * `/overlays/` redirect container), this is false and the main RouteView renders
 * the route — so we must not also render it here.
 */
const isLayered = computed(() =>
  some(route.matched, r => !r.meta?.overlay && !!r.components?.default)
);

/** Resolve content component from matched overlay route */
const overlayComponent = computed(
  () => overlayRoute.value?.components?.default
);

// Route meta carries the host router's own page keys alongside the overlay's,
// so only the container's props are forwarded. `type` is bound explicitly from
// overlayType and is left out here to avoid a double-bind.
const CONTAINER_PROP_KEYS = [
  "open",
  "modal",
  "title",
  "description",
  "size",
  "dismissable",
  "noHeader",
  "class",
  "classContent",
  "classHeader"
] as const satisfies readonly (keyof OverlayContainerProps)[];

/** Route meta (title/size…) merged over the controller's own props. */
const safeProps = computed(() =>
  pick(defaults({}, overlayRoute.value?.meta ?? {}, props), CONTAINER_PROP_KEYS)
);

watch(
  isOpen,
  value => {
    open.value = value;
  },
  { immediate: true }
);

/**
 * An overlay renders here, not in the page outlet, so Nuxt's `page:finish`
 * never fires for it. Its mount is the engine's signal that the navigation landed.
 */
function mountOverlay(): void {
  mount(toString(route.name));
}

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
