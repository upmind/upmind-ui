<template>
  <Upm :storefront-route="{ name: ROUTE.HOME }">
    <template #header-actions>
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
import { ROUTE } from "./funnels";
import { R } from "vue-router/dist/router-CWoNjPRp.mjs";

// -----------------------------------------------------------------------------
const route = useRoute();
const router = useRouter();
const { meta: routingMeta, isReady } = useRoutingEngine();

// --- computed
const isAuthRoute = computed(() =>
  includes(route.name?.toString() ?? "", ROUTE.SESSION)
);

// --- side effects

// set up automatic redirects when the user logs in or out or if the basket is emptied
isReady().then(() => {
  const { meta: sessionMeta } = useSession();
  watch(
    sessionMeta,
    ({ isAuthenticated }, { isAuthenticated: wasAuthenticated }) => {
      if (!routingMeta.value.isResolved) return;

      if (
        !isAuthenticated &&
        wasAuthenticated &&
        route.name !== ROUTE.SESSION_END
      ) {
        router.push({ name: ROUTE.SESSION_END });
      }
    }
  );
});
</script>
