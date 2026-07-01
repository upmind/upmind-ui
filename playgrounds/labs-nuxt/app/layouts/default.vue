<template>
  <ImpersonationBar />

  <UpmPage>
    <UpmHeader :storefront-route="{ to: { name: ROUTE.HOME } }">
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- Scope selectors: Brand, Actor, Context -->
          <BrandScopeSelector />
          <ActorScopeSelector show-label />
          <ContextScopeSelector />
          <Button
            :color="isOpen ? 'primary' : 'secondary'"
            :variant="isOpen ? 'solid' : 'ghost'"
            icon-only
            icon="code-browser"
            label="Inspect"
            @click="toggle"
            :disabled="!hasSections"
          />
        </div>
      </template>
    </UpmHeader>

    <UpmMain class="pt-4">
      <!-- Left Sidebar -->
      <aside
        class="bg-surface border-surface sticky top-0 z-40 min-h-screen w-64 self-start rounded-sm shadow"
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

      <!-- Main content area -->
      <UpmRoot>
        <slot />
      </UpmRoot>
    </UpmMain>
  </UpmPage>

  <!-- Inspector sidebar (fixed position) -->
  <Inspector />
</template>

<script lang="ts" setup>
import {
  UpmPage,
  UpmHeader,
  UpmMain,
  UpmRoot,
  useRoutingEngine,
  useActiveSession,
  useSessionStore
} from "@upmind-automation/client-vue";
import { Button } from "@upmind-automation/upmind-ui";
import { includes } from "lodash-es";
import { Inspector, useInspector } from "~/components/inspector";
import NavSection from "~/components/NavSection.vue";
import {
  ActorScopeSelector,
  BrandScopeSelector,
  ContextScopeSelector,
  ImpersonationBar
} from "~/components/scope";
import { useNavigation } from "~/composables/useNavigation";
import { ROUTE } from "~/funnels";
// -----------------------------------------------------------------------------
const { navigation } = useNavigation();
const route = useRoute();
const router = useRouter();
const { meta: routingMeta, isReady } = useRoutingEngine();

// --- debug items
const { hasSections, isOpen, toggle, register } = useInspector();

// --- computed
const _isAuthRoute = computed(() =>
  includes(route.name?.toString() ?? "", ROUTE.SESSION)
);

// --- side effects
// set up automatic redirects when the user logs in or out
isReady().then(() => {
  const { isAuthenticated } = useActiveSession().useMeta();
  watch(isAuthenticated, (isAuth, wasAuth) => {
    if (!routingMeta.value.isResolved) return;

    if (!isAuth && wasAuth && route.name !== ROUTE.SESSION_END) {
      router.push({ name: ROUTE.SESSION_END });
    }
  });
});

// --- Session information for authenticated actor (if any)
const activeSession = useActiveSession();
const { actor, session } = activeSession.useContext();
const sessionStore = useSessionStore();
const { clientSessions, guestSession, impersonatedSessions, staffSessions } =
  sessionStore.useContext();

register(
  {
    key: "useAuth-session",
    factory: () => ({
      name: "Session (Scoped)",
      state: actor.value || "guest",
      meta: activeSession.useMeta(),
      context: {
        session: session.value,
        sessions: {
          staff: staffSessions.value,
          clients: clientSessions.value,
          guest: guestSession.value,
          impersonatedSessions: impersonatedSessions.value
        }
      }
    })
  },
  true
);
</script>
