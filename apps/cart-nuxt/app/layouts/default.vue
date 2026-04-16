<template>
  <UpmPage :class="styles.page">
    <UpmHeader :storefront-route="storefrontRoute">
      <template #actions>
        <UpmBasketAction :basket-route="{ name: ROUTE.BASKET }" />
        <UpmAuthAction
          v-if="!isAuthRoute"
          :login-route="{ name: ROUTE.SESSION_LOGIN }"
          :register-route="{ name: ROUTE.SESSION_REGISTER }"
          :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
        />
      </template>
    </UpmHeader>

    <UpmMain>
      <UpmLoading v-if="routingMeta.isLoading" modal />
      <UpmRoot>
        <!-- Page content from NuxtPage -->
        <slot />
      </UpmRoot>
    </UpmMain>

    <UpmFooter />

    <!-- Overlay routes — auth, 2fa, verify-email -->
    <UpmOverlayController />

    <!-- <UpmFeedback :storefront-route="storefrontRoute" /> -->
  </UpmPage>
</template>

<script lang="ts" setup>
/**
 * Default Layout
 *
 * Reconstructs the Upmind shell using modular components.
 * Session/basket redirect watchers are handled by the funnel engine (watchers.ts).
 */
import {
  UpmPage,
  UpmHeader,
  UpmFooter,
  UpmMain,
  // UpmFeedback,
  UpmLoading,
  UpmRoot,
  UpmBasketAction,
  UpmAuthAction,
  UpmOverlayController,
  useOverlayRoute,
  useRoutingEngine
} from "@upmind-automation/client-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import { includes, get } from "lodash-es";
import { ROUTE } from "~/funnels/types";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";

// -----------------------------------------------------------------------------
const route = useRoute();
const { storefrontRoute } = useStorefrontRoute();

const { meta: routingMeta } = useRoutingEngine();


// --- computed

// add any page specific styles here based on route or other state
const styles = useStyles(
  ["page"],
  computed(() => {
    return {
      route: get(route, "name", get(route, "path", ""))
    };
  })
) as any;

const { isOpen: isOverlayOpen, overlayId } = useOverlayRoute();

const isAuthRoute = computed(
  () =>
    // Hide auth action on dedicated auth pages
    includes(
      [
        ROUTE.SESSION,
        ROUTE.SESSION_END,
        ROUTE.SESSION_LOGIN,
        ROUTE.SESSION_REGISTER,
        ROUTE.SESSION_RECOVER_PASSWORD,
        ROUTE.SESSION_TRANSFER
      ],
      route.name as string
    ) ||
    // Also hide when auth overlay is open
    (isOverlayOpen.value && overlayId.value === "auth")
);
</script>
