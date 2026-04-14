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
      <UpmLoading v-if="showLoader" modal />
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
 * Handles session/basket state watchers for automatic redirects.
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
  useBasket,
  useSession,
  useOverlayRoute
} from "@upmind-automation/client-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import { includes, get } from "lodash-es";
import { ROUTE } from "~/funnels/types";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";

// -----------------------------------------------------------------------------
const route = useRoute();
const { storefrontRoute } = useStorefrontRoute();
const router = useRouter();

const { isLoading } = useLoadingIndicator();

// Delayed loader - only show after threshold to prevent flash on quick transitions
// Once shown, enforce minimum display time to complete at least one animation cycle
const DEBOUNCE_DELAY = 1200;
const MIN_DISPLAY_TIME = 600;
const showLoader = ref(false);
let loaderTimeout: ReturnType<typeof setTimeout> | null = null;
let loaderShownAt: number | null = null;
let minDisplayTimeout: ReturnType<typeof setTimeout> | null = null;

watch(isLoading, loading => {
  if (loading) {
    loaderTimeout = setTimeout(() => {
      showLoader.value = true;
      loaderShownAt = Date.now();
    }, DEBOUNCE_DELAY);
  } else {
    if (loaderTimeout) {
      clearTimeout(loaderTimeout);
      loaderTimeout = null;
    }

    // If loader is showing, ensure minimum display time before hiding
    if (showLoader.value && loaderShownAt) {
      const elapsed = Date.now() - loaderShownAt;
      const remaining = MIN_DISPLAY_TIME - elapsed;

      if (remaining > 0) {
        // Wait for the remaining time before hiding
        minDisplayTimeout = setTimeout(() => {
          showLoader.value = false;
          loaderShownAt = null;
          minDisplayTimeout = null;
        }, remaining);
      } else {
        // Minimum time already passed, hide immediately
        showLoader.value = false;
        loaderShownAt = null;
      }
    } else {
      showLoader.value = false;
    }
  }
});

const { meta: basketMeta } = useBasket();
const { meta: sessionMeta } = useSession();

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

// --- side effects

watch(
  [basketMeta, sessionMeta],
  (
    [
      { hasProducts, isComplete, isCheckout, isUnavailable },
      { isAuthenticated }
    ],
    [
      { hasProducts: hadProducts, isUnavailable: wasUnavailable },
      { isAuthenticated: wasAuthenticated }
    ]
  ) => {
    if (!isAuthenticated && wasAuthenticated) {
      router.push({ name: ROUTE.SESSION_END });
    } else if (isUnavailable && !wasUnavailable && isAuthenticated) {
      router.push({ name: ROUTE.BASKET_UNAVAILABLE });
    } else if (!hasProducts && hadProducts && !isCheckout && !isComplete) {
      if (route.meta.actionEmptyBasket) {
        router.push({ name: ROUTE.BASKET_EMPTY });
      }
    }
  }
);
</script>
