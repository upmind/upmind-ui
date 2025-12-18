<template>
  <Upm :storefront-route="{ name: ROUTE.STOREFRONT }">
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
  useSession
} from "@upmind-automation/client-vue";

// --- utils
import { includes } from "lodash-es";

// --- types
import { ROUTE } from "./router";

// -----------------------------------------------------------------------------
const route = useRoute();
const router = useRouter();

const { meta: basketMeta } = useBasket();
const { meta: sessionMeta } = useSession();
// --- computed

const isAuthRoute = computed(() =>
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
  )
);

// --- side effects

// set up automatic redirects when the user logs in or out or if the basket is emptied
watch(
  [basketMeta, sessionMeta],
  (
    [{ hasProducts, isComplete, isCheckout }, { isAuthenticated }],
    [{ hasProducts: hadProducts }, { isAuthenticated: wasAuthenticated }]
  ) => {
    if (!isAuthenticated && wasAuthenticated) {
      router.push({ name: ROUTE.SESSION_END });
    } else if (!hasProducts && hadProducts && !isCheckout && !isComplete) {
      if (route.meta.actionEmptyBasket) {
        router.push({ name: ROUTE.BASKET_EMPTY });
      }
    }
  }
);
</script>
