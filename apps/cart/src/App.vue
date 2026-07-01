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
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  Upm,
  UpmBasketAction,
  UpmAuthAction,
  useOverlayRoute
} from "@upmind-automation/client-vue";
import { ROUTE } from "./router";
import { useStorefrontRoute } from "./router/useStorefrontRoute";
import { includes } from "lodash-es";

// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
const route = useRoute();

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
</script>
