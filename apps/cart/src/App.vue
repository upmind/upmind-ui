<template>
  <Upm :storefront-route="storefrontRoute">
    <template #header-actions>
      <UpmBasketAction :basket-route="{ name: ROUTE.BASKET }" />
      <UpmAuthAction
        v-if="!isAuthRoute"
        :login-route="{ name: ROUTE.SESSION_LOGIN }"
        :register-route="{ name: ROUTE.SESSION_REGISTER }"
        :recover-route="{ name: ROUTE.SESSION_RECOVER_PASSWORD }"
      />
    </template>
  </Upm>
</template>

<script lang="ts" setup>
// --- external
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

// --- internal
import {
  Upm,
  UpmBasketAction,
  UpmAuthAction,
  useBasket,
  useRoutingEngine,
  useSession,
  useOverlayRoute
} from "@upmind-automation/client-vue";

// --- utils
import { includes } from "lodash-es";

// --- types
import { ROUTE } from "./router";

// --- composables
import { useStorefrontRoute } from "./composables/useStorefrontRoute";

// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
const route = useRoute();
const router = useRouter();
const { meta: routingMeta, isReady } = useRoutingEngine();

const { isOpen: isOverlayOpen, overlayId } = useOverlayRoute();

// --- computed
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
      route.name
    ) ||
    // Also hide when auth overlay is open
    (isOverlayOpen.value && overlayId.value === "auth")
);

// --- side effects

// set up automatic redirects when the user logs in or out or if the basket is emptied
isReady().then(() => {
  const { meta: basketMeta } = useBasket();
  const { meta: sessionMeta } = useSession();
  watch(
    [basketMeta, sessionMeta],
    (
      [
        { hasProducts, isComplete, isCheckout, isUnavailable, isAvailable },
        { isAuthenticated }
      ],
      [
        { hasProducts: hadProducts, isUnavailable: wasUnavailable },
        { isAuthenticated: wasAuthenticated }
      ]
    ) => {
      if (!routingMeta.value.isResolved) return;
      /* If we were authenticated and now we are not, redirect to the session end page */
      if (
        !isAuthenticated &&
        wasAuthenticated &&
        route.name !== ROUTE.SESSION_END
      ) {
        return router.push({ name: ROUTE.SESSION_END });
      }

      /* If the basket is unavailable and we are authenticated, redirect to the basket unavailable page */
      if (
        isUnavailable &&
        !wasUnavailable &&
        isAuthenticated &&
        route.name !== ROUTE.BASKET_UNAVAILABLE
      ) {
        return router.replace({ name: ROUTE.BASKET_UNAVAILABLE });
      }

      /** If the basket is available and we have no products and we had products
       *  and we are not in the process of checking out
       *  and we the basket is NOT complete */
      if (
        !isUnavailable &&
        !hasProducts &&
        hadProducts &&
        !isCheckout &&
        !isComplete
      ) {
        if (route.meta.actionEmptyBasket && route.name !== ROUTE.BASKET_EMPTY) {
          return router.push({ name: ROUTE.BASKET_EMPTY });
        }
      }
    }
  );
});
</script>
