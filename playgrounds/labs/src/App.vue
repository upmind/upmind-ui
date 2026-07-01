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

    <template #sidebar>
      <!-- Left Sidebar -->
      <aside
        class="sticky top-0 z-40 min-h-screen w-64 self-start border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      >
        <!-- Navigation -->
        <nav class="h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <ul class="space-y-1">
            <li v-for="(item, index) in navigation" :key="index">
              <NavSection :item="item" :depth="0" />
            </li>
          </ul>
        </nav>
      </aside>
    </template>

    <template #default="{ meta, loadingProps, resolve }">
      <!-- Main content area -->
      <div class="min-h-screen flex-1">
        <UpmRouteView :loading-props="loadingProps" @resolve="resolve" />
      </div>
    </template>
  </Upm>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Upm,
  UpmAuthAction,
  useRoutingEngine,
  useActiveSession,
  UpmRouteView
} from "@upmind-automation/client-vue";
import NavSection from "./components/NavSection.vue";
import { useNavigation } from "./composables/useNavigation";
import { ROUTE } from "./funnels";
import { includes } from "lodash-es";

const { navigation } = useNavigation();

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
  const { isAuthenticated } = useActiveSession().useMeta();
  watch(isAuthenticated, (isAuth, wasAuth) => {
    if (!routingMeta.value.isResolved) return;

    if (!isAuth && wasAuth && route.name !== ROUTE.SESSION_END) {
      router.push({ name: ROUTE.SESSION_END });
    }
  });
});
</script>
