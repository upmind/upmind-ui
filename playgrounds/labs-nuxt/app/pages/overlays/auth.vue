<template>
  <UpmAuth
    :model-value="mode"
    :cancel-route="{ name: ROUTE.HOME }"
    @resolve="emit('close')"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module pages/overlays/auth
 * @description The auth-collect OVERLAY — the session form a guarded route
 * opens over itself, rather than sitting on skeletons that never settle (D2).
 *
 * It is the cart's `AuthOverlay` in this playground: the route carries the
 * overlay meta, `registerOverlayRoutes` injects it as `<parent>--auth` onto
 * every eligible page, and the shared `OverlayController` renders it in the
 * modal container over whatever page is underneath. On success it emits close,
 * and the controller navigates back to the parent route — where the composable
 * this playground boots re-reads the now-authenticated session by itself.
 */

import {
  OverlayType,
  SESSION_FORMS,
  UpmAuth
} from "@upmind-automation/client-vue";
import { get } from "lodash-es";
import type { SessionProps } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.OVERLAY_AUTH,
  overlay: OverlayType.MODAL
});

const route = useRoute();

const emit = defineEmits<{
  close: [];
}>();

/** Which form opens first — `?mode=login|register`, else the route's own. */
const mode = computed(
  () =>
    get(
      route,
      "query.mode",
      get(route, "meta.mode", SESSION_FORMS.LOGIN)
    ) as SessionProps["modelValue"]
);
</script>
