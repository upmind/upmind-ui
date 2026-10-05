<template>
  <UpmPage>
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
      <Root>
        <!-- Page content from NuxtPage -->
        <slot />
      </Root>
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
import { UpmAuthAction } from "@upmind-automation/auth";
import { Root } from "@upmind-automation/foundation";
import { useRoutingEngine } from "@upmind-automation/headless";
import { useStorefrontRoute } from "../composables/useStorefrontRoute";
import { ROUTE } from "../funnels/types";
import UpmFooter from "../shell/components/footer/Footer.vue";
import UpmHeader from "../shell/components/header/Header.vue";
import UpmMain from "../shell/components/main/Main.vue";
import UpmOverlayController from "../shell/components/overlays/OverlayController.vue";
import { useOverlayRoute } from "../shell/components/overlays/useOverlayRoute";
import UpmPage from "../shell/components/page/Page.vue";
import UpmBasketAction from "../shell/modules/basket/components/BasketAction.vue";
import UpmLoading from "../shell/modules/system/Loading.vue";
import { includes } from "lodash-es";

// -----------------------------------------------------------------------------
const route = useRoute();
const { storefrontRoute } = useStorefrontRoute();

const { meta: routingMeta } = useRoutingEngine();

// Debounce before showing loader to avoid flashes on fast funnel resolution.
// Once shown, enforce a minimum display time so it doesn't flash off instantly.
const DEBOUNCE_DELAY = 1200;
const MIN_DISPLAY_TIME = 600;
const showLoader = ref(false);
let loaderTimeout: ReturnType<typeof setTimeout> | null = null;
let loaderShownAt: number | null = null;

watch(
  () => routingMeta.value.isLoading,
  loading => {
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
      if (showLoader.value && loaderShownAt) {
        const elapsed = Date.now() - loaderShownAt;
        const remaining = MIN_DISPLAY_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => {
            showLoader.value = false;
            loaderShownAt = null;
          }, remaining);
        } else {
          showLoader.value = false;
          loaderShownAt = null;
        }
      } else {
        showLoader.value = false;
      }
    }
  }
);

// --- computed

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
