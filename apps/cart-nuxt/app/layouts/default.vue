<template>
  <UpmPage :class="styles.page">
    <UpmHeader :storefront-route="{ name: ROUTE.STOREFRONT }">
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
      <UpmLoading v-if="showLoader" />
      <UpmRoot v-show="!showLoader">
        <!-- Page content from NuxtPage -->
        <slot />
      </UpmRoot>
    </UpmMain>

    <UpmFooter />
    <!-- <UpmFeedback :storefront-route="{ name: ROUTE.STOREFRONT }" /> -->
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
  useBasket,
  useSession
} from "@upmind-automation/client-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import { includes, get } from "lodash-es";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------
const route = useRoute();
const router = useRouter();

const { isLoading } = useLoadingIndicator();

// Delayed loader - only show after threshold to prevent flash on quick transitions
const DEBOUNCE_DELAY = 600;
const showLoader = ref(false);
let loaderTimeout: ReturnType<typeof setTimeout> | null = null;

watch(isLoading, loading => {
  if (loading) {
    loaderTimeout = setTimeout(() => {
      showLoader.value = true;
    }, DEBOUNCE_DELAY);
  } else {
    if (loaderTimeout) {
      clearTimeout(loaderTimeout);
      loaderTimeout = null;
    }
    showLoader.value = false;
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
