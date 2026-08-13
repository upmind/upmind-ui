<template>
  <UpmPage>
    <UpmHeader :storefront-route="{ to: { name: ROUTE.HOME } }">
      <template #actions>
        <ScopeBar />
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

      <!-- Main content area. `min-w-0` stops the column EXPORTING its content
           width: a flex item defaults to `min-width:auto`, so a row that
           outgrew its share squeezed the sidebar and gave the DOCUMENT a
           horizontal scrollbar instead of truncating inside the page (`AC2.4`).
           It takes no width in any state, so it is not `P1-R5` compensation. -->
      <UpmRoot class="min-w-0">
        <slot />
      </UpmRoot>
    </UpmMain>

    <!-- Overlay routes — the auth a guarded scenario collects in place -->
    <UpmOverlayController />
  </UpmPage>

  <!-- The ONE sheet over the page — Debug │ Code │ Scenario, opened by the
       toggle in the page's own scenario bar (`G1`) and never by the chrome.
       Mounted here, once: it overlays the canvas, so nothing above it
       compensates with padding and the page keeps its full width (`P1-R5`). -->
  <SheetHost />

  <!-- Where every action outcome is reported (`useActionFeedback`). Top-centre
       because the bottom corner is where the operator missed it entirely (E13):
       the outcome lands in the path of the eye that just clicked, over the
       surface it happened on. -->
  <Sonner
    position="top-center"
    close-button
    rich-colors
    expand
    :visible-toasts="6"
    :duration="6000"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import {
  UpmPage,
  UpmHeader,
  UpmMain,
  UpmOverlayController,
  UpmRoot,
  useRoutingEngine,
  useActiveSession,
  useSessionStore
} from "@upmind-automation/client-vue";
import { Sonner } from "@upmind-automation/upmind-ui";
import { includes } from "lodash-es";
import NavSection from "~/components/NavSection.vue";
import { ScopeBar } from "~/components/scope";
import { SheetHost, usePlaygroundSheet } from "~/components/sheets";
import { useNavigation } from "~/composables/useNavigation";
import { ROUTE } from "~/funnels";
// -----------------------------------------------------------------------------
const { navigation } = useNavigation();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { meta: routingMeta, isReady } = useRoutingEngine();

// --- debug items
const { register } = usePlaygroundSheet();

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
      // The section NAME is what the host draws as the tab (`SheetHost`), so it
      // is resolved here rather than carried as a key the tab would print raw.
      name: t("labs.debug_session"),
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
