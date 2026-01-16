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

    <template #navigation>
      <div class="bg-surface flex min-h-screen">
        <!-- Left Sidebar -->
        <aside
          class="fixed top-0 left-0 z-40 h-screen w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <!-- Logo / Header -->
          <div
            class="flex h-16 items-center border-b border-neutral-200 px-4 dark:border-neutral-800"
          >
            <RouterLink
              :to="{ name: ROUTE.HOME }"
              class="flex items-center gap-2"
            >
              <div
                class="bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg text-white"
              >
                <Icon icon="beaker-01" size="sm" />
              </div>
              <span
                class="text-lg font-semibold text-neutral-900 dark:text-white"
                >Upmind Labs</span
              >
            </RouterLink>
          </div>

          <!-- Navigation -->
          <nav class="h-[calc(100vh-4rem)] overflow-y-auto p-4">
            <ul class="space-y-1">
              <li v-for="(item, index) in navigation" :key="index">
                <NavSection :item="item" :depth="0" />
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </template>
  </Upm>
</template>

<script lang="ts" setup>
// --- external
import { computed, watch } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";

// --- internal
import {
  Upm,
  UpmBasketAction,
  UpmAuthAction,
  useBasket,
  useRoutingEngine,
  useSession
} from "@upmind-automation/client-vue";

// --- components
import { Icon } from "@upmind-automation/upmind-ui";
import NavSection from "./components/NavSection.vue";

// --- composables
import { useNavigation } from "./composables/useNavigation";

const { navigation } = useNavigation();

// --- utils
import { includes } from "lodash-es";
import { ROUTE } from "./funnels";

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
