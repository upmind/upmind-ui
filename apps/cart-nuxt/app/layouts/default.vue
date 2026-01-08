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

    <!-- Page content from NuxtPage -->
    <template #default>
      <slot />
    </template>
  </Upm>
</template>

<script lang="ts" setup>
/**
 * Default Layout
 *
 * Wraps pages in the Upm component from client-vue.
 * Handles session/basket state watchers for automatic redirects.
 */
import {
  Upm,
  UpmBasketAction,
  UpmAuthAction,
  useBasket,
  useSession
} from "@upmind-automation/client-vue";
import { includes } from "lodash-es";
import { ROUTE } from "~/utils/routes";

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
    route.name as string
  )
);

// --- side effects

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
